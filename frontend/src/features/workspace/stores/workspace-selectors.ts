import { useWorkspaceStore } from "./workspace.store";

export function useWorkspaceTabs() {
  return useWorkspaceStore((state) => state.tabs);
}

export function useWorkspaceReady() {
  return useWorkspaceStore((state) => state.isReady);
}

export function useActiveTabId() {
  return useWorkspaceStore((state) => state.activeTabId);
}

export function useWorkspaceLayout() {
  return useWorkspaceStore((state) => state.layout);
}

export function useActiveWorkspaceTab() {
  return useWorkspaceStore((state) => {
    return state.tabs.find((tab) => tab.id === state.activeTabId);
  });
}

export function useWorkspaceTab(tabId: string) {
  return useWorkspaceStore((state) =>
    state.tabs.find((tab) => tab.id === tabId),
  );
}

export const useWorkspaceCreateTab = () => useWorkspaceStore((state) => state.createTab);

export const useWorkspaceCloseTab = () => useWorkspaceStore((state) => state.closeTab);

export const useWorkspaceUpdateTab = () => useWorkspaceStore((state) => state.updateTab);

export const useWorkspaceSetActiveTab = () =>
  useWorkspaceStore((state) => state.setActiveTab);

export const useWorkspaceSetLayout = () => useWorkspaceStore((state) => state.setLayout);

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
