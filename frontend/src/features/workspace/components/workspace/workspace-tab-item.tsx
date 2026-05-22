import { X } from "lucide-react";
import type { RequestTab } from "@/features/workspace/types";
import {
  useActiveWorkspaceTab,
  useWorkspaceCloseTab,
  useWorkspaceSaveTabToCollection,
  useWorkspaceSetActiveTab,
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
} from "@/components/ui";
import { useState } from "react";

type Props = {
  tab: RequestTab;
};

export function WorkspaceTabItem({ tab }: Props) {
  const activeTab = useActiveWorkspaceTab();
  const closeTab = useWorkspaceCloseTab();
  const setActiveTab = useWorkspaceSetActiveTab();
  const saveTabToCollection = useWorkspaceSaveTabToCollection();
  const upsertRequest = useCollectionsStore((state) => state.upsertRequest);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const isActive = activeTab?.id === tab.id;

  return (
    <>
      <div
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

      <span className="max-w-[160px] truncate">{tab.title}</span>

      <button
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
