import type { WorkspaceState } from "@/features/workspace/types";
import type { ResponseCookie } from "@/features/workspace/types/response";

export type HttpRequestPayload = {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
};

export type HttpResponsePayload = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  cookies: ResponseCookie[];
  body: string;
  duration: number;
  error?: string;
};

export type WorkspaceStatePayload = WorkspaceState;
