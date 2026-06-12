import type { ReactNode } from "react";
import { MoreHorizontal, Save, Trash2 } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components";
import { TOOLBAR_ICON_BUTTON } from "./constants";

type EnvironmentOption = {
  id: string;
  name: string;
};

type Props = {
  environments: EnvironmentOption[];
  activeEnvironmentId?: string;
  onSelectEnvironment: (environmentId: string) => void;
  showSave?: boolean;
  onSave?: () => void;
  extraItems?: ReactNode;
};

export function RequestToolbarOverflowMenu({
  environments,
  activeEnvironmentId,
  onSelectEnvironment,
  showSave = false,
  onSave,
  extraItems,
}: Props) {
  const activeEnvironment = environments.find(
    (environment) => environment.id === activeEnvironmentId,
  );

  return (
    <DropdownMenu>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={TOOLBAR_ICON_BUTTON}
                aria-label="More request actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {activeEnvironment
              ? `Environment: ${activeEnvironment.name}`
              : "More actions"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Environment</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={activeEnvironmentId}
          onValueChange={onSelectEnvironment}
        >
          {environments.map((environment) => (
            <DropdownMenuRadioItem
              key={environment.id}
              value={environment.id}
            >
              {environment.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        {extraItems ? (
          <>
            <DropdownMenuSeparator />
            {extraItems}
          </>
        ) : null}

        {showSave ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSave}>
              <Save />
              Save request
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type SseClearOverflowItemProps = {
  disabled?: boolean;
  onClear: () => void;
};

export function SseClearOverflowItem({
  disabled = false,
  onClear,
}: SseClearOverflowItemProps) {
  return (
    <DropdownMenuItem disabled={disabled} onClick={onClear}>
      <Trash2 />
      Clear stream
    </DropdownMenuItem>
  );
}

type WsClearOverflowItemProps = {
  disabled?: boolean;
  onClear: () => void;
};

export function WsClearOverflowItem({
  disabled = false,
  onClear,
}: WsClearOverflowItemProps) {
  return (
    <DropdownMenuItem disabled={disabled} onClick={onClear}>
      <Trash2 />
      Clear messages
    </DropdownMenuItem>
  );
}
