import { useHotkeys } from "@/hooks/use-hotkeys";
import { useWorkspaceCreateTab } from "./stores";

export const useRequestWorkspaceHotkeys = () => {
  const createTab = useWorkspaceCreateTab();

  useHotkeys(
    [
      {
        id: "create-tab",
        combo: "meta+shift+t",
        description: "Add new tab to the right",
        handler: () => {
          createTab();
        },
        preventDefault: true,
      },

      {
        id: "create-tab-windows",
        combo: "ctrl+shift+t",
        description: "Add new tab to the right",
        handler: () => {
          createTab();
        },
        preventDefault: true,
      },
    ],
    {
      disableInsideInputs: true,
    },
  );
};
