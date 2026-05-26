import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components";
import type { RequestBodyMode } from "../../../types";
import { BODY_MODE_DESCRIPTORS } from "./constants";

type Props = {
  value: RequestBodyMode;
  onChange: (mode: RequestBodyMode) => void;
};

export function BodyModeSelector({ value, onChange }: Props) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        role="tablist"
        aria-label="Body mode"
        className="
          flex shrink-0 items-center gap-1
          border-b border-border
          bg-background/60 px-3 py-2
        "
      >
        {BODY_MODE_DESCRIPTORS.map((descriptor) => {
          const Icon = descriptor.icon;
          const isActive = descriptor.mode === value;
          const isDisabled = Boolean(descriptor.disabled);

          return (
            <Tooltip key={descriptor.mode}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-disabled={isDisabled}
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled || isActive) return;
                    onChange(descriptor.mode);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    "h-7 rounded-md px-2.5 text-xs font-medium",
                    "transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    isDisabled &&
                      "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {descriptor.label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {descriptor.description}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
