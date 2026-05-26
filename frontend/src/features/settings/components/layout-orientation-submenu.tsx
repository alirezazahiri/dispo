import { Check, PanelBottom, PanelRight } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui";
import {
  useActiveWorkspaceTab,
  useWorkspaceUpdateTab,
} from "@/features/workspace/stores/workspace-selectors";
import type { WorkspaceLayout } from "@/features/workspace/types";

type LayoutOption = {
  value: WorkspaceLayout;
  label: string;
  Icon: typeof PanelRight;
};

const LAYOUT_OPTIONS: LayoutOption[] = [
  { value: "vertical", label: "Vertical", Icon: PanelRight },
  { value: "horizontal", label: "Horizontal", Icon: PanelBottom },
];

/**
 * Sub-menu that controls the orientation of the active workspace tab's
 * editor/response split. Hidden when no tab is active because the
 * orientation is a per-tab setting.
 */
export function LayoutOrientationSubmenu() {
  const activeTab = useActiveWorkspaceTab();
  const updateTab = useWorkspaceUpdateTab();

  if (!activeTab) {
    return null;
  }

  const currentLayout = activeTab.layout;
  const CurrentIcon =
    LAYOUT_OPTIONS.find((option) => option.value === currentLayout)?.Icon ??
    PanelRight;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger chevronDirection="left">
        Layout Orientation
        <CurrentIcon />
      </DropdownMenuSubTrigger>

      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-44">
          {LAYOUT_OPTIONS.map(({ value, label, Icon }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => updateTab(activeTab.id, { layout: value })}
            >
              <Icon />
              {label}
              {currentLayout === value && (
                <Check className="ml-auto opacity-70" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
