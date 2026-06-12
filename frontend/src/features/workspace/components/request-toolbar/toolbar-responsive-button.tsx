import type { ReactNode } from "react";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components";
import { cn } from "@/lib/utils";
import { TOOLBAR_CONTROL_HEIGHT, TOOLBAR_ICON_BUTTON } from "./constants";

type Props = {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
  tooltip: string;
  icon: ReactNode;
  label: string;
  variant?: "default" | "outline";
  isLoading?: boolean;
  loadingIcon?: ReactNode;
  loadingLabel?: string;
  wideClassName?: string;
};

export function ToolbarResponsiveButton({
  onClick,
  disabled = false,
  ariaLabel,
  tooltip,
  icon,
  label,
  variant = "default",
  isLoading = false,
  loadingIcon,
  loadingLabel,
  wideClassName = "@workspace-compact/workspace:min-w-[96px]",
}: Props) {
  const visibleLabel = isLoading ? (loadingLabel ?? label) : label;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            onClick={onClick}
            disabled={disabled}
            aria-label={isLoading ? (loadingLabel ?? ariaLabel) : ariaLabel}
            className={cn(
              TOOLBAR_ICON_BUTTON,
              "px-0 shadow-none hover:shadow-none",
              "@workspace-compact/workspace:w-auto @workspace-compact/workspace:px-3",
              "@workspace-compact/workspace:gap-2",
              TOOLBAR_CONTROL_HEIGHT,
              wideClassName,
            )}
          >
            {isLoading ? (loadingIcon ?? icon) : icon}
            <span className="hidden @workspace-compact/workspace:inline">
              {visibleLabel}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="@workspace-compact/workspace:hidden"
        >
          {isLoading ? (loadingLabel ?? tooltip) : tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
