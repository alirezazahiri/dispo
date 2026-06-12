import { METHOD_COLORS } from "@/components/shared/method-badge";
import { HttpMethod } from "../../types";

/** Shared height for all controls in the request toolbar row. */
export const TOOLBAR_CONTROL_HEIGHT = "h-9";

/** Square icon-only controls (Send, overflow menu, compact SSE badge). */
export const TOOLBAR_ICON_BUTTON = "h-9 w-9 shrink-0";

export const METHODS: Array<{ method: HttpMethod; color: string }> =
  Object.entries(METHOD_COLORS).map(([method, color]) => ({
    method: method as HttpMethod,
    color,
  }));
