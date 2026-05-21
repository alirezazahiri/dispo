import { useHotkeys } from "@/hooks/use-hotkeys";

import { useSidebarStore } from "@/stores/sidebar";

export const useSidebarHotkeys = () => {
  const toggleSidebar = useSidebarStore((state) => state.toggle);

  useHotkeys(
    [
      {
        id: "toggle-sidebar",
        combo: "meta+b",
        description: "Toggle sidebar",
        handler: () => {
          toggleSidebar();
        },
      },
      {
        id: "toggle-sidebar-windows",
        combo: "ctrl+b",
        description: "Toggle sidebar",
        handler: () => {
          toggleSidebar();
        },
      },
    ],
    {
      disableInsideInputs: true,
    },
  );
};
