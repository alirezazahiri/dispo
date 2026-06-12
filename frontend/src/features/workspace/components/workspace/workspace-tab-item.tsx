import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import type { RequestTab } from "@/features/workspace/types";
import {
  useActiveWorkspaceTab,
  useTabTitle,
  useWorkspaceCloseTab,
  useWorkspaceCloseTabs,
  useWorkspaceHandleRenamedSavedRequest,
  useWorkspaceSetActiveTab,
  useWorkspaceTabs,
  useWorkspaceUpdateTab,
} from "@/features/workspace/stores";
import { useCollectionsStore } from "@/features/collections";
import {
  getAllTabsToClose,
  getOtherTabsToClose,
  getTabsToCloseToRight,
} from "../../utils/tab-close-actions";
import { getProtocolDefinition } from "../../protocols/registry";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Input,
} from "@/components/ui";

type Props = {
  tab: RequestTab;
};

export function WorkspaceTabItem({ tab }: Props) {
  const tabs = useWorkspaceTabs();
  const activeTab = useActiveWorkspaceTab();
  const closeTab = useWorkspaceCloseTab();
  const closeTabs = useWorkspaceCloseTabs();
  const setActiveTab = useWorkspaceSetActiveTab();
  const updateTab = useWorkspaceUpdateTab();
  const handleRenamedSavedRequest = useWorkspaceHandleRenamedSavedRequest();
  const renameRequest = useCollectionsStore((state) => state.renameRequest);
  const displayTitle = useTabTitle(tab.id);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(displayTitle);

  const isActive = activeTab?.id === tab.id;
  const TabBadge = getProtocolDefinition(tab.protocol).TabBadge;
  const orderedTabIds = tabs.map((currentTab) => currentTab.id);
  const tabsToCloseToRight = getTabsToCloseToRight(orderedTabIds, tab.id);
  const otherTabsToClose = getOtherTabsToClose(orderedTabIds, tab.id);
  const canCloseTabsToRight = tabsToCloseToRight.length > 0;
  const canCloseOtherTabs = otherTabsToClose.length > 0;

  const commitRename = async () => {
    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      setRenameValue(displayTitle);
      setIsRenaming(false);
      return;
    }

    if (nextTitle !== displayTitle) {
      if (tab.savedRequestId) {
        const collectionsState = useCollectionsStore.getState();
        const linkedCollectionId =
          Object.entries(collectionsState.requestsByCollection).find(([, requests]) =>
            Boolean(requests[tab.savedRequestId as string]),
          )?.[0] ?? tab.collectionId;
        await renameRequest(tab.savedRequestId, linkedCollectionId, nextTitle);
        handleRenamedSavedRequest(tab.savedRequestId, nextTitle);
      } else {
        updateTab(tab.id, { title: nextTitle, isDirty: true });
      }
    }

    setIsRenaming(false);
  };

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (open) {
          setActiveTab(tab.id);
        }
      }}
    >
      <ContextMenuTrigger asChild>
        <div
          data-workspace-tab-id={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            group flex h-8 shrink-0 items-center gap-2 rounded-md
            border px-3 text-sm transition-colors
            ${
              isActive
                ? "border-border bg-background text-foreground"
                : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
            }
          `}
        >
          <TabBadge tab={tab} />

          {isRenaming ? (
            <Input
              autoFocus
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onBlur={() => void commitRename()}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void commitRename();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setRenameValue(displayTitle);
                  setIsRenaming(false);
                }
              }}
              className="h-6 max-w-[180px]"
            />
          ) : (
            <span className="min-w-0 flex-1 truncate">{displayTitle}</span>
          )}

          {isRenaming ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void commitRename();
              }}
              className="opacity-100 transition-opacity hover:text-foreground"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setRenameValue(displayTitle);
                setIsRenaming(true);
              }}
              className="
                opacity-0 transition-opacity
                hover:text-foreground
                group-hover:opacity-100
              "
              title="Rename tab"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}

          {!isRenaming ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                closeTab(tab.id);
              }}
              className="
                opacity-0 transition-opacity
                hover:text-foreground
                group-hover:opacity-100
              "
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem
          disabled={!canCloseTabsToRight}
          onClick={() => closeTabs(tabsToCloseToRight)}
        >
          Close Tabs to the Right
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!canCloseOtherTabs}
          onClick={() => closeTabs(otherTabsToClose)}
        >
          Close Other Tabs
        </ContextMenuItem>
        <ContextMenuItem onClick={() => closeTabs(getAllTabsToClose(orderedTabIds))}>
          Close All Tabs
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
