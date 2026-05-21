import type { ResponseData } from "./response";

export type WorkspaceProtocol = "http" | "websocket" | "sse" | "grpc";

export type WorkspaceLayout = "vertical" | "horizontal";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type KeyValuePair = {
  id: string;

  key: string;

  value: string;

  enabled: boolean;
};

export type RequestTab = {
  id: string;

  layout: WorkspaceLayout;

  protocol: WorkspaceProtocol;

  title: string;

  method: HttpMethod;

  url: string;

  body: string;

  headers: KeyValuePair[];

  queryParams: KeyValuePair[];

  response?: ResponseData;

  isSending: boolean;

  isDirty: boolean;

  createdAt: number;

  updatedAt: number;
};
