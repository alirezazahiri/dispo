import type { KeyValuePair, RequestAuth, RequestTab } from "../types";
import { resolveEffectiveAuth } from "./resolve-effective-auth";
import {
  appendQueryParams,
  createVariableMap,
  resolveTemplate,
  substitutePathParams,
} from "../components/request-toolbar/utils";
import type { Collection } from "@/features/collections/types";

export type ResolvedRequestUrl = {
  url: string;
  headers: Record<string, string>;
  unresolvedVariables: Set<string>;
  unresolvedPathParams: Set<string>;
};

type ResolveRequestUrlInput = {
  tab: RequestTab;
  environmentVariables: KeyValuePair[];
  collectionAuth?: RequestAuth;
  scriptHeaders?: Record<string, string>;
  scriptParams?: Record<string, string>;
  scriptUrl?: string;
};

export function resolveRequestUrl({
  tab,
  environmentVariables,
  collectionAuth,
  scriptHeaders,
  scriptParams,
  scriptUrl,
}: ResolveRequestUrlInput): ResolvedRequestUrl {
  const variableMap = createVariableMap(environmentVariables);
  const unresolvedVariables = new Set<string>();
  const unresolvedPathParams = new Set<string>();

  const baseUrl = scriptUrl ?? tab.url;
  const urlWithEnv = resolveTemplate(baseUrl, variableMap, unresolvedVariables);
  const resolvedPathParamRows = (tab.pathParams ?? []).map((row) => ({
    key: row.key,
    value: resolveTemplate(row.value, variableMap, unresolvedVariables),
    enabled: row.enabled,
  }));
  const urlWithPath = substitutePathParams(
    urlWithEnv,
    resolvedPathParamRows,
    unresolvedPathParams,
  );

  const querySource = scriptParams ?? rowsToRecord(tab.queryParams);
  const resolvedQueryParams = Object.entries(querySource)
    .filter(([key]) => key.trim())
    .map(([key, value]) => ({
      key: resolveTemplate(key, variableMap, unresolvedVariables),
      value: resolveTemplate(value, variableMap, unresolvedVariables),
    }));

  const headerSource = scriptHeaders ?? rowsToRecord(tab.headers);
  const resolvedHeaders = Object.entries(headerSource).reduce<Record<string, string>>(
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

  const effectiveAuth = resolveEffectiveAuth(tab.auth, collectionAuth);
  if (effectiveAuth.type === "bearer" && effectiveAuth.bearerToken.trim()) {
    resolvedHeaders.Authorization = `Bearer ${resolveTemplate(
      effectiveAuth.bearerToken,
      variableMap,
      unresolvedVariables,
    )}`;
  }

  return {
    url: appendQueryParams(urlWithPath, resolvedQueryParams),
    headers: resolvedHeaders,
    unresolvedVariables,
    unresolvedPathParams,
  };
}

function rowsToRecord(rows: KeyValuePair[]) {
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
