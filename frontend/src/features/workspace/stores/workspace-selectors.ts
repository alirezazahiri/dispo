import { useWorkspaceStore } from "./workspace.store";
import { useShallow } from "zustand/react/shallow";

export function useWorkspaceTabs() {
  return useWorkspaceStore(
    useShallow((state) => {
      const tabIds = state.tabOrderByCollection[state.currentCollectionId] ?? [];
      return tabIds
        .map((tabId) => state.tabsById[tabId])
        .filter((tab): tab is NonNullable<typeof tab> => Boolean(tab));
    }),
  );
}

export function useWorkspaceReady() {
  return useWorkspaceStore((state) => state.isReady);
}

export function useActiveCollectionId() {
  return useWorkspaceStore((state) => state.currentCollectionId);
}

export function useActiveTabId() {
  return useWorkspaceStore(
    (state) => state.activeTabIdByCollection[state.currentCollectionId],
  );
}

export function useWorkspaceLayout() {
  return useWorkspaceStore((state) => state.layout);
}

export function useActiveWorkspaceTab() {
  return useWorkspaceStore((state) => {
    const activeTabId = state.activeTabIdByCollection[state.currentCollectionId];
    return activeTabId ? state.tabsById[activeTabId] : undefined;
  });
}

export function useActiveSavedRequestId() {
  return useWorkspaceStore((state) => {
    const activeTabId = state.activeTabIdByCollection[state.currentCollectionId];
    return activeTabId ? state.tabsById[activeTabId]?.savedRequestId ?? null : null;
  });
}

export function useWorkspaceTab(tabId: string) {
  return useWorkspaceStore((state) => state.tabsById[tabId]);
}

export const useWorkspaceCreateTab = () => useWorkspaceStore((state) => state.createTab);

export const useWorkspaceCloseTab = () => useWorkspaceStore((state) => state.closeTab);

export const useWorkspaceUpdateTab = () => useWorkspaceStore((state) => state.updateTab);

export const useWorkspaceSetActiveTab = () =>
  useWorkspaceStore((state) => state.setActiveTab);

export const useWorkspaceSetLayout = () => useWorkspaceStore((state) => state.setLayout);
export const useWorkspaceSetCurrentCollection = () =>
  useWorkspaceStore((state) => state.setCurrentCollection);
export const useWorkspaceOpenSavedRequest = () =>
  useWorkspaceStore((state) => state.openSavedRequest);
export const useWorkspaceSaveTabToCollection = () =>
  useWorkspaceStore((state) => state.saveTabToCollection);
export const useWorkspaceRemoveCollectionState = () =>
  useWorkspaceStore((state) => state.removeCollectionState);
export const useWorkspaceHandleDeletedSavedRequest = () =>
  useWorkspaceStore((state) => state.handleDeletedSavedRequest);
export const useWorkspaceHandleRenamedSavedRequest = () =>
  useWorkspaceStore((state) => state.handleRenamedSavedRequest);
export const useWorkspaceReconcileCollections = () =>
  useWorkspaceStore((state) => state.reconcileCollections);

export const useWorkspaceInitialize = () =>
  useWorkspaceStore((state) => state.initialize);

export function useWorkspaceEnvironments() {
  return useWorkspaceStore((state) => state.environments);
}

export function useActiveEnvironment() {
  return useWorkspaceStore((state) =>
    state.environments.find(
      (environment) => environment.id === state.activeEnvironmentId,
    ),
  );
}

export const useWorkspaceCreateEnvironment = () =>
  useWorkspaceStore((state) => state.createEnvironment);

export const useWorkspaceSetActiveEnvironment = () =>
  useWorkspaceStore((state) => state.setActiveEnvironment);

export const useWorkspaceUpdateEnvironment = () =>
  useWorkspaceStore((state) => state.updateEnvironment);

export const useWorkspaceDeleteEnvironment = () =>
  useWorkspaceStore((state) => state.deleteEnvironment);

export const useWorkspaceAddEnvironmentVariable = () =>
  useWorkspaceStore((state) => state.addEnvironmentVariable);

export const useWorkspaceUpdateEnvironmentVariable = () =>
  useWorkspaceStore((state) => state.updateEnvironmentVariable);

export const useWorkspaceRemoveEnvironmentVariable = () =>
  useWorkspaceStore((state) => state.removeEnvironmentVariable);
