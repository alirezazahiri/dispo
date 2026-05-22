import { KeyValuePair } from "../../types";
import { RequestSnapshot } from "../../types/response";

export function createVariableMap(variables: KeyValuePair[]) {
  return variables.reduce<Record<string, string>>((acc, variable) => {
    const key = variable.key.trim();
    if (variable.enabled && key) {
      acc[key] = variable.value;
    }
    return acc;
  }, {});
}

export function resolveTemplate(
  value: string,
  variableMap: Record<string, string>,
  unresolvedVariables: Set<string>,
) {
  return value.replace(
    /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g,
    (_, variableName: string) => {
      if (Object.prototype.hasOwnProperty.call(variableMap, variableName)) {
        return variableMap[variableName];
      }
      unresolvedVariables.add(variableName);
      return `{{${variableName}}}`;
    },
  );
}

export function appendQueryParams(
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

export function buildRequestSnapshot(input: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  queryParamsCount: number;
}): RequestSnapshot {
  const normalizedHeaders = Object.entries(input.headers).reduce<
    Record<string, string>
  >((acc, [key, value]) => {
    acc[key.toLowerCase()] = value;
    return acc;
  }, {});

  const authorization = normalizedHeaders.authorization || "Not set";
  const userAgent = normalizedHeaders["user-agent"] || "dispo/1.0";
  const contentType = normalizedHeaders["content-type"] || "Not set";
  const contentLength = new TextEncoder().encode(input.body || "").length;
  const host = extractHost(input.url);

  return {
    method: input.method,
    url: input.url,
    host,
    contentType,
    contentLength,
    userAgent,
    authorization,
    headersCount: Object.keys(input.headers).length,
    queryParamsCount: input.queryParamsCount,
    body: input.body || "",
  };
}

export function extractHost(url: string) {
  if (!url) {
    return "Not set";
  }

  try {
    return new URL(url).host;
  } catch {
    return "Invalid URL";
  }
}
