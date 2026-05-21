import { Search, Settings } from "lucide-react";

import { Button } from "@/components";
import { ThemeToggleButton, SidebarToggleButton } from "@/components/shared";

export function Topbar() {
  return (
    <header
      className="
        flex h-12 shrink-0 items-center justify-between
        border-b border-border
        bg-[hsl(var(--topbar))]
        px-3
      "
    >
      <div className="flex items-center gap-2">
        <SidebarToggleButton />

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium tracking-wider text-foreground">
            DISPO ✨
          </span>
        </div>
      </div>

      <div className="flex w-full max-w-md items-center px-6">
        <button
          className="
            flex h-9 w-full items-center gap-2
            rounded-md border border-input
            bg-background px-3
            text-sm text-muted-foreground
            transition-colors
            hover:bg-accent
            hover:text-foreground
          "
        >
          <Search className="h-4 w-4 shrink-0" />

          <span>Search requests...</span>

          <div
            className="
              ml-auto flex items-center gap-1
              text-xs
            "
          >
            <kbd
              className="
                rounded border border-border
                bg-muted px-1.5 py-0.5
                text-muted-foreground
              "
            >
              ⌘
            </kbd>

            <kbd
              className="
                rounded border border-border
                bg-muted px-1.5 py-0.5
                text-muted-foreground
              "
            >
              K
            </kbd>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggleButton />

        <Button
          size="icon"
          variant="ghost"
          className="
            h-8 w-8
            text-muted-foreground
            hover:bg-accent
            hover:text-foreground
          "
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
