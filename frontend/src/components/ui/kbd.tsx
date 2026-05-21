// src/components/ui/kbd.tsx

import * as React from "react";

import { cn } from "@/lib/utils";

const Kbd = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => {
  return (
    <kbd
      ref={ref}
      className={cn(
        `
          inline-flex h-5 min-w-5 items-center justify-center
          rounded-md border border-border
          bg-muted px-1.5
          text-[10px] font-medium
          text-muted-foreground
          shadow-sm
          select-none
        `,
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
});

Kbd.displayName = "Kbd";

type KbdGroupProps =
  React.HTMLAttributes<HTMLDivElement>;

const KbdGroup = React.forwardRef<
  HTMLDivElement,
  KbdGroupProps
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1",
        className,
      )}
      {...props}
    />
  );
});

KbdGroup.displayName = "KbdGroup";

export { Kbd, KbdGroup };