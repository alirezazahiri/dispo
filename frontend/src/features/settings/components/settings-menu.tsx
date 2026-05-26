import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { SettingsButton } from "@/components/shared";

import { ImportCollectionSubmenu } from "./import-collection-submenu";
import { LayoutOrientationSubmenu } from "./layout-orientation-submenu";

/**
 * The settings dropdown shown in the top bar.
 *
 * Each section is implemented in its own component file so that adding a
 * new entry only requires importing and dropping it into the list below.
 */
export function SettingsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SettingsButton />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <LayoutOrientationSubmenu />
        <DropdownMenuSeparator />
        <ImportCollectionSubmenu />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
