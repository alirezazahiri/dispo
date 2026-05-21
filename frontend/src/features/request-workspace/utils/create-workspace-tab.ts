import { nanoid } from "nanoid";

import type {
  RequestTab,
  WorkspaceProtocol,
} from "@/features/request-workspace/types";

export const createWorkspaceTab = (
  protocol: WorkspaceProtocol = "http",
): RequestTab => {
  return {
    id: nanoid(),

    protocol,

    title: "New Request",

    method: "GET",

    url: "",

    isDirty: false,

    createdAt: Date.now(),

    updatedAt: Date.now(),
  };
};
