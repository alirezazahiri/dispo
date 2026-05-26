import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const floatingActionButtonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-full font-medium",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",

    // elevation
    "shadow-lg hover:shadow-xl",

    // interaction
    "active:scale-95 active:translate-y-px",

    // icon defaults
    "[&_svg]:pointer-events-none",
    "[&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",

        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",

        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",

        outline:
          "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",

        surface:
          "bg-popover text-popover-foreground border border-border hover:bg-accent hover:text-accent-foreground",
      },

      size: {
        sm: "h-9 w-9 [&_svg]:size-4",
        default: "h-12 w-12 [&_svg]:size-5",
        lg: "h-14 w-14 [&_svg]:size-6",
        extended: "h-12 px-5 [&_svg]:size-5",
      },

      position: {
        none: "",
        "bottom-right": "absolute bottom-4 right-4 z-20",
        "bottom-left": "absolute bottom-4 left-4 z-20",
        "top-right": "absolute top-4 right-4 z-20",
        "top-left": "absolute top-4 left-4 z-20",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
      position: "none",
    },
  },
);

export interface FloatingActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof floatingActionButtonVariants> {
  asChild?: boolean;
}

const FloatingActionButton = React.forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(
  (
    { className, variant, size, position, asChild = false, type, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(
          floatingActionButtonVariants({ variant, size, position, className }),
        )}
        {...props}
      />
    );
  },
);

FloatingActionButton.displayName = "FloatingActionButton";

export { FloatingActionButton, floatingActionButtonVariants };
