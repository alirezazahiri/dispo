import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md text-sm font-medium",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",

    // interaction
    "active:scale-[0.98] active:translate-y-px",

    // icon defaults
    "[&_svg]:pointer-events-none",
    "[&_svg]:size-4",
    "[&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",

        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",

        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",

        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",

        ghost: "hover:bg-accent hover:text-accent-foreground",

        link: [
          "text-primary underline-offset-4 hover:underline",
          "shadow-none",
          "active:scale-100 active:translate-y-0",
        ].join(" "),
      },

      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const ButtonRoot = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);

ButtonRoot.displayName = "Button";

type ButtonAdornmentProps = React.HTMLAttributes<HTMLSpanElement>;

function ButtonStart({
  className,
  children,
  ...props
}: ButtonAdornmentProps) {
  return (
    <span
      className={cn(
        "flex items-center justify-center shrink-0",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

function ButtonEnd({
  className,
  children,
  ...props
}: ButtonAdornmentProps) {
  return (
    <span
      className={cn(
        "flex items-center justify-center shrink-0",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export const Button = Object.assign(ButtonRoot, {
  Start: ButtonStart,
  End: ButtonEnd,
});

export { buttonVariants };