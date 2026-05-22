import { SendHorizonal, Loader2, Save } from "lucide-react";
import type { RequestTab, HttpMethod } from "../../types";
import { Button } from "@/components";
import { useSendHttpRequest } from "../../hooks";
import { toast } from "sonner";
import { normalizeHeaders } from "@/lib/utils";
import { getErrorMessage } from "@/components/providers";
import type { RequestSnapshot } from "../../types/response";
import {
  useActiveEnvironment,
  useWorkspaceEnvironments,
  useWorkspaceSaveTabToCollection,
  useWorkspaceSetActiveEnvironment,
  useWorkspaceUpdateTab,
} from "../../stores";
import { useWorkspaceStore } from "../../stores/workspace.store";
import { useCollectionsStore } from "@/features/collections";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { UrlInput } from "./url-input";
import { MethodSelect } from "./method-select";
import { EnvironmentSelect } from "./enironment-select";
import {
  createVariableMap,
  resolveTemplate,
  appendQueryParams,
  buildRequestSnapshot,
} from "./utils";
import {
  applyEnvironmentMutations,
  runPostResponseScript,
  runPreRequestScript,
  type ScriptExecution,
  type ScriptRequestState,
} from "../../scripting";

type Props = {
  tab: RequestTab;
};

export function RequestToolbar({ tab }: Props) {
  const updateTab = useWorkspaceUpdateTab();
  const environments = useWorkspaceEnvironments();
  const activeEnvironment = useActiveEnvironment();
  const setActiveEnvironment = useWorkspaceSetActiveEnvironment();
  const saveTabToCollection = useWorkspaceSaveTabToCollection();
  const upsertRequest = useCollectionsStore((state) => state.upsertRequest);
  const templateValues = createVariableMap(activeEnvironment?.variables ?? []);

  const { mutateAsync: sendHttpRequest, isPending } = useSendHttpRequest();

  const handleSave = async () => {
    const saved = await saveTabToCollection(tab.id);
    if (saved) {
      upsertRequest(saved);
      updateTab(tab.id, {
        title: saved.name,
        isDirty: false,
      });
    }
  };

  useHotkeys(
    [
      {
        id: `save-tab-${tab.id}-meta`,
        combo: "meta+s",
        description: "Save request",
        handler: () => {
          void handleSave();
        },
        preventDefault: true,
      },
      {
        id: `save-tab-${tab.id}-ctrl`,
        combo: "ctrl+s",
        description: "Save request",
        handler: () => {
          void handleSave();
        },
        preventDefault: true,
      },
    ],
    {
      disableInsideInputs: false,
    },
  );

  const handleMethodChange = (method: HttpMethod) => {
    updateTab(tab.id, {
      method,

      isDirty: true,
    });
  };

  const handleUrlChange = (url: string) => {
    updateTab(tab.id, {
      url,
      title:
        tab.savedRequestId == null
          ? url.length > 0
            ? url
            : "New Request"
          : tab.title,

      isDirty: true,
    });
  };

  const handleSendRequest = async () => {
    if (!tab.url) {
      toast.error("Request URL is required");

      return;
    }

    updateTab(tab.id, {
      isSending: true,
    });

    let requestSnapshot: RequestSnapshot | undefined;
    let preExecution: ScriptExecution | undefined;
    let postExecution: ScriptExecution | undefined;

    try {
      const initialRequest: ScriptRequestState = {
        method: tab.method,
        url: tab.url,
        body: tab.body,
        headers: rowsToRecord(tab.headers),
        params: rowsToRecord(tab.queryParams),
      };
      const scriptEnv = {
        name: activeEnvironment?.name ?? "",
        variables: createVariableMap(activeEnvironment?.variables ?? []),
      };
      const preResult = await runPreRequestScript(tab.preRequestScript, {
        request: initialRequest,
        env: scriptEnv,
      });
      preExecution = preResult.execution;

      applyEnvironmentMutations(activeEnvironment?.id, preExecution.mutations.env);

      if (preExecution.error) {
        updateTab(tab.id, {
          response: {
            status: "error",
            statusCode: 0,
            statusText: "Script Error",
            timeMs: preExecution.durationMs,
            size: 0,
            body: "",
            rawBody: "",
            headers: [],
            cookies: [],
            requestSnapshot,
            scripts: {
              pre: preExecution,
            },
            error: preExecution.error,
          },
          isSending: false,
        });
        return;
      }

      const latestEnvironment = activeEnvironment?.id
        ? useWorkspaceStore
            .getState()
            .environments.find((environment) => environment.id === activeEnvironment.id)
        : undefined;

      const variableMap = createVariableMap(latestEnvironment?.variables ?? []);
      const unresolvedVariables = new Set<string>();
      const requestState = preResult.request;

      const url = resolveTemplate(requestState.url, variableMap, unresolvedVariables);
      const body = resolveTemplate(requestState.body, variableMap, unresolvedVariables);

      const resolvedQueryParams = Object.entries(requestState.params)
        .filter(([key]) => key.trim())
        .map(([key, value]) => ({
          key: resolveTemplate(key, variableMap, unresolvedVariables),
          value: resolveTemplate(value, variableMap, unresolvedVariables),
        }));

      const resolvedHeaders = Object.entries(requestState.headers).reduce<Record<string, string>>(
        (acc, [key, value]) => {
          const resolvedKey = resolveTemplate(key, variableMap, unresolvedVariables);
          if (!resolvedKey.trim()) {
            return acc;
          }

          acc[resolvedKey] = resolveTemplate(value, variableMap, unresolvedVariables);
          return acc;
        },
        {},
      );

      if (tab.auth.type === "bearer" && tab.auth.bearerToken.trim()) {
        resolvedHeaders.Authorization = `Bearer ${resolveTemplate(
          tab.auth.bearerToken,
          variableMap,
          unresolvedVariables,
        )}`;
      }

      const resolvedUrl = appendQueryParams(url, resolvedQueryParams);
      requestSnapshot = buildRequestSnapshot({
        method: tab.method,
        url: resolvedUrl,
        headers: resolvedHeaders,
        body,
        queryParamsCount: resolvedQueryParams.length,
      });

      if (unresolvedVariables.size) {
        toast.warning(
          `Unresolved variables: ${Array.from(unresolvedVariables).join(", ")}`,
        );
      }

      updateTab(tab.id, {
        response: {
          status: "loading",
          requestSnapshot,
          scripts: {
            pre: preExecution,
          },
        },
      });
      const response = await sendHttpRequest({
        id: tab.id,

        method: requestState.method,

        url: resolvedUrl,

        headers: resolvedHeaders,

        body,
      });

      const postResult = await runPostResponseScript(tab.postResponseScript, {
        request: {
          method: requestState.method,
          url: resolvedUrl,
          headers: resolvedHeaders,
          params: resolvedQueryParams.reduce<Record<string, string>>((acc, param) => {
            acc[param.key] = param.value;
            return acc;
          }, {}),
          body,
        },
        env: {
          name: latestEnvironment?.name ?? "",
          variables: createVariableMap(latestEnvironment?.variables ?? []),
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          cookies: response.cookies ?? [],
          body: response.body,
          durationMs: response.duration,
        },
      });
      postExecution = postResult.execution;
      applyEnvironmentMutations(activeEnvironment?.id, postExecution.mutations.env);

      updateTab(tab.id, {
        response: {
          status:
            response.status >= 200 && response.status < 300
              ? "success"
              : "error",

          statusCode: response.status,

          statusText: response.statusText,

          timeMs: response.duration,

          size: response.body.length,

          body: response.body,

          rawBody: response.body,

          headers: normalizeHeaders(response.headers),

          cookies: response.cookies ?? [],

          requestSnapshot,

          scripts: {
            pre: preExecution,
            post: postExecution,
          },

          error: response.error,
        },

        isSending: false,

        isDirty: false,
      });
    } catch (error) {
      console.log({ error });
      const message = getErrorMessage(error);

      updateTab(tab.id, {
        response: {
          status: "error",

          statusCode: 0,

          statusText: "Network Error",

          timeMs: 0,

          size: 0,

          body: "",

          rawBody: "",

          headers: [],

          cookies: [],

          requestSnapshot,

          scripts: {
            pre: preExecution,
            post: postExecution,
          },

          error: message,
        },

        isSending: false,
      });
    }
  };

  return (
    <div
      className="
        flex h-14 shrink-0
        items-center gap-3
        border-b border-border
        bg-background px-4
      "
    >
      <MethodSelect value={tab.method} onChange={handleMethodChange} />

      <UrlInput
        value={tab.url}
        onChange={handleUrlChange}
        templateValues={templateValues}
      />

      <EnvironmentSelect
        environments={environments}
        activeEnvironmentId={activeEnvironment?.id}
        onSelect={setActiveEnvironment}
      />

      {(tab.isDirty || !tab.savedRequestId) && (
        <Button variant="outline" onClick={() => void handleSave()} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      )}

      <Button
        onClick={handleSendRequest}
        disabled={tab.isSending || isPending}
        className="
          min-w-[96px] gap-2
        "
      >
        {tab.isSending || isPending ? (
          <>
            <Loader2
              className="
                h-4 w-4
                animate-spin
              "
            />
            Sending
          </>
        ) : (
          <>
            <SendHorizonal className="h-4 w-4" />
            Send
          </>
        )}
      </Button>
    </div>
  );
}

function rowsToRecord(rows: Array<{ key: string; value: string; enabled: boolean }>) {
  return rows.reduce<Record<string, string>>((acc, row) => {
    if (!row.enabled) {
      return acc;
    }

    const key = row.key.trim();
    if (!key) {
      return acc;
    }

    acc[key] = row.value;
    return acc;
  }, {});
}
