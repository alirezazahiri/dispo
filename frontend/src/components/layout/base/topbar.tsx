import {
  ThemeToggleButton,
  SidebarToggleButton,
} from "@/components/shared";
import { SettingsMenu } from "@/features/settings";
// import { SearchBar } from "@/features/searchbar";

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

      {/* TODO: add searchbar support */}
      {/* <SearchBar /> */}

      <div className="flex items-center gap-1">
        <ThemeToggleButton />

        <SettingsMenu />
      </div>
    </header>
  );
}
