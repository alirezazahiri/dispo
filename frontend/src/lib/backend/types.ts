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

export type ScriptPhase = "pre" | "post";

export type ScriptContextPayload = {
  phase: ScriptPhase;
  source: string;
  timeoutMs?: number;
  request: ScriptRequestPayload;
  response?: ScriptResponsePayload;
  env: ScriptEnvPayload;
};

export type ScriptRequestPayload = {
  method: string;
  url: string;
  body: string;
  headers: Record<string, string>;
  params: Record<string, string>;
};

export type ScriptResponsePayload = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  cookies: ResponseCookie[];
  body: string;
  durationMs: number;
};

export type ScriptEnvPayload = {
  name: string;
  variables: Record<string, string>;
};

export type ScriptResultPayload = {
  logs: ScriptLogEntryPayload[];
  mutations: ScriptMutationsPayload;
  error?: string;
  durationMs: number;
};

export type ScriptLogEntryPayload = {
  level: "log" | "info" | "warn" | "error";
  message: string;
  timestamp: number;
  phase: ScriptPhase;
  scriptName?: string;
};

export type ScriptMutationsPayload = {
  request: ScriptRequestMutationsPayload;
  env: ScriptEnvMutationPayload[];
};

export type ScriptRequestMutationsPayload = {
  method?: string;
  url?: string;
  body?: string;
  headers: ScriptRequestKVMutationPayload[];
  params: ScriptRequestKVMutationPayload[];
};

export type ScriptRequestKVMutationPayload = {
  operation: "set" | "unset";
  key: string;
  value?: string;
};

export type ScriptEnvMutationPayload = {
  operation: "set" | "unset";
  key: string;
  value?: string;
};
