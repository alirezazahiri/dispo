import * as React from "react";

import { Settings } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui";
import { cn } from "@/lib/utils";

export const SettingsButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon"
        variant="ghost"
        aria-label="Settings"
        className={cn(
          "h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground",
          className,
        )}
        {...props}
      >
        <Settings className="h-4 w-4" />
      </Button>
    );
  },
);

SettingsButton.displayName = "SettingsButton";
