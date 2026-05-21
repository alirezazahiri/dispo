import { SendHorizonal, Loader2 } from "lucide-react";
import type { RequestTab, HttpMethod, KeyValuePair } from "../../types";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { TemplateHighlightInput } from "@/components/shared";
import { useSendHttpRequest } from "../../hooks";
import { toast } from "sonner";
import { normalizeHeaders } from "@/lib/utils";
import { getErrorMessage } from "@/components/providers";
import {
  useActiveEnvironment,
  useWorkspaceEnvironments,
  useWorkspaceSetActiveEnvironment,
  useWorkspaceUpdateTab,
} from "../../stores";

type Props = {
  tab: RequestTab;
};

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

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
            value: resolveTemplate(header.value, variableMap, unresolvedVariables),
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

      if (unresolvedVariables.size) {
        toast.warning(
          `Unresolved variables: ${Array.from(unresolvedVariables).join(", ")}`,
        );
      }

      updateTab(tab.id, {
        response: {
          status: "loading",
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

type EnvironmentSelectProps = {
  environments: Array<{ id: string; name: string }>;
  activeEnvironmentId?: string;
  onSelect: (environmentId: string) => void;
};

function EnvironmentSelect({
  environments,
  activeEnvironmentId,
  onSelect,
}: EnvironmentSelectProps) {
  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <Select value={activeEnvironmentId} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Environment" />
        </SelectTrigger>
        <SelectContent>
          {environments.map((environment) => (
            <SelectItem key={environment.id} value={environment.id}>
              {environment.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function createVariableMap(variables: KeyValuePair[]) {
  return variables.reduce<Record<string, string>>((acc, variable) => {
    const key = variable.key.trim();
    if (variable.enabled && key) {
      acc[key] = variable.value;
    }
    return acc;
  }, {});
}

function resolveTemplate(
  value: string,
  variableMap: Record<string, string>,
  unresolvedVariables: Set<string>,
) {
  return value.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_, variableName: string) => {
    if (Object.prototype.hasOwnProperty.call(variableMap, variableName)) {
      return variableMap[variableName];
    }
    unresolvedVariables.add(variableName);
    return `{{${variableName}}}`;
  });
}

function appendQueryParams(
  url: string,
  params: Array<{ key: string; value: string }>,
) {
  if (!params.length) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    params.forEach((param) => {
      parsedUrl.searchParams.set(param.key, param.value);
    });
    return parsedUrl.toString();
  } catch {
    const [baseUrl, existingQuery = ""] = url.split("?");
    const searchParams = new URLSearchParams(existingQuery);
    params.forEach((param) => {
      searchParams.set(param.key, param.value);
    });
    const query = searchParams.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  }
}

type MethodSelectProps = {
  value: HttpMethod;
  onChange: (method: HttpMethod) => void;
};

function MethodSelect({ value, onChange }: MethodSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="max-w-[8rem]">
        <SelectValue placeholder="Http Method" />
      </SelectTrigger>
      <SelectContent>
        {METHODS.map((method) => (
          <SelectItem key={method} value={method}>
            {method}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type UrlInputProps = {
  value: string;

  onChange: (value: string) => void;
  templateValues: Record<string, string>;
};

function UrlInput({ value, onChange, templateValues }: UrlInputProps) {
  return (
    <TemplateHighlightInput
      value={value}
      onChange={onChange}
      placeholder="https://api.example.com/users"
      className="w-full"
      templateValues={templateValues}
    />
  );
}
