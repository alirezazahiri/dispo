import React from "react";

import { PanelBottom, PanelRight, Settings } from "lucide-react";
import { Button } from "@/components/ui";
import {
  useActiveWorkspaceTab,
  useWorkspaceUpdateTab,
} from "@/features/workspace/stores/workspace-selectors";

export const SettingsButton: React.FC = () => {
  const activeTab = useActiveWorkspaceTab();
  const updateTab = useWorkspaceUpdateTab();

  if (!activeTab) {
    return null;
  }

  const layout = activeTab.layout;

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
      onClick={() =>
        updateTab(activeTab.id, {
          layout: layout === "vertical" ? "horizontal" : "vertical",
        })
      }
    >
      {layout === "vertical" ? (
        <PanelRight className="h-4 w-4" />
      ) : (
        <PanelBottom className="h-4 w-4" />
      )}

      {/* TODO: turn it back to settings and create a settings drawer */}
      {/* <Settings className="h-4 w-4" /> */}
    </Button>
  );
};
