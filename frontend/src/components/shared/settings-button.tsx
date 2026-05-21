import React from "react";
import { Button } from "@/components/ui";
import { Settings } from "lucide-react";

export const SettingsButton: React.FC = () => {
  return (
    <Button
      size="icon"
      variant="ghost"
      className="
      h-8 w-8
      text-muted-foreground
      hover:bg-accent
      hover:text-foreground
    "
    >
      <Settings className="h-4 w-4" />
    </Button>
  );
};
