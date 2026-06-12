import { SendHorizonal, Loader2, Save } from "lucide-react";
import type { RequestTab, HttpMethod } from "../../types";
import { Button } from "@/components";
import { useSendHttpRequest } from "../../hooks";
import { toast } from "sonner";
import { cn, normalizeHeaders } from "@/lib/utils";
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
import { ProtocolSelect } from "./protocol-select";
import { EnvironmentSelect } from "./enironment-select";
import { RequestToolbarShell } from "./request-toolbar-shell";
import { RequestToolbarOverflowMenu } from "./request-toolbar-overflow-menu";
import { ToolbarResponsiveButton } from "./toolbar-responsive-button";
import { TOOLBAR_CONTROL_HEIGHT } from "./constants";
import type { WorkspaceProtocol } from "../../types";
import { buildRequestBody } from "../request-editor/request-body-editor/utils";
import {
  createVariableMap,
  resolveTemplate,
  appendQueryParams,
  buildRequestSnapshot,
  reconcilePathParamRows,
  substitutePathParams,
} from "./utils";
import { resolveEffectiveAuth } from "../../utils/resolve-effective-auth";
import { nanoid } from "nanoid";
import {
  applyEnvironmentMutations,
  runPostResponseScript,
  runPreRequestScript,
  type ScriptExecution,
  type ScriptRequestState,
} from "../../scripting";

type Props = {
  tab: RequestTab;
  onProtocolChange: (protocol: WorkspaceProtocol) => void;
};

export function HttpRequestToolbar({ tab, onProtocolChange }: Props) {
  const updateTab = useWorkspaceUpdateTab();
  const environments = useWorkspaceEnvironments();
  const activeEnvironment = useActiveEnvironment();
  const setActiveEnvironment = useWorkspaceSetActiveEnvironment();
  const saveTabToCollection = useWorkspaceSaveTabToCollection();
  const upsertRequest = useCollectionsStore((state) => state.upsertRequest);
  const templateValues = createVariableMap(activeEnvironment?.variables ?? []);

  // Mirrors the keys/values of the tab's path params for the URL highlighter
  // and autocomplete popover. Disabled and empty rows are filtered out so
  // the popover doesn't surface "blank suggestions" the user can't act on.
  const pathParamValues = (tab.pathParams ?? []).reduce<Record<string, string>>(
    (acc, row) => {
      const key = row.key.trim();
      if (!key || !row.enabled) {
        return acc;
      }
      acc[key] = row.value;
      return acc;
    },
    {},
  );

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
    // Walk the URL for `:name` placeholders and reconcile Path Param
    // rows: add rows for new placeholders, drop auto-added empty rows
    // for placeholders that just disappeared (so we don't accumulate
    // stale rows while the user types `:u` → `:us` → `:userId`).
    const previousRows = tab.pathParams ?? [];
    const nextPathParams = reconcilePathParamRows(
      url,
      tab.url,
      previousRows,
      () => nanoid(),
    );
    const pathParamsChanged = nextPathParams !== previousRows;

    updateTab(tab.id, {
      url,
      title:
        tab.savedRequestId == null
          ? url.length > 0
            ? url
            : "New Request"
          : tab.title,

      isDirty: true,

      ...(pathParamsChanged ? { pathParams: nextPathParams } : null),
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
        body: buildRequestBody(tab),
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
      const unresolvedPathParams = new Set<string>();
      const requestState = preResult.request;

      // Resolve `{{var}}` first so a path-param value of e.g. `{{userId}}`
      // is expanded against the environment before we splice it into the
      // URL. Then substitute `:name` placeholders against the tab's path
      // params (their own values are also `{{var}}`-resolved).
      const urlWithEnv = resolveTemplate(
        requestState.url,
        variableMap,
        unresolvedVariables,
      );
      const resolvedPathParamRows = (tab.pathParams ?? []).map((row) => ({
        key: row.key,
        value: resolveTemplate(row.value, variableMap, unresolvedVariables),
        enabled: row.enabled,
      }));
      const url = substitutePathParams(
        urlWithEnv,
        resolvedPathParamRows,
        unresolvedPathParams,
      );
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

      const collection = useCollectionsStore.getState().collectionsById[tab.collectionId];
      const effectiveAuth = resolveEffectiveAuth(tab.auth, collection?.auth);
      if (effectiveAuth.type === "bearer" && effectiveAuth.bearerToken.trim()) {
        resolvedHeaders.Authorization = `Bearer ${resolveTemplate(
          effectiveAuth.bearerToken,
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

      if (unresolvedPathParams.size) {
        toast.warning(
          `Unresolved path params: ${Array.from(unresolvedPathParams).join(", ")}`,
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

        bodyMode: tab.bodyMode,

        body,

        formSubtype: tab.formSubtype,

        formFields: tab.formFields,

        file: tab.bodyMode === "file" ? tab.fileBody : null,

        fileContentType: tab.fileContentType,

        graphql:
          tab.bodyMode === "graphql"
            ? {
                query: tab.graphqlQuery,
                variables: tab.graphqlVariables,
              }
            : null,
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

  const showSave = tab.isDirty || !tab.savedRequestId;

  return (
    <RequestToolbarShell
      leading={
        <ProtocolSelect value={tab.protocol} onChange={onProtocolChange} />
      }
      method={
        <MethodSelect value={tab.method} onChange={handleMethodChange} />
      }
      url={
        <UrlInput
          value={tab.url}
          onChange={handleUrlChange}
          templateValues={templateValues}
          pathParamValues={pathParamValues}
        />
      }
      secondary={
        <>
          <EnvironmentSelect
            environments={environments}
            activeEnvironmentId={activeEnvironment?.id}
            onSelect={setActiveEnvironment}
          />

          {showSave ? (
            <Button
              variant="outline"
              onClick={() => void handleSave()}
              className={cn("gap-2 shadow-none hover:shadow-none", TOOLBAR_CONTROL_HEIGHT)}
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          ) : null}
        </>
      }
      primaryAction={
        <ToolbarResponsiveButton
          onClick={handleSendRequest}
          disabled={tab.isSending || isPending}
          ariaLabel="Send request"
          tooltip="Send request"
          icon={<SendHorizonal className="h-4 w-4" />}
          label="Send"
          isLoading={tab.isSending || isPending}
          loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
          loadingLabel="Sending"
        />
      }
      overflow={
        <RequestToolbarOverflowMenu
          environments={environments}
          activeEnvironmentId={activeEnvironment?.id}
          onSelectEnvironment={setActiveEnvironment}
          showSave={showSave}
          onSave={() => void handleSave()}
        />
      }
    />
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
