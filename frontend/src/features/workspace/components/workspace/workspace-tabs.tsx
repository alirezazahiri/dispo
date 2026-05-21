import { Plus } from "lucide-react";

import { Button, Separator } from "@/components";
import { DragScrollArea } from "@/components/shared";

import { useWorkspaceStore } from "../../stores";
import { WorkspaceTabItem } from "./workspace-tab-item";

export function WorkspaceTabs() {
  const tabs = useWorkspaceStore((state) => state.tabs);
  const createTab = useWorkspaceStore((state) => state.createTab);

  return (
    <>
      <div
        className="
          relative flex h-11 shrink-0 items-center
          border-b border-border
          bg-card px-2
        "
      >
        {/* left fade */}
        <div
          className="
            pointer-events-none absolute left-0 top-0 z-10
            h-full w-8
            bg-gradient-to-r
            from-card to-transparent
          "
        />

        {/* tabs */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <DragScrollArea
            className="
              scrollbar-hidden flex h-full items-center gap-1
            "
          >
            {tabs.map((tab) => (
              <WorkspaceTabItem key={tab.id} tab={tab} />
            ))}
          </DragScrollArea>
        </div>

        {/* right fade */}
        <div
          className="
            pointer-events-none absolute right-10 top-0 z-10
            h-full w-8
            bg-gradient-to-l
            from-card to-transparent
          "
        />

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
