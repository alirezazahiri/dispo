import { backendClient } from "@/lib/backend/client";
import { applyRequestMutations } from "./apply-mutations";
import {
  createSkippedExecution,
  toScriptExecution,
  type ScriptRunInput,
  type ScriptRunOutput,
} from "./types";

const SCRIPT_TIMEOUT_MS = 5000;

export async function runScript(input: ScriptRunInput): Promise<ScriptRunOutput> {
  if (!input.source.trim()) {
    return {
      execution: createSkippedExecution(),
      request: input.request,
      env: input.env,
    };
  }

  const response =
    input.phase === "post" && input.response
      ? {
          status: input.response.status,
          statusText: input.response.statusText,
          headers: input.response.headers,
          cookies: input.response.cookies,
          body: input.response.body,
          durationMs: input.response.durationMs,
        }
      : undefined;

  const result = await backendClient.runScript({
    phase: input.phase,
    source: input.source,
    timeoutMs: SCRIPT_TIMEOUT_MS,
    request: input.request,
    response,
    env: input.env,
  });

  const execution = toScriptExecution(result);
  const request = applyRequestMutations(input.request, execution.mutations.request);

  return {
    execution,
    request,
    env: input.env,
  };
}

export function runPreRequestScript(source: string, input: Omit<ScriptRunInput, "phase" | "source">) {
  return runScript({
    phase: "pre",
    source,
    ...input,
  });
}

export function runPostResponseScript(
  source: string,
  input: Omit<ScriptRunInput, "phase" | "source">,
) {
  return runScript({
    phase: "post",
    source,
    ...input,
  });
}
