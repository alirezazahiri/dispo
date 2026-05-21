import { useWorkspaceStore } from "./workspace.store";

export function useWorkspaceTabs() {
  return useWorkspaceStore((state) => state.tabs);
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
