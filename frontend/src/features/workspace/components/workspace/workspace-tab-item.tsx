import { X } from "lucide-react";
import type { RequestTab } from "@/features/workspace/types";
import {
  useActiveWorkspaceTab,
  useWorkspaceCloseTab,
  useWorkspaceSetActiveTab,
} from "@/features/workspace/stores";
import { MethodBadge } from "@/components/shared";

type Props = {
  tab: RequestTab;
};

export function WorkspaceTabItem({ tab }: Props) {
  const activeTab = useActiveWorkspaceTab();
  const closeTab = useWorkspaceCloseTab();
  const setActiveTab = useWorkspaceSetActiveTab();

  const isActive = activeTab?.id === tab.id;

  return (
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
