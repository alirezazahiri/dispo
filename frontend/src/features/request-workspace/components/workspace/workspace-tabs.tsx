import { Plus } from "lucide-react";

import { Button } from "@/components";
import { Separator } from "@/components";

import { useWorkspaceStore } from "@/features/request-workspace/stores";

import { WorkspaceTabItem } from "./workspace-tab-item";

export function WorkspaceTabs() {
  const tabs = useWorkspaceStore((state) => state.tabs);
  const createTab = useWorkspaceStore((state) => state.createTab);

  return (
    <>
      <div
        className="
          flex h-11 shrink-0 items-center
          border-b border-border
          bg-card px-2
        "
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <WorkspaceTabItem key={tab.id} tab={tab} />
          ))}
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => createTab()}
          className="
            ml-1 h-8 w-8 shrink-0
            text-muted-foreground
            hover:bg-accent
            hover:text-foreground
          "
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Separator />
    </>
  );
}
