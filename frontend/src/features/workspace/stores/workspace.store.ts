import { create } from "zustand";
import { nanoid } from "nanoid";

import { backendClient } from "@/lib/backend/client";
import type { SavedRequest } from "@/features/collections/types";
import { useCollectionsStore } from "@/features/collections/stores/collections.store";
import type {
  Environment,
  KeyValuePair,
  RequestTab,
  WorkspaceProtocol,
  WorkspaceState,
} from "../types";
import { createWorkspaceTab } from "../utils/create-workspace-tab";
import { resolveTabTitle } from "./tab-title";

type WorkspaceLayout = "vertical" | "horizontal";

type WorkspaceUiState = {
  layout: WorkspaceLayout;
  isReady: boolean;
  setLayout: (layout: WorkspaceLayout) => void;
  initialize: () => Promise<void>;
};

type WorkspaceStore = {
  tabsById: Record<string, RequestTab>;
  tabOrderByCollection: Record<string, string[]>;
  activeTabIdByCollection: Record<string, string>;
  currentCollectionId: string;
  environments: Environment[];
  activeEnvironmentId: string;

  createTab: (protocol?: WorkspaceProtocol, collectionId?: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  setCurrentCollection: (collectionId: string) => void;
  updateTab: (tabId: string, data: Partial<RequestTab>) => void;
  openSavedRequest: (savedRequest: SavedRequest) => void;
  saveTabToCollection: (
    tabId: string,
    options?: { name?: string; folderId?: string | null; collectionId?: string },
  ) => Promise<SavedRequest | null>;
  removeCollectionState: (collectionId: string) => void;
  handleDeletedSavedRequest: (collectionId: string, requestId: string) => void;
  handleRenamedSavedRequest: (requestId: string, name: string) => void;
  reconcileCollections: (collectionIds: string[]) => void;

  createEnvironment: () => void;
  setActiveEnvironment: (environmentId: string) => void;
  updateEnvironment: (environmentId: string, data: Partial<Environment>) => void;
  deleteEnvironment: (environmentId: string) => void;
  addEnvironmentVariable: (environmentId: string) => void;
  updateEnvironmentVariable: (
    environmentId: string,
    variableId: string,
    data: Partial<KeyValuePair>,
  ) => void;
  removeEnvironmentVariable: (environmentId: string, variableId: string) => void;
};

function createDefaultEnvironment(): Environment {
  return {
    id: nanoid(),
    name: "Default",
    variables: [],
  };
}

function mapTabsById(tabs: RequestTab[]) {
  return tabs.reduce<Record<string, RequestTab>>((acc, tab) => {
    acc[tab.id] = tab;
    return acc;
  }, {});
}

function buildActiveTabByCollection(
  tabOrderByCollection: Record<string, string[]>,
  existing?: Record<string, string>,
) {
  const next: Record<string, string> = { ...(existing ?? {}) };
  for (const [collectionId, tabIds] of Object.entries(tabOrderByCollection)) {
    if (!tabIds.length) continue;
    const existingActive = next[collectionId];
    if (!existingActive || !tabIds.includes(existingActive)) {
      next[collectionId] = tabIds[tabIds.length - 1];
    }
  }
  return next;
}

function reconcileTabOrder(
  sourceTabs: RequestTab[],
  persistedOrder: Record<string, string[]> | undefined,
): Record<string, string[]> {
  const known = new Map(sourceTabs.map((tab) => [tab.id, tab]));
  const result: Record<string, string[]> = {};

  if (persistedOrder) {
    for (const [collectionId, tabIds] of Object.entries(persistedOrder)) {
      const filtered = tabIds.filter((id) => known.has(id));
      if (filtered.length > 0) {
        result[collectionId] = filtered;
      }
    }
  }

  const placedIds = new Set(Object.values(result).flat());
  for (const tab of sourceTabs) {
    if (placedIds.has(tab.id)) continue;
    const collectionId = tab.collectionId || "";
    if (!collectionId) {
      continue;
    }
    if (!result[collectionId]) {
      result[collectionId] = [];
    }
    result[collectionId].push(tab.id);
  }

  return result;
}

function sanitizeState(state: Partial<WorkspaceState> | null | undefined): WorkspaceState {
  const incomingTabs = state?.tabs ?? [];
  const sourceTabs = incomingTabs.map((tab) => ({
    ...tab,
    collectionId: tab.collectionId || "",
    savedRequestId: tab.savedRequestId ?? null,
  }));

  const tabOrderByCollection = reconcileTabOrder(
    sourceTabs,
    state?.tabOrderByCollection,
  );

  const activeTabIdByCollection = buildActiveTabByCollection(
    tabOrderByCollection,
    state?.activeTabIdByCollection,
  );

  const collectionIds = Object.keys(tabOrderByCollection);
  const currentCollectionId =
    state?.currentCollectionId && collectionIds.includes(state.currentCollectionId)
      ? state.currentCollectionId
      : collectionIds[0] ?? "";

  const environments = state?.environments?.length
    ? state.environments
    : [createDefaultEnvironment()];

  const activeEnvironmentId = environments.some(
    (environment) => environment.id === state?.activeEnvironmentId,
  )
    ? (state?.activeEnvironmentId as string)
    : environments[0].id;

  return {
    tabs: sourceTabs,
    tabOrderByCollection,
    activeTabIdByCollection,
    currentCollectionId,
    environments,
    activeEnvironmentId,
  };
}

function serializeTabs(state: WorkspaceStore & WorkspaceUiState): RequestTab[] {
  return Object.values(state.tabsById).sort((a, b) => a.createdAt - b.createdAt);
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleWorkspaceSave(get: () => WorkspaceStore & WorkspaceUiState) {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    const state = get();
    if (!state.isReady) {
      return;
    }

    const payload: WorkspaceState = {
      tabs: serializeTabs(state),
      tabOrderByCollection: state.tabOrderByCollection,
      activeTabIdByCollection: state.activeTabIdByCollection,
      currentCollectionId: state.currentCollectionId,
      environments: state.environments,
      activeEnvironmentId: state.activeEnvironmentId,
    };

    void backendClient.saveWorkspaceState(payload).catch((error) => {
      console.error("Failed to persist workspace state", error);
    });
  }, 250);
}

function ensureCollectionHasTab(
  state: WorkspaceStore & WorkspaceUiState,
  collectionId: string,
): WorkspaceStore {
  const collectionTabIds = state.tabOrderByCollection[collectionId] ?? [];
  if (collectionTabIds.length) {
    return state;
  }
  const nextTab = createWorkspaceTab("http", collectionId);
  return {
    ...state,
    tabsById: {
      ...state.tabsById,
      [nextTab.id]: nextTab,
    },
    tabOrderByCollection: {
      ...state.tabOrderByCollection,
      [collectionId]: [nextTab.id],
    },
    activeTabIdByCollection: {
      ...state.activeTabIdByCollection,
      [collectionId]: nextTab.id,
    },
  };
}

function getFallbackCollectionId(
  preferred: string,
  collectionIds: string[],
  tabOrderByCollection: Record<string, string[]>,
): string {
  if (collectionIds.includes(preferred)) {
    return preferred;
  }
  const fromTabs = Object.keys(tabOrderByCollection).find((id) => collectionIds.includes(id));
  if (fromTabs) {
    return fromTabs;
  }
  return collectionIds[0] ?? "";
}

const initialEnvironment = createDefaultEnvironment();

export const useWorkspaceStore = create<WorkspaceStore & WorkspaceUiState>()((set, get) => ({
  layout: "vertical",
  isReady: false,

  tabsById: {},
  tabOrderByCollection: {},
  activeTabIdByCollection: {},
  currentCollectionId: "",
  environments: [initialEnvironment],
  activeEnvironmentId: initialEnvironment.id,

  initialize: async () => {
    if (get().isReady) {
      return;
    }

    try {
      const loaded = await backendClient.loadWorkspaceState();
      const sanitized = sanitizeState(loaded);
      set({
        tabsById: mapTabsById(sanitized.tabs),
        tabOrderByCollection: sanitized.tabOrderByCollection,
        activeTabIdByCollection: sanitized.activeTabIdByCollection,
        currentCollectionId: sanitized.currentCollectionId,
        environments: sanitized.environments,
        activeEnvironmentId: sanitized.activeEnvironmentId,
        isReady: true,
      });
    } catch (error) {
      console.error("Failed to load workspace state", error);
      const fallback = sanitizeState(null);
      set({
        tabsById: mapTabsById(fallback.tabs),
        tabOrderByCollection: fallback.tabOrderByCollection,
        activeTabIdByCollection: fallback.activeTabIdByCollection,
        currentCollectionId: fallback.currentCollectionId,
        environments: fallback.environments,
        activeEnvironmentId: fallback.activeEnvironmentId,
        isReady: true,
      });
    }
  },

  createTab: (protocol = "http", collectionId) => {
    const targetCollectionId = collectionId ?? get().currentCollectionId;
    if (!targetCollectionId) {
      return;
    }
    const tab = createWorkspaceTab(protocol, targetCollectionId);
    set((state) => ({
      tabsById: {
        ...state.tabsById,
        [tab.id]: tab,
      },
      tabOrderByCollection: {
        ...state.tabOrderByCollection,
        [targetCollectionId]: [...(state.tabOrderByCollection[targetCollectionId] ?? []), tab.id],
      },
      activeTabIdByCollection: {
        ...state.activeTabIdByCollection,
        [targetCollectionId]: tab.id,
      },
      currentCollectionId: targetCollectionId,
    }));
    scheduleWorkspaceSave(get);
  },

  closeTab: (tabId) => {
    const state = get();
    const tab = state.tabsById[tabId];
    if (!tab) return;

    const collectionId = tab.collectionId;
    const currentOrder = state.tabOrderByCollection[collectionId] ?? [];
    const nextOrder = currentOrder.filter((id) => id !== tabId);
    const nextTabsById = { ...state.tabsById };
    delete nextTabsById[tabId];

    let nextState: WorkspaceStore & WorkspaceUiState = {
      ...state,
      tabsById: nextTabsById,
      tabOrderByCollection: {
        ...state.tabOrderByCollection,
        [collectionId]: nextOrder,
      },
      activeTabIdByCollection: { ...state.activeTabIdByCollection },
    };

    if (state.activeTabIdByCollection[collectionId] === tabId) {
      nextState.activeTabIdByCollection[collectionId] = nextOrder[nextOrder.length - 1] ?? "";
    }

    nextState = ensureCollectionHasTab(nextState, collectionId) as WorkspaceStore & WorkspaceUiState;
    set(nextState);
    scheduleWorkspaceSave(get);
  },

  setActiveTab: (tabId) => {
    const tab = get().tabsById[tabId];
    if (!tab) return;
    set((state) => ({
      activeTabIdByCollection: {
        ...state.activeTabIdByCollection,
        [tab.collectionId]: tabId,
      },
      currentCollectionId: tab.collectionId,
    }));
    scheduleWorkspaceSave(get);
  },

  setCurrentCollection: (collectionId) => {
    const current = get();
    const hasTabs = (current.tabOrderByCollection[collectionId] ?? []).length > 0;
    if (current.currentCollectionId === collectionId && hasTabs) {
      return;
    }

    set((state) => {
      const ensured = ensureCollectionHasTab(state, collectionId);
      return {
        ...ensured,
        currentCollectionId: collectionId,
      };
    });
    scheduleWorkspaceSave(get);
  },

  setLayout: (orientation) => {
    set({
      layout: orientation,
    });
  },

  updateTab: (tabId, data) => {
    set((state) => {
      const current = state.tabsById[tabId];
      if (!current) {
        return state;
      }
      return {
        tabsById: {
          ...state.tabsById,
          [tabId]: {
            ...current,
            ...data,
            updatedAt: Date.now(),
          },
        },
      };
    });
    scheduleWorkspaceSave(get);
  },

  openSavedRequest: (savedRequest) => {
    const state = get();
    const existing = Object.values(state.tabsById).find(
      (tab) =>
        tab.collectionId === savedRequest.collectionId &&
        tab.savedRequestId === savedRequest.id,
    );
    if (existing) {
      set((current) => ({
        currentCollectionId: savedRequest.collectionId,
        activeTabIdByCollection: {
          ...current.activeTabIdByCollection,
          [savedRequest.collectionId]: existing.id,
        },
      }));
      scheduleWorkspaceSave(get);
      return;
    }

    const tab = createWorkspaceTab("http", savedRequest.collectionId);
    tab.savedRequestId = savedRequest.id;
    tab.title = savedRequest.name;
    tab.method = savedRequest.method;
    tab.url = savedRequest.url;
    tab.body = savedRequest.body;
    tab.preRequestScript = savedRequest.preRequestScript;
    tab.postResponseScript = savedRequest.postResponseScript;
    tab.headers = savedRequest.headers;
    tab.queryParams = savedRequest.queryParams;
    tab.auth = savedRequest.auth;
    tab.isDirty = false;

    set((current) => ({
      tabsById: {
        ...current.tabsById,
        [tab.id]: tab,
      },
      tabOrderByCollection: {
        ...current.tabOrderByCollection,
        [savedRequest.collectionId]: [
          ...(current.tabOrderByCollection[savedRequest.collectionId] ?? []),
          tab.id,
        ],
      },
      activeTabIdByCollection: {
        ...current.activeTabIdByCollection,
        [savedRequest.collectionId]: tab.id,
      },
      currentCollectionId: savedRequest.collectionId,
    }));
    scheduleWorkspaceSave(get);
  },

  saveTabToCollection: async (tabId, options) => {
    const state = get();
    const tab = state.tabsById[tabId];
    if (!tab) return null;

    const requestsByCollection =
      useCollectionsStore.getState().requestsByCollection;
    const canonicalTitle = resolveTabTitle(tab, requestsByCollection);

    const payload = await backendClient.collections.saveRequest({
      id: tab.savedRequestId ?? "",
      collectionId: options?.collectionId ?? tab.collectionId,
      folderId: options?.folderId ?? null,
      name: options?.name ?? canonicalTitle,
      method: tab.method,
      url: tab.url,
      body: tab.body,
      preRequestScript: tab.preRequestScript,
      postResponseScript: tab.postResponseScript,
      headers: tab.headers,
      queryParams: tab.queryParams,
      auth: tab.auth,
      sortOrder: (() => {
        if (!tab.savedRequestId) {
          return 0;
        }
        const targetCollectionId = options?.collectionId ?? tab.collectionId;
        const existingRequest =
          useCollectionsStore.getState().requestsByCollection[targetCollectionId]?.[tab.savedRequestId];
        return existingRequest?.sortOrder ?? -1;
      })(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    set((current) => {
      const currentTab = current.tabsById[tabId];
      if (!currentTab) return current;
      return {
        tabsById: {
          ...current.tabsById,
          [tabId]: {
            ...currentTab,
            collectionId: payload.collectionId,
            savedRequestId: payload.id,
            title: payload.name,
            isDirty: false,
            updatedAt: Date.now(),
          },
        },
      };
    });
    scheduleWorkspaceSave(get);

    return payload;
  },

  removeCollectionState: (collectionId) => {
    set((state) => {
      const nextTabsById = { ...state.tabsById };
      const tabIdsToRemove = new Set(state.tabOrderByCollection[collectionId] ?? []);
      for (const [tabId, tab] of Object.entries(state.tabsById)) {
        if (tab.collectionId === collectionId) {
          tabIdsToRemove.add(tabId);
        }
      }
      for (const tabId of tabIdsToRemove) {
        delete nextTabsById[tabId];
      }

      const nextTabOrderByCollection = { ...state.tabOrderByCollection };
      delete nextTabOrderByCollection[collectionId];
      for (const [id, tabIds] of Object.entries(nextTabOrderByCollection)) {
        nextTabOrderByCollection[id] = tabIds.filter((tabId) => !tabIdsToRemove.has(tabId));
      }

      const nextActiveTabByCollection = { ...state.activeTabIdByCollection };
      delete nextActiveTabByCollection[collectionId];
      for (const [id, tabId] of Object.entries(nextActiveTabByCollection)) {
        if (tabIdsToRemove.has(tabId)) {
          delete nextActiveTabByCollection[id];
        }
      }

      const remainingCollectionIds = Object.keys(nextTabOrderByCollection);
      const nextCurrentCollectionId = remainingCollectionIds.includes(state.currentCollectionId)
        ? state.currentCollectionId
        : remainingCollectionIds[0] ?? state.currentCollectionId;

      return {
        tabsById: nextTabsById,
        tabOrderByCollection: nextTabOrderByCollection,
        activeTabIdByCollection: nextActiveTabByCollection,
        currentCollectionId: nextCurrentCollectionId,
      };
    });
    scheduleWorkspaceSave(get);
  },

  handleDeletedSavedRequest: (collectionId, requestId) => {
    set((state) => {
      const nextTabsById = { ...state.tabsById };
      const nextTabOrderByCollection = { ...state.tabOrderByCollection };
      const nextActiveTabByCollection = { ...state.activeTabIdByCollection };
      const tabIds = nextTabOrderByCollection[collectionId] ?? [];

      for (const tabId of tabIds) {
        const tab = nextTabsById[tabId];
        if (!tab || tab.savedRequestId !== requestId) {
          continue;
        }

        if (tab.isDirty) {
          nextTabsById[tabId] = {
            ...tab,
            savedRequestId: null,
          };
          continue;
        }

        delete nextTabsById[tabId];
        nextTabOrderByCollection[collectionId] = (nextTabOrderByCollection[collectionId] ?? []).filter(
          (id) => id !== tabId,
        );
        if (nextActiveTabByCollection[collectionId] === tabId) {
          nextActiveTabByCollection[collectionId] =
            nextTabOrderByCollection[collectionId]?.[nextTabOrderByCollection[collectionId].length - 1] ?? "";
        }
      }

      const nextState = ensureCollectionHasTab(
        {
          ...state,
          tabsById: nextTabsById,
          tabOrderByCollection: nextTabOrderByCollection,
          activeTabIdByCollection: nextActiveTabByCollection,
        } as WorkspaceStore & WorkspaceUiState,
        collectionId,
      );

      return {
        tabsById: nextState.tabsById,
        tabOrderByCollection: nextState.tabOrderByCollection,
        activeTabIdByCollection: nextState.activeTabIdByCollection,
      };
    });
    scheduleWorkspaceSave(get);
  },

  handleRenamedSavedRequest: (requestId, name) => {
    set((state) => {
      let changed = false;
      const nextTabsById: Record<string, RequestTab> = {};
      for (const [tabId, tab] of Object.entries(state.tabsById)) {
        if (tab.savedRequestId === requestId && tab.title !== name) {
          changed = true;
          nextTabsById[tabId] = {
            ...tab,
            title: name,
            updatedAt: Date.now(),
          };
          continue;
        }
        nextTabsById[tabId] = tab;
      }

      if (!changed) {
        return state;
      }

      return {
        tabsById: nextTabsById,
      };
    });
    scheduleWorkspaceSave(get);
  },

  reconcileCollections: (collectionIds) => {
    set((state) => {
      const valid = new Set(collectionIds);
      const nextTabsById: Record<string, RequestTab> = {};
      for (const [id, tab] of Object.entries(state.tabsById)) {
        if (valid.has(tab.collectionId)) {
          nextTabsById[id] = tab;
        }
      }

      const nextTabOrderByCollection: Record<string, string[]> = {};
      for (const [collectionId, tabIds] of Object.entries(state.tabOrderByCollection)) {
        if (!valid.has(collectionId)) {
          continue;
        }
        const filtered = tabIds.filter((tabId) => Boolean(nextTabsById[tabId]));
        if (filtered.length > 0) {
          nextTabOrderByCollection[collectionId] = filtered;
        }
      }

      const nextActiveTabByCollection: Record<string, string> = {};
      for (const [collectionId, tabId] of Object.entries(state.activeTabIdByCollection)) {
        if (!valid.has(collectionId)) {
          continue;
        }
        if (tabId && nextTabsById[tabId]) {
          nextActiveTabByCollection[collectionId] = tabId;
        }
      }

      const nextCurrentCollectionId = getFallbackCollectionId(
        state.currentCollectionId,
        collectionIds,
        nextTabOrderByCollection,
      );

      if (collectionIds.length > 0) {
        const ensured = ensureCollectionHasTab(
          {
            ...state,
            tabsById: nextTabsById,
            tabOrderByCollection: nextTabOrderByCollection,
            activeTabIdByCollection: nextActiveTabByCollection,
            currentCollectionId: nextCurrentCollectionId,
          } as WorkspaceStore & WorkspaceUiState,
          nextCurrentCollectionId,
        );

        return {
          tabsById: ensured.tabsById,
          tabOrderByCollection: ensured.tabOrderByCollection,
          activeTabIdByCollection: ensured.activeTabIdByCollection,
          currentCollectionId: ensured.currentCollectionId,
        };
      }

      return {
        tabsById: nextTabsById,
        tabOrderByCollection: nextTabOrderByCollection,
        activeTabIdByCollection: nextActiveTabByCollection,
        currentCollectionId: "",
      };
    });
    scheduleWorkspaceSave(get);
  },

  createEnvironment: () => {
    const nextEnvironment: Environment = {
      id: nanoid(),
      name: `Environment ${get().environments.length + 1}`,
      variables: [],
    };

    set((state) => ({
      environments: [...state.environments, nextEnvironment],
      activeEnvironmentId: nextEnvironment.id,
    }));
    scheduleWorkspaceSave(get);
  },

  setActiveEnvironment: (environmentId) => {
    set({
      activeEnvironmentId: environmentId,
    });
    scheduleWorkspaceSave(get);
  },

  updateEnvironment: (environmentId, data) => {
    set((state) => ({
      environments: state.environments.map((environment) =>
        environment.id === environmentId
          ? {
              ...environment,
              ...data,
            }
          : environment,
      ),
    }));
    scheduleWorkspaceSave(get);
  },

  deleteEnvironment: (environmentId) => {
    const state = get();
    const environments = state.environments.filter(
      (environment) => environment.id !== environmentId,
    );

    if (!environments.length) {
      const replacement: Environment = {
        ...createDefaultEnvironment(),
      };
      set({
        environments: [replacement],
        activeEnvironmentId: replacement.id,
      });
      scheduleWorkspaceSave(get);
      return;
    }

    set({
      environments,
      activeEnvironmentId:
        state.activeEnvironmentId === environmentId
          ? environments[0].id
          : state.activeEnvironmentId,
    });
    scheduleWorkspaceSave(get);
  },

  addEnvironmentVariable: (environmentId) => {
    const variable: KeyValuePair = {
      id: nanoid(),
      key: "",
      value: "",
      enabled: true,
    };

    set((state) => ({
      environments: state.environments.map((environment) =>
        environment.id === environmentId
          ? {
              ...environment,
              variables: [...environment.variables, variable],
            }
          : environment,
      ),
    }));
    scheduleWorkspaceSave(get);
  },

  updateEnvironmentVariable: (environmentId, variableId, data) => {
    set((state) => ({
      environments: state.environments.map((environment) =>
        environment.id === environmentId
          ? {
              ...environment,
              variables: environment.variables.map((variable) =>
                variable.id === variableId
                  ? {
                      ...variable,
                      ...data,
                    }
                  : variable,
              ),
            }
          : environment,
      ),
    }));
    scheduleWorkspaceSave(get);
  },

  removeEnvironmentVariable: (environmentId, variableId) => {
    set((state) => ({
      environments: state.environments.map((environment) =>
        environment.id === environmentId
          ? {
              ...environment,
              variables: environment.variables.filter(
                (variable) => variable.id !== variableId,
              ),
            }
          : environment,
      ),
    }));
    scheduleWorkspaceSave(get);
  },
}));
