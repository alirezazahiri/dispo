import type {
  FileBodyContentType,
  FormBodyContentType,
  TextBodyContentType,
} from "@/types";
import type { ResponseData } from "./response";

export type WorkspaceProtocol = "http" | "websocket" | "sse" | "grpc";

export type WorkspaceLayout = "vertical" | "horizontal";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

export type KeyValuePair = {
  id: string;

  key: string;

  value: string;

  /**
   * Whether the key-value pair is enabled.
   * If disabled, the key-value pair will not be sent in the request.
   */
  enabled: boolean;
};

export type RequestAuthType = "none" | "bearer";

export type RequestAuth = {
  type: RequestAuthType;
  bearerToken: string;
};

export type Environment = {
  id: string;
  name: string;
  variables: KeyValuePair[];
};

/**
 * The high-level "shape" of a request body.
 *
 * - `none`    — no body is sent.
 * - `text`    — a textual payload (JSON, XML, YAML, plain text, …).
 * - `form`    — key/value form data, either url-encoded or multipart.
 * - `file`    — a single raw binary payload (`application/octet-stream`).
 * - `graphql` — reserved for the upcoming GraphQL editor.
 *
 * New modes can be appended to this union without changing the public
 * surface of existing editors; the dispatcher in `request-body-editor`
 * will simply render the matching component.
 */
export type RequestBodyMode = "none" | "text" | "form" | "file" | "graphql";

/**
 * Whether a `FormBodyField` carries a text value or a binary file.
 *
 * Only valid for the `multipart/form-data` subtype. URL-encoded form
 * bodies always behave as if every row were `"text"`.
 */
export type FormBodyFieldKind = "text" | "file";

/**
 * A single row in the form body editor.
 *
 * For text rows, `value` carries the field's textual value. For file
 * rows, `filePath` points at the source file on disk that the backend
 * will read at send time, while `fileName` / `fileContentType` /
 * `fileSize` mirror the metadata returned by the native file picker.
 */
export type FormBodyField = {
  id: string;

  enabled: boolean;

  kind: FormBodyFieldKind;

  key: string;

  value: string;

  fileName?: string;

  /**
   * Absolute path on the user's machine. Empty when the file was picked
   * through the browser `<input type="file">` fallback, in which case
   * the backend cannot read it and the multipart transport will reject
   * the send with a "missing file path" error.
   */
  filePath?: string;

  fileContentType?: string;

  fileSize?: number;
};

/**
 * Metadata about the single file selected for `file` body mode.
 *
 * The actual bytes are not stored in workspace state — only the
 * information required to surface the selection in the UI and to
 * eventually hand the file off to the transport layer.
 */
export type FileBodyData = {
  name: string;
  contentType: string;
  size: number;
  /**
   * Best-effort local reference to the file. In a Wails desktop build
   * this would be an absolute path; in the browser fallback it is left
   * empty and the user has to re-select the file each session.
   */
  path: string;
};

export type RequestTab = {
  id: string;

  collectionId: string;

  savedRequestId: string | null;

  layout: WorkspaceLayout;

  protocol: WorkspaceProtocol;

  title?: string;

  method: HttpMethod;

  url: string;

  /**
   * The general body mode currently selected for this tab.
   *
   * Each mode reads/writes its own dedicated slice of state below so the
   * user can flip back and forth between modes without losing drafts.
   */
  bodyMode: RequestBodyMode;

  /**
   * Text-mode payload (Monaco editor contents).
   */
  body: string;

  /**
   * Text-mode mime type. Restricted to types the Monaco editor knows how
   * to syntax highlight.
   */
  bodyContentType: TextBodyContentType;

  /**
   * Form-mode subtype: url-encoded (default) or multipart.
   */
  formSubtype: FormBodyContentType;

  /**
   * Form-mode rows.
   */
  formFields: FormBodyField[];

  /**
   * File-mode content type. Defaults to `application/octet-stream` but
   * can be overridden by the user (e.g. `image/png`).
   */
  fileContentType: FileBodyContentType | string;

  /**
   * File-mode selection metadata.
   */
  fileBody: FileBodyData | null;

  /**
   * GraphQL-mode draft. Not wired into transport yet — reserved so the
   * field survives workspace persistence once the editor lands.
   */
  graphqlQuery: string;

  graphqlVariables: string;

  preRequestScript: string;

  postResponseScript: string;

  headers: KeyValuePair[];

  queryParams: KeyValuePair[];

  /**
   * Path parameters extracted from `:name` placeholders in the request URL
   * (REST-style, e.g. `/users/:userId/posts/:postId`).
   *
   * Rows are auto-created when the user types a new `:name` segment in the
   * URL and preserved across edits so values survive when the user briefly
   * deletes a token. A row whose `key` is no longer referenced from the URL
   * is "orphaned" and silently ignored at send time, but remains visible in
   * the editor so the user can re-introduce the token without losing the
   * value they had typed.
   */
  pathParams: KeyValuePair[];

  auth: RequestAuth;

  response?: ResponseData;

  isSending: boolean;

  isDirty: boolean;

  createdAt: number;

  updatedAt: number;
};

export type WorkspaceState = {
  tabs: RequestTab[];
  tabOrderByCollection: Record<string, string[]>;
  activeTabIdByCollection: Record<string, string>;
  currentCollectionId: string;
  environments: Environment[];
  activeEnvironmentId: string;
};
