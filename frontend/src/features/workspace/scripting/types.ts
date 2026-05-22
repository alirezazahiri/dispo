import type {
  ScriptContextPayload,
  ScriptEnvMutationPayload,
  ScriptLogEntryPayload,
  ScriptRequestMutationsPayload,
  ScriptResultPayload,
} from "@/lib/backend/types";
import type { ResponseCookie } from "../types/response";

export type ScriptPhase = ScriptContextPayload["phase"];

export type ScriptRequestState = ScriptContextPayload["request"];

export type ScriptResponseState = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  cookies: ResponseCookie[];
  body: string;
  durationMs: number;
};

export type ScriptEnvState = ScriptContextPayload["env"];

export type ScriptMutations = {
  request: ScriptRequestMutationsPayload;
  env: ScriptEnvMutationPayload[];
};

export type ScriptExecution = {
  skipped?: boolean;
  durationMs: number;
  logs: ScriptLogEntryPayload[];
  error?: string;
  mutations: ScriptMutations;
};

export type ScriptRunInput = {
  phase: ScriptPhase;
  source: string;
  request: ScriptRequestState;
  env: ScriptEnvState;
  response?: ScriptResponseState;
};

export type ScriptRunOutput = {
  execution: ScriptExecution;
  request: ScriptRequestState;
  env: ScriptEnvState;
};

export function toScriptExecution(result: ScriptResultPayload): ScriptExecution {
  return {
    durationMs: result.durationMs,
    logs: result.logs ?? [],
    error: result.error,
    mutations: {
      request: result.mutations?.request ?? {
        headers: [],
        params: [],
      },
      env: result.mutations?.env ?? [],
    },
  };
}

export function createSkippedExecution(): ScriptExecution {
  return {
    skipped: true,
    durationMs: 0,
    logs: [],
    mutations: {
      request: {
        headers: [],
        params: [],
      },
      env: [],
    },
  };
}

export function normalizeLogEntries(logs: ScriptLogEntryPayload[] | undefined) {
  return logs ?? [];
}
