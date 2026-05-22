import { nanoid } from "nanoid";
import { RequestTab, WorkspaceProtocol } from "../types";

export const createWorkspaceTab = (
  protocol: WorkspaceProtocol = "http",
): RequestTab => {
  return {
    id: nanoid(),

    layout: "vertical",

    protocol,

    title: "New Request",

    method: "GET",

    url: "",

    body: "",

    preRequestScript: "",

    postResponseScript: "",

    headers: [],

    queryParams: [],

    auth: {
      type: "none",
      bearerToken: "",
    },

    isSending: false,

    isDirty: false,

    createdAt: Date.now(),

    updatedAt: Date.now(),
  };
};
