import { Clock3, FolderKanban, Globe, Plus, Star } from "lucide-react";

import { Button, Separator } from "@/components/ui";

const collections = ["Authentication", "Users", "Payments", "Analytics"];

export function Sidebar() {
  return (
    <aside
      className="
        flex h-full w-64 shrink-0 flex-col
        border-r border-border
        bg-[hsl(var(--sidebar))]
      "
    >
      <div className="flex items-center justify-between p-3">
        <span
          className="
            text-xs font-medium uppercase tracking-wider
            text-muted-foreground
          "
        >
          Workspace
        </span>

        <Button
          size="icon"
          variant="ghost"
          className="
            h-7 w-7
            text-muted-foreground
            hover:bg-accent
            hover:text-foreground
          "
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-2">
        <SidebarItem
          icon={<FolderKanban className="h-4 w-4" />}
          label="Collections"
          active
        />

        <SidebarItem icon={<Clock3 className="h-4 w-4" />} label="History" />

        <SidebarItem icon={<Star className="h-4 w-4" />} label="Favorites" />

        <SidebarItem
          icon={<Globe className="h-4 w-4" />}
          label="Environments"
        />
      </div>

      <Separator className="my-3" />

      <div className="flex-1 overflow-auto px-2">
        <div
          className="
            mb-2 px-2
            text-xs font-medium uppercase tracking-wider
            text-muted-foreground
          "
        >
          Collections
        </div>

        <div className="space-y-1">
          {collections.map((collection) => (
            <button
              key={collection}
              className="
                flex w-full items-center rounded-md px-2 py-2
                text-left text-sm
                text-muted-foreground
                transition-colors
                hover:bg-accent
                hover:text-foreground
              "
            >
              {collection}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
};

function SidebarItem({ icon, label, active }: SidebarItemProps) {
  return (
    <button
      className={`
        flex w-full items-center gap-2 rounded-md px-2 py-2
        text-sm transition-colors
        ${
          active
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }
      `}
    >
      <span
        className="
          flex h-4 w-4 shrink-0
          items-center justify-center
        "
      >
        {icon}
      </span>

      <span className="truncate">{label}</span>
    </button>
  );
}
