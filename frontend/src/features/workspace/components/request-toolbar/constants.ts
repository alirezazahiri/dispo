import { METHOD_COLORS } from "@/components/shared/method-badge";
import { HttpMethod } from "../../types";

export const METHODS: Array<{ method: HttpMethod; color: string }> =
  Object.entries(METHOD_COLORS).map(([method, color]) => ({
    method: method as HttpMethod,
    color,
  }));
