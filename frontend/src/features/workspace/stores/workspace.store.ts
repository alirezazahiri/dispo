import { create } from "zustand";
import { nanoid } from "nanoid";

import { backendClient } from "@/lib/backend/client";
import type {
  Environment,
  KeyValuePair,
  RequestTab,
  WorkspaceProtocol,
  WorkspaceState,
} from "../types";
import { createWorkspaceTab } from "../utils/create-workspace-tab";

type WorkspaceLayout = "vertical" | "horizontal";

type WorkspaceUiState = {
  layout: WorkspaceLayout;
  isReady: boolean;

  setLayout: (layout: WorkspaceLayout) => void;
  initialize: () => Promise<void>;
};

type WorkspaceStore = {
  tabs: RequestTab[];

  activeTabId: string;
  environments: Environment[];
  activeEnvironmentId: string;

  createTab: (protocol?: WorkspaceProtocol) => void;

  closeTab: (tabId: string) => void;

  setActiveTab: (tabId: string) => void;

  updateTab: (tabId: string, data: Partial<RequestTab>) => void;
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

const initialTab = createWorkspaceTab();
function createDefaultEnvironment(): Environment {
  return {
    id: nanoid(),
    name: "Default",
    variables: [],
  };
}

const initialEnvironment = createDefaultEnvironment();

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function sanitizeState(state: Partial<WorkspaceState> | null | undefined): WorkspaceState {
  const tabs = state?.tabs?.length ? state.tabs : [createWorkspaceTab()];
  const environments = state?.environments?.length
    ? state.environments
    : [createDefaultEnvironment()];

  const activeTabId = tabs.some((tab) => tab.id === state?.activeTabId)
    ? (state?.activeTabId as string)
    : tabs[0].id;

  const activeEnvironmentId = environments.some(
    (environment) => environment.id === state?.activeEnvironmentId,
  )
    ? (state?.activeEnvironmentId as string)
    : environments[0].id;

  return {
    tabs,
    activeTabId,
    environments,
    activeEnvironmentId,
  };
}

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
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      environments: state.environments,
      activeEnvironmentId: state.activeEnvironmentId,
    };

    void backendClient.saveWorkspaceState(payload).catch((error) => {
      console.error("Failed to persist workspace state", error);
    });
  }, 250);
}

export const useWorkspaceStore = create<WorkspaceStore & WorkspaceUiState>()((set, get) => ({
  layout: "vertical",
  isReady: false,

  tabs: [initialTab],
  activeTabId: initialTab.id,
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
        tabs: sanitized.tabs,
        activeTabId: sanitized.activeTabId,
        environments: sanitized.environments,
        activeEnvironmentId: sanitized.activeEnvironmentId,
        isReady: true,
      });
    } catch (error) {
      console.error("Failed to load workspace state", error);
      const fallback = sanitizeState(null);
      set({
        tabs: fallback.tabs,
        activeTabId: fallback.activeTabId,
        environments: fallback.environments,
        activeEnvironmentId: fallback.activeEnvironmentId,
        isReady: true,
      });
    }
  },

  createTab: (protocol = "http") => {
    const tab = createWorkspaceTab(protocol);

    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
    }));
    scheduleWorkspaceSave(get);
  },

  closeTab: (tabId) => {
    const state = get();

    const tabs = state.tabs.filter((tab) => tab.id !== tabId);

    if (tabs.length === 0) {
      const newTab = createWorkspaceTab();

      set({
        tabs: [newTab],
        activeTabId: newTab.id,
      });
      scheduleWorkspaceSave(get);
      return;
    }

    let nextActiveId = state.activeTabId;

    if (state.activeTabId === tabId) {
      nextActiveId = tabs[tabs.length - 1].id;
    }

    set({
      tabs,
      activeTabId: nextActiveId,
    });
    scheduleWorkspaceSave(get);
  },

  setActiveTab: (tabId) => {
    set({
      activeTabId: tabId,
    });
    scheduleWorkspaceSave(get);
  },

  setLayout: (orientation) => {
    set({
      layout: orientation,
    });
  },

  updateTab: (tabId, data) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              ...data,
              updatedAt: Date.now(),
            }
          : tab,
      ),
    }));
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
