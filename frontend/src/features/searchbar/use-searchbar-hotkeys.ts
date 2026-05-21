import { useHotkeys } from "@/hooks/use-hotkeys";
import { toast } from "sonner";

export const useSearchBarHotkeys = () => {
  useHotkeys(
    [
      {
        id: "open-sidebar",
        combo: "meta+k",
        description: "Open searchbar",
        handler: () => {
          toast("coming soon: opens searchbar");
        },
      },

      {
        id: "open-sidebar-windows",
        combo: "ctrl+k",
        description: "Open sidebar",
        handler: () => {
          toast("coming soon: opens searchbar");
        },
      },
    ],
    {
      disableInsideInputs: true,
    },
  );
};
