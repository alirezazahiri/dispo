export type WorkspaceProtocol = "http" | "websocket" | "sse" | "grpc";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestTab = {
  id: string;

  protocol: WorkspaceProtocol;

  title: string;

  method: HttpMethod;

  url: string;

  isDirty: boolean;

  createdAt: number;

  updatedAt: number;
};
