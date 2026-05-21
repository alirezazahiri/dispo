import { useEffect } from "react";

import {
  type HotkeyDefinition,
  isInputLikeElement,
  keyboardEventToHotkey,
  normalizeHotkey,
} from "@/lib/hotkeys";
import { toast } from "sonner";

type UseHotkeysOptions = {
  disableInsideInputs?: boolean;
};

export const useHotkeys = (
  hotkeys: HotkeyDefinition[],
  options?: UseHotkeysOptions,
) => {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (options?.disableInsideInputs && isInputLikeElement(event.target)) {
        return;
      }
      
      const pressed = keyboardEventToHotkey(event);

      for (const hotkey of hotkeys) {
        if (hotkey.enabled === false) {
          continue;
        }

        const expected = normalizeHotkey(hotkey.combo);

        if (pressed !== expected) {
          continue;
        }

        if (hotkey.preventDefault !== false) {
          event.preventDefault();
        }

        hotkey.handler(event);
      }
    };

    window.addEventListener("keydown", listener);

    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [hotkeys, options]);
};
