export type WorkspaceProtocol = "http" | "websocket" | "sse" | "grpc";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type KeyValuePair = {
  id: string;

  key: string;

  value: string;

  enabled: boolean;
};

export type RequestTab = {
  id: string;

  protocol: WorkspaceProtocol;

  title: string;

  method: HttpMethod;

  url: string;

  body: string;

  headers: KeyValuePair[];

  queryParams: KeyValuePair[];

  response?: {
    status: number;

    statusText: string;

    duration: number;

    size: number;

    data: unknown;
  };

  isSending: boolean;

  isDirty: boolean;

  createdAt: number;

  updatedAt: number;
};
