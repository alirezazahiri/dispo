import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  `
    inline-flex items-center gap-1 rounded-md border
    px-2 py-0.5 text-xs font-medium
    transition-colors
    focus:outline-none
    focus:ring-2 focus:ring-ring focus:ring-offset-2
  `,
  {
    variants: {
      variant: {
        default: `
          border-transparent
          bg-primary
          text-primary-foreground
        `,

        secondary: `
          border-transparent
          bg-secondary
          text-secondary-foreground
        `,

        destructive: `
          border-transparent
          bg-destructive
          text-destructive-foreground
        `,

        outline: `
          border-border
          bg-transparent
          text-foreground
        `,

        success: `
          border-emerald-500/20
          bg-emerald-500/10
          text-emerald-500
        `,

        warning: `
          border-amber-500/20
          bg-amber-500/10
          text-amber-500
        `,

        info: `
          border-sky-500/20
          bg-sky-500/10
          text-sky-500
        `,

        muted: `
          border-border
          bg-muted/50
          text-muted-foreground
        `,
      },
    },

    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
