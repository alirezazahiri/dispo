/**
 * Content types accepted by the textual body editor.
 *
 * These are the only mime types whose payload can be authored as plain text
 * inside Monaco (the request body editor's "text" general mode).
 */
export type TextBodyContentType =
  | "text/plain; charset=utf-8"
  | "application/json"
  | "text/yaml; charset=utf-8"
  | "application/xml; charset=utf-8";

/**
 * Content types accepted by the form body editor.
 *
 * `application/x-www-form-urlencoded` is the default. `multipart/form-data`
 * is opt-in and unlocks per-field file uploads.
 *
 * Note: when actually sending a multipart request, the HTTP client is
 * responsible for appending the `; boundary=...` directive to the header
 * value at transport time. The UI only stores the canonical mime type.
 */
export type FormBodyContentType =
  | "application/x-www-form-urlencoded"
  | "multipart/form-data";

/**
 * Content type used when the body is a raw binary payload.
 */
export type FileBodyContentType = "application/octet-stream";

/**
 * Union of every content type any body editor may produce.
 */
export type BodyContentType =
  | TextBodyContentType
  | FormBodyContentType
  | FileBodyContentType;
