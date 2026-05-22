import { SendHorizonal, Loader2 } from "lucide-react";
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
  useWorkspaceSetActiveEnvironment,
  useWorkspaceUpdateTab,
} from "../../stores";
import { UrlInput } from "./url-input";
import { MethodSelect } from "./method-select";
import { EnvironmentSelect } from "./enironment-select";
import {
  createVariableMap,
  resolveTemplate,
  appendQueryParams,
  buildRequestSnapshot,
} from "./utils";

type Props = {
  tab: RequestTab;
};

export function RequestToolbar({ tab }: Props) {
  const updateTab = useWorkspaceUpdateTab();
  const environments = useWorkspaceEnvironments();
  const activeEnvironment = useActiveEnvironment();
  const setActiveEnvironment = useWorkspaceSetActiveEnvironment();
  const templateValues = createVariableMap(activeEnvironment?.variables ?? []);

  const { mutateAsync: sendHttpRequest, isPending } = useSendHttpRequest();

  const handleMethodChange = (method: HttpMethod) => {
    updateTab(tab.id, {
      method,

      isDirty: true,
    });
  };

  const handleUrlChange = (url: string) => {
    updateTab(tab.id, {
      url,

      title: url.length > 0 ? url : "New Request",

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

    try {
      const variableMap = createVariableMap(activeEnvironment?.variables ?? []);
      const unresolvedVariables = new Set<string>();

      const url = resolveTemplate(tab.url, variableMap, unresolvedVariables);
      const body = resolveTemplate(tab.body, variableMap, unresolvedVariables);

      const resolvedQueryParams = tab.queryParams
        .filter((param) => param.enabled && param.key.trim())
        .map((param) => ({
          key: resolveTemplate(param.key, variableMap, unresolvedVariables),
          value: resolveTemplate(param.value, variableMap, unresolvedVariables),
        }));

      const resolvedHeaders = (
        tab.headers
          ?.filter((header) => header.enabled && header.key.trim())
          .map((header) => ({
            key: resolveTemplate(header.key, variableMap, unresolvedVariables),
            value: resolveTemplate(
              header.value,
              variableMap,
              unresolvedVariables,
            ),
          })) ?? []
      ).reduce<Record<string, string>>((acc, header) => {
        if (header.key.trim()) {
          acc[header.key] = header.value;
        }
        return acc;
      }, {});

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
        },
      });
      const response = await sendHttpRequest({
        id: tab.id,

        method: tab.method,

        url: resolvedUrl,

        headers: resolvedHeaders,

        body,
      });

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
