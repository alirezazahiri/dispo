import { nanoid } from "nanoid";
import { RequestTab, WorkspaceProtocol } from "../types";

export const createWorkspaceTab = (
  protocol: WorkspaceProtocol = "http",
): RequestTab => {
  return {
    id: nanoid(),

    protocol,

    title: "New Request",

    method: "GET",

    url: "",

    body: "",

    headers: [],

    queryParams: [],

    isSending: false,

    isDirty: false,

    createdAt: Date.now(),

    updatedAt: Date.now(),
  };
};
