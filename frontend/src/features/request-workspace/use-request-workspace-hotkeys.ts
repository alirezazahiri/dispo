import { useHotkeys } from "@/hooks/use-hotkeys";
import { useWorkspaceStore } from "./stores";

export const useRequestWorkspaceHotkeys = () => {
  const createTab = useWorkspaceStore((state) => state.createTab);

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
