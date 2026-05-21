import { X } from "lucide-react";

import type { RequestTab } from "@/features/request-workspace/types";

import { useWorkspaceStore } from "@/features/request-workspace/stores";

type Props = {
  tab: RequestTab;
};

export function WorkspaceTabItem({ tab }: Props) {
  const activeTabId = useWorkspaceStore((state) => state.activeTabId);

  const setActiveTab = useWorkspaceStore((state) => state.setActiveTab);

  const closeTab = useWorkspaceStore((state) => state.closeTab);

  const isActive = activeTabId === tab.id;

  return (
    <div
      onClick={() => setActiveTab(tab.id)}
      className={`
        group flex h-8 items-center gap-2 rounded-md
        border px-3 text-sm transition-colors

        ${
          isActive
            ? "border-border bg-background text-foreground"
            : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
        }
      `}
    >
      <span className="font-medium">{tab.method}</span>

      <span className="max-w-[160px] truncate">{tab.title}</span>

      <button
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
    </div>
  );
}
