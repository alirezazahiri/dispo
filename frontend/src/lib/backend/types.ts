import type {
  FileBodyData,
  FormBodyField,
  RequestBodyMode,
  WorkspaceState,
} from "@/features/workspace/types";
import type { ResponseCookie } from "@/features/workspace/types/response";
import type { CollectionTree, Collection, Folder, SavedRequest } from "@/features/collections/types";

export type GraphQLBodyPayload = {
  query: string;
  variables: string;
};

export type HttpRequestPayload = {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;

  /**
   * General body mode. When omitted, the backend treats the request as a
   * legacy text body driven entirely by `body` (back-compat path).
   */
  bodyMode?: RequestBodyMode;

  /**
   * Pre-encoded textual body. Carries the editor contents for text mode
   * and the URL-encoded payload for `form` + url-encoded subtype.
   */
  body?: string;

  /**
   * `form` mode discriminator: url-encoded vs multipart.
   */
  formSubtype?: "application/x-www-form-urlencoded" | "multipart/form-data";

  /**
   * Structured form rows. Only consumed by the backend when bodyMode is
   * `form` and formSubtype is `multipart/form-data`.
   */
  formFields?: FormBodyField[];

  /**
   * File reference for `file` body mode. `path` must be an absolute path
   * on the user's machine — populated via the native open-file dialog.
   */
  file?: FileBodyData | null;

  /**
   * Optional override for the Content-Type header when sending a `file`
   * body. Defaults to `application/octet-stream` server-side.
   */
  fileContentType?: string;

  /**
   * GraphQL payload — populated when bodyMode is `graphql`. The backend
   * assembles the canonical `{ query, variables }` JSON envelope.
   */
  graphql?: GraphQLBodyPayload | null;
};

export type FileDialogFilter = {
  displayName: string;
  pattern: string;
};

export type PickFileOptions = {
  title?: string;
  defaultDirectory?: string;
  defaultFilename?: string;
  filters?: FileDialogFilter[];
};

export type PickFileResult = {
  path: string;
  name: string;
  size: number;
  contentType: string;
  cancelled: boolean;
};

export type HttpResponsePayload = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  cookies: ResponseCookie[];
  body: string;
  duration: number;
  error?: string;
};

export type SseConnectPayload = {
  connectionId: string;
  tabId: string;
  url: string;
  headers: Record<string, string>;
  lastEventId?: string;
  withCredentials: boolean;
};

export type SseConnectResult = {
  connectionId: string;
  error?: string;
};

export type SseHeaderPayload = {
  key: string;
  value: string;
};

export type SseOpenEventPayload = {
  connectionId: string;
  tabId: string;
  statusCode: number;
  statusText: string;
  headers: SseHeaderPayload[];
  error?: string;
};

export type SseStreamEventPayload = {
  connectionId: string;
  tabId: string;
  eventId?: string;
  eventType?: string;
  data: string;
  retry?: number;
};

export type SseErrorEventPayload = {
  connectionId: string;
  tabId: string;
  error: string;
};

export type SseCloseEventPayload = {
  connectionId: string;
  tabId: string;
};

export type WsConnectPayload = {
  connectionId: string;
  tabId: string;
  url: string;
  headers: Record<string, string>;
  subprotocols?: string[];
  withCredentials: boolean;
};

export type WsConnectResult = {
  connectionId: string;
  error?: string;
};

export type WsSendPayload = {
  connectionId: string;
  messageType: "text" | "binary";
  data: string;
};

export type WsHeaderPayload = {
  key: string;
  value: string;
};

export type WsOpenEventPayload = {
  connectionId: string;
  tabId: string;
  statusCode: number;
  statusText: string;
  headers: WsHeaderPayload[];
  subprotocol?: string;
  error?: string;
};

export type WsMessageEventPayload = {
  connectionId: string;
  tabId: string;
  messageType: "text" | "binary";
  data: string;
  byteLength: number;
};

export type WsErrorEventPayload = {
  connectionId: string;
  tabId: string;
  error: string;
};

export type WsCloseEventPayload = {
  connectionId: string;
  tabId: string;
  closeCode?: number;
  closeReason?: string;
};

export type WorkspaceStatePayload = WorkspaceState;
export type CollectionTreePayload = CollectionTree;
export type CollectionPayload = Collection;
export type FolderPayload = Folder;
export type SavedRequestPayload = SavedRequest;

export type ScriptPhase = "pre" | "post";

export type ScriptContextPayload = {
  phase: ScriptPhase;
  source: string;
  timeoutMs?: number;
  request: ScriptRequestPayload;
  response?: ScriptResponsePayload;
  env: ScriptEnvPayload;
};

export type ScriptRequestPayload = {
  method: string;
  url: string;
  body: string;
  headers: Record<string, string>;
  params: Record<string, string>;
};

export type ScriptResponsePayload = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  cookies: ResponseCookie[];
  body: string;
  durationMs: number;
};

export type ScriptEnvPayload = {
  name: string;
  variables: Record<string, string>;
};

export type ScriptResultPayload = {
  logs: ScriptLogEntryPayload[];
  mutations: ScriptMutationsPayload;
  error?: string;
  durationMs: number;
};

export type ScriptLogEntryPayload = {
  level: "log" | "info" | "warn" | "error";
  message: string;
  timestamp: number;
  phase: ScriptPhase;
  scriptName?: string;
};

export type ScriptMutationsPayload = {
  request: ScriptRequestMutationsPayload;
  env: ScriptEnvMutationPayload[];
};

export type ScriptRequestMutationsPayload = {
  method?: string;
  url?: string;
  body?: string;
  headers: ScriptRequestKVMutationPayload[];
  params: ScriptRequestKVMutationPayload[];
};

export type ScriptRequestKVMutationPayload = {
  operation: "set" | "unset";
  key: string;
  value?: string;
};

export type ScriptEnvMutationPayload = {
  operation: "set" | "unset";
  key: string;
  value?: string;
};
