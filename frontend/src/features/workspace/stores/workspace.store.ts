import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { RequestTab, WorkspaceProtocol } from "../types";
import { createWorkspaceTab } from "../utils/create-workspace-tab";

type WorkspaceLayout = "vertical" | "horizontal";

type WorkspaceUiState = {
  layout: WorkspaceLayout;

  setLayout: (layout: WorkspaceLayout) => void;
};

type WorkspaceStore = {
  tabs: RequestTab[];

  activeTabId: string | null;

  createTab: (protocol?: WorkspaceProtocol) => void;

  closeTab: (tabId: string) => void;

  setActiveTab: (tabId: string) => void;

  updateTab: (tabId: string, data: Partial<RequestTab>) => void;
};

const initialTab = createWorkspaceTab();

export const useWorkspaceStore = create<WorkspaceStore & WorkspaceUiState>()(
  persist(
    (set, get) => ({
      layout: "vertical",

      tabs: [initialTab],

      activeTabId: initialTab.id,

      createTab: (protocol = "http") => {
        const tab = createWorkspaceTab(protocol);

        set((state) => ({
          tabs: [...state.tabs, tab],

          activeTabId: tab.id,
        }));
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
      },

      setActiveTab: (tabId) => {
        set({
          activeTabId: tabId,
        });
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
      },
    }),
    {
      name: "workspace-storage",
    },
  ),
);
