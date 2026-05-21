import type { ResponseData } from "./response";

export type WorkspaceProtocol = "http" | "websocket" | "sse" | "grpc";

export type WorkspaceLayout = "vertical" | "horizontal";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

export type KeyValuePair = {
  id: string;

  key: string;

  value: string;

  enabled: boolean;
};

export type RequestAuthType = "none" | "bearer";

export type RequestAuth = {
  type: RequestAuthType;
  bearerToken: string;
};

export type Environment = {
  id: string;
  name: string;
  variables: KeyValuePair[];
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

  auth: RequestAuth;

  response?: ResponseData;

  isSending: boolean;

  isDirty: boolean;

  createdAt: number;

  updatedAt: number;
};

export type WorkspaceState = {
  tabs: RequestTab[];
  activeTabId: string;
  environments: Environment[];
  activeEnvironmentId: string;
};
