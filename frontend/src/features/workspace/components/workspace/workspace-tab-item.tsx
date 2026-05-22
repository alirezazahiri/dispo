import { Check, Pencil, X } from "lucide-react";
import type { RequestTab } from "@/features/workspace/types";
import {
  useActiveWorkspaceTab,
  useWorkspaceCloseTab,
  useWorkspaceHandleRenamedSavedRequest,
  useWorkspaceSaveTabToCollection,
  useWorkspaceSetActiveTab,
  useWorkspaceUpdateTab,
} from "@/features/workspace/stores";
import { useCollectionsStore } from "@/features/collections";
import { MethodBadge } from "@/components/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Input,
} from "@/components/ui";
import { useState } from "react";

type Props = {
  tab: RequestTab;
};

export function WorkspaceTabItem({ tab }: Props) {
  const activeTab = useActiveWorkspaceTab();
  const closeTab = useWorkspaceCloseTab();
  const setActiveTab = useWorkspaceSetActiveTab();
  const updateTab = useWorkspaceUpdateTab();
  const handleRenamedSavedRequest = useWorkspaceHandleRenamedSavedRequest();
  const saveTabToCollection = useWorkspaceSaveTabToCollection();
  const upsertRequest = useCollectionsStore((state) => state.upsertRequest);
  const renameRequest = useCollectionsStore((state) => state.renameRequest);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(tab.title || "New Request");

  const isActive = activeTab?.id === tab.id;

  const commitRename = async () => {
    const nextTitle = renameValue.trim();
    const fallbackTitle = tab.title || "New Request";
    if (!nextTitle) {
      setRenameValue(fallbackTitle);
      setIsRenaming(false);
      return;
    }

    if (nextTitle !== fallbackTitle) {
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
    <>
      <div
        data-workspace-tab-id={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`
          group flex h-8 items-center gap-2 rounded-md
          border px-3 text-sm transition-colors shrink-0
          ${
            isActive
              ? "border-border bg-background text-foreground"
              : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
          }
        `}
      >
        <MethodBadge method={tab.method} />

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
                setRenameValue(tab.title || "New Request");
                setIsRenaming(false);
              }
            }}
            className="h-6 max-w-[180px]"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate">{tab.title}</span>
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
              setRenameValue(tab.title || "New Request");
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
              if (tab.isDirty) {
                setConfirmCloseOpen(true);
                return;
              }
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

      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save changes before closing?</AlertDialogTitle>
            <AlertDialogDescription>
              This request has unsaved changes. Save it to the collection or discard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                closeTab(tab.id);
                setConfirmCloseOpen(false);
              }}
            >
              Discard
            </AlertDialogAction>
            <AlertDialogAction
              onClick={async () => {
                const saved = await saveTabToCollection(tab.id);
                if (saved) {
                  upsertRequest(saved);
                }
                closeTab(tab.id);
                setConfirmCloseOpen(false);
              }}
            >
              Save & Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
