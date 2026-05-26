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

/**
 * Matches `:name` placeholders that follow a path separator (start of
 * string or `/`). The lookbehind keeps `:port` (e.g. `localhost:3000`)
 * out of the result set: a port is preceded by a host character, not
 * a slash.
 *
 * The first captured character must be a letter or underscore so plain
 * port numbers (`:8080`) never match even at the start of a string.
 */
export const PATH_PARAM_REGEX = /(?<=^|\/):([A-Za-z_][A-Za-z0-9_]*)/g;

/**
 * Returns the unique `:name` placeholder names present in `url`,
 * preserving the order in which they appear.
 */
export function extractPathParamNames(url: string): string[] {
  if (!url) {
    return [];
  }
  const seen = new Set<string>();
  const names: string[] = [];
  const regex = new RegExp(PATH_PARAM_REGEX);
  let match = regex.exec(url);
  while (match) {
    const name = match[1];
    if (name && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
    match = regex.exec(url);
  }
  return names;
}

/**
 * Reconciles a list of path-param rows against the placeholders found in
 * `nextUrl`, using `prevUrl` to figure out which placeholders just left.
 *
 * Rows are merged using the row `key` as the natural identity:
 *
 * - New placeholders that aren't already represented by a row create new
 *   empty rows appended to the end.
 * - Rows whose key was in the previous URL but is no longer in the new
 *   URL are removed **only if their value is still empty**. This prevents
 *   stale rows from accumulating while the user types `:u` → `:us` →
 *   `:userId`, while still preserving any value the user has filled in
 *   (so a brief delete/retype of the placeholder doesn't lose their work).
 * - Rows with an empty key (user is mid-typing) and rows the user added
 *   manually that have never been referenced from a URL are always kept.
 *
 * Returns the same reference when nothing changed so React can skip
 * re-renders.
 */
export function reconcilePathParamRows(
  nextUrl: string,
  prevUrl: string,
  rows: KeyValuePair[],
  newId: () => string,
): KeyValuePair[] {
  const nextNames = extractPathParamNames(nextUrl);
  const nextNamesSet = new Set(nextNames);
  const prevNames = new Set(extractPathParamNames(prevUrl));

  const droppedNames = new Set<string>();
  for (const name of prevNames) {
    if (!nextNamesSet.has(name)) {
      droppedNames.add(name);
    }
  }

  let mutated = false;
  const trimmedRows = rows.filter((row) => {
    const key = row.key.trim();
    if (!key) {
      // user is mid-typing — never drop
      return true;
    }
    if (droppedNames.has(key) && row.value === "") {
      mutated = true;
      return false;
    }
    return true;
  });

  const existingKeys = new Set(
    trimmedRows.map((row) => row.key.trim()).filter(Boolean),
  );

  const additions: KeyValuePair[] = [];
  for (const name of nextNames) {
    if (!existingKeys.has(name)) {
      additions.push({
        id: newId(),
        key: name,
        value: "",
        enabled: true,
      });
    }
  }

  if (!mutated && additions.length === 0) {
    return rows;
  }

  return [...trimmedRows, ...additions];
}

/**
 * Replaces every `:name` placeholder in `url` with the matching value
 * from `pathParams`. Names are URL-encoded so spaces and special
 * characters round-trip safely.
 *
 * Disabled rows and rows with empty keys are ignored. When a placeholder
 * has no matching row (or the row is disabled / blank), the placeholder
 * is left untouched so the user can see the unresolved token in the
 * outgoing request snapshot.
 */
export function substitutePathParams(
  url: string,
  pathParams: Array<{ key: string; value: string; enabled: boolean }>,
  unresolved?: Set<string>,
): string {
  if (!url) {
    return url;
  }

  const lookup = new Map<string, string>();
  for (const row of pathParams) {
    if (!row.enabled) {
      continue;
    }
    const key = row.key.trim();
    if (!key) {
      continue;
    }
    lookup.set(key, row.value);
  }

  return url.replace(PATH_PARAM_REGEX, (match, name: string) => {
    const value = lookup.get(name);
    if (value === undefined || value === "") {
      unresolved?.add(`:${name}`);
      return match;
    }
    return encodeURIComponent(value);
  });
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
  const userAgent = normalizedHeaders["user-agent"] || "Dispo/1.0";
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
