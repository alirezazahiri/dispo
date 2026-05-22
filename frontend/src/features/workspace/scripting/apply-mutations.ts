import { nanoid } from "nanoid";
import type {
  ScriptEnvMutationPayload,
  ScriptRequestMutationsPayload,
} from "@/lib/backend/types";
import type { KeyValuePair } from "../types";
import { useWorkspaceStore } from "../stores/workspace.store";
import type { ScriptRequestState } from "./types";

export function applyRequestMutations(
  request: ScriptRequestState,
  mutations: ScriptRequestMutationsPayload | undefined,
): ScriptRequestState {
  if (!mutations) {
    return request;
  }

  const nextRequest: ScriptRequestState = {
    method: mutations.method ?? request.method,
    url: mutations.url ?? request.url,
    body: mutations.body ?? request.body,
    headers: {
      ...request.headers,
    },
    params: {
      ...request.params,
    },
  };

  for (const mutation of mutations.headers ?? []) {
    if (!mutation.key) {
      continue;
    }
    if (mutation.operation === "set") {
      nextRequest.headers[mutation.key] = mutation.value ?? "";
      continue;
    }
    delete nextRequest.headers[mutation.key];
  }

  for (const mutation of mutations.params ?? []) {
    if (!mutation.key) {
      continue;
    }
    if (mutation.operation === "set") {
      nextRequest.params[mutation.key] = mutation.value ?? "";
      continue;
    }
    delete nextRequest.params[mutation.key];
  }

  return nextRequest;
}

export function applyEnvironmentMutations(
  environmentId: string | undefined,
  mutations: ScriptEnvMutationPayload[] | undefined,
) {
  if (!environmentId || !mutations?.length) {
    return;
  }

  const store = useWorkspaceStore.getState();
  const targetEnvironment = store.environments.find(
    (environment) => environment.id === environmentId,
  );

  if (!targetEnvironment) {
    return;
  }

  const nextVariables: KeyValuePair[] = [...targetEnvironment.variables];

  for (const mutation of mutations) {
    const key = mutation.key.trim();
    if (!key) {
      continue;
    }

    if (mutation.operation === "set") {
      const existingIndex = nextVariables.findIndex(
        (variable) => variable.key.trim() === key,
      );

      if (existingIndex === -1) {
        nextVariables.push({
          id: nanoid(),
          key,
          value: mutation.value ?? "",
          enabled: true,
        });
      } else {
        nextVariables[existingIndex] = {
          ...nextVariables[existingIndex],
          key,
          value: mutation.value ?? "",
          enabled: true,
        };
      }
      continue;
    }

    const filtered = nextVariables.filter((variable) => variable.key.trim() !== key);
    nextVariables.splice(0, nextVariables.length, ...filtered);
  }

  store.updateEnvironment(environmentId, {
    variables: nextVariables,
  });
}
