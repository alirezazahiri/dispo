import React from "react";
import { Button } from "@/components/ui";
import { PanelLeft } from "lucide-react";
import { useSidebarStore } from "@/stores";

export const SidebarToggleButton: React.FC = () => {
  const toggle = useSidebarStore((state) => state.toggle);
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
      onClick={toggle}
    >
      <PanelLeft className="h-4 w-4" />
    </Button>
  );
};
