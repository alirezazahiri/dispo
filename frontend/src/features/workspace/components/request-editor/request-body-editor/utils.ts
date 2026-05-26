import { nanoid } from "nanoid";
import { CONTENT_TYPE_HEADER_KEY } from "@/constants";
import type {
  FormBodyField,
  KeyValuePair,
  RequestBodyMode,
  RequestTab,
} from "../../../types";

/**
 * Resolves the `Content-Type` header value implied by the tab's current
 * body configuration.
 *
 * Returns `null` when the body mode has no canonical content type (e.g.
 * `none` — let the user keep whatever Content-Type they had set
 * manually, or let it be omitted entirely).
 */
export function resolveBodyContentType(
  tab: Pick<
    RequestTab,
    "bodyMode" | "bodyContentType" | "formSubtype" | "fileContentType"
  >,
): string | null {
  switch (tab.bodyMode) {
    case "text":
      return tab.bodyContentType;
    case "form":
      return tab.formSubtype;
    case "file":
      return tab.fileContentType || "application/octet-stream";
    case "graphql":
      return "application/json";
    case "none":
    default:
      return null;
  }
}

/**
 * Returns a new headers list with the `Content-Type` row synchronised to
 * the given value. When `value` is `null` the header is removed.
 *
 * The match is case-insensitive so the user's preferred casing (e.g.
 * `content-type`) is preserved when we just need to overwrite the value.
 */
export function syncContentTypeHeader(
  headers: KeyValuePair[],
  value: string | null,
): KeyValuePair[] {
  const existingIndex = headers.findIndex(
    (header) => header.key.toLowerCase() === CONTENT_TYPE_HEADER_KEY.toLowerCase(),
  );

  if (value === null) {
    if (existingIndex === -1) {
      return headers;
    }
    return headers.filter((_, index) => index !== existingIndex);
  }

  if (existingIndex === -1) {
    return [
      ...headers,
      {
        id: nanoid(),
        key: CONTENT_TYPE_HEADER_KEY,
        value,
        enabled: true,
      },
    ];
  }

  const existing = headers[existingIndex];
  if (existing.value === value && existing.enabled) {
    return headers;
  }

  const next = headers.slice();
  next[existingIndex] = {
    ...existing,
    value,
    enabled: true,
  };
  return next;
}

/**
 * Convenience: bundle the body-related fields and a refreshed Content-Type
 * header into a single object you can spread into `updateTab`.
 *
 * Callers pass any body fields they want to change (e.g. `{ bodyMode: "form" }`);
 * the resulting object also carries a recomputed `headers` array so the
 * request stays self-consistent.
 */
export function buildBodyUpdate(
  tab: RequestTab,
  changes: Partial<
    Pick<
      RequestTab,
      | "bodyMode"
      | "bodyContentType"
      | "formSubtype"
      | "fileContentType"
      | "fileBody"
    >
  >,
): Partial<RequestTab> {
  const next: Pick<
    RequestTab,
    "bodyMode" | "bodyContentType" | "formSubtype" | "fileContentType"
  > = {
    bodyMode: changes.bodyMode ?? tab.bodyMode,
    bodyContentType: changes.bodyContentType ?? tab.bodyContentType,
    formSubtype: changes.formSubtype ?? tab.formSubtype,
    fileContentType: changes.fileContentType ?? tab.fileContentType,
  };

  return {
    ...changes,
    headers: syncContentTypeHeader(tab.headers, resolveBodyContentType(next)),
  };
}

/**
 * Modes that should be selectable in the UI in the order they appear.
 * Exposed as a helper so consumers don't reach into the descriptors
 * array when all they care about is the enum.
 */
export const SELECTABLE_BODY_MODES: RequestBodyMode[] = [
  "none",
  "form",
  "text",
  "file",
  "graphql",
];

function encodeUrlForm(fields: FormBodyField[]): string {
  return fields
    .filter((field) => field.enabled && field.kind === "text" && field.key.trim())
    .map(
      (field) =>
        `${encodeURIComponent(field.key)}=${encodeURIComponent(field.value)}`,
    )
    .join("&");
}

/**
 * Computes the string body that should be handed to the HTTP transport
 * for the tab's current body mode.
 *
 * The returned value is always a string because the existing backend
 * bridge accepts `body: string`. The modes whose payload cannot be
 * represented as plain text (multipart, raw file, graphql once wired)
 * intentionally return an empty string — the transport layer is
 * expected to inspect `tab.bodyMode` and reach into the structured
 * fields when it grows native support for those payloads.
 */
export function buildRequestBody(tab: RequestTab): string {
  switch (tab.bodyMode) {
    case "text":
      return tab.body;
    case "form":
      if (tab.formSubtype === "application/x-www-form-urlencoded") {
        return encodeUrlForm(tab.formFields);
      }
      return "";
    case "file":
    case "graphql":
    case "none":
    default:
      return "";
  }
}
