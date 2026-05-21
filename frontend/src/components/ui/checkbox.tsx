import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export const Checkbox = React.forwardRef<HTMLButtonElement, Props>(
  (
    { checked, onCheckedChange, disabled = false, className, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          `
            peer inline-flex h-4 w-4 shrink-0 items-center justify-center
            rounded-[4px] border border-input bg-background
            transition-colors
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-ring focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            data-[state=checked]:border-primary data-[state=checked]:bg-primary
            data-[state=checked]:text-primary-foreground
          `,
          className,
        )}
        data-state={checked ? "checked" : "unchecked"}
        {...props}
      >
        {checked ? <Check className="h-3 w-3" /> : null}
      </button>
    );
  },
);

Checkbox.displayName = "Checkbox";
