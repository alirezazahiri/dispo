import { nanoid } from "nanoid";

import type { RequestTab } from "@/features/workspace/types";

export function mapTabToHttpPayload(tab: RequestTab) {
  return {
    id: nanoid(),

    method: tab.method,

    url: tab.url,

    headers: {},

    body: tab.body,
  };
}
