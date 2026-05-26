import { nanoid } from "nanoid";
import { RequestTab, WorkspaceProtocol } from "../types";

export const createWorkspaceTab = (
  protocol: WorkspaceProtocol = "http",
  collectionId = "default-collection",
): RequestTab => {
  return {
    id: nanoid(),
    collectionId,
    savedRequestId: null,

    layout: "vertical",

    protocol,

    title: "New Request",

    method: "GET",

    url: "",

    bodyMode: "none",

    body: "",

    bodyContentType: "application/json",

    formSubtype: "application/x-www-form-urlencoded",

    formFields: [],

    fileContentType: "application/octet-stream",

    fileBody: null,

    graphqlQuery: "",

    graphqlVariables: "",

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
