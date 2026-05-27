import type { WorkspaceProtocol } from "../types";
import { DEFAULT_PROTOCOL } from "./constants";
import type { ProtocolDefinition } from "./types";
import { RequestEditor } from "../components/request-editor/request-editor";
import { ResponsePanel } from "../components/response-panel";
import { HttpRequestToolbar } from "../components/request-toolbar/http-request-toolbar";
import { HttpTabBadge } from "./http/http-tab-badge";
import { SseRequestToolbar } from "./sse/sse-request-toolbar";
import { SseRequestEditor } from "./sse/sse-request-editor";
import { SseResponsePanel } from "./sse/sse-response-panel";
import { SseTabBadge } from "./sse/sse-tab-badge";
import { DEFAULT_SSE_CONFIG, DEFAULT_SSE_STREAM } from "../types";

const HTTP_PROTOCOL: ProtocolDefinition = {
  meta: {
    id: "http",
    label: "HTTP",
    shortLabel: "HTTP",
    description: "Send REST-style HTTP requests",
    availability: "available",
  },
  createTabDefaults: () => ({
    method: "GET" as const,
    title: "New Request",
  }),
  Toolbar: HttpRequestToolbar,
  Editor: RequestEditor,
  ResponsePanel: ResponsePanel,
  TabBadge: HttpTabBadge,
};

const SSE_PROTOCOL: ProtocolDefinition = {
  meta: {
    id: "sse",
    label: "Server-Sent Events",
    shortLabel: "SSE",
    description: "Subscribe to a text/event-stream endpoint",
    availability: "available",
  },
  createTabDefaults: () => ({
    method: "GET" as const,
    title: "New SSE",
    sseConfig: { ...DEFAULT_SSE_CONFIG },
    sseStream: { ...DEFAULT_SSE_STREAM },
  }),
  Toolbar: SseRequestToolbar,
  Editor: SseRequestEditor,
  ResponsePanel: SseResponsePanel,
  TabBadge: SseTabBadge,
};

const PROTOCOL_REGISTRY: Record<WorkspaceProtocol, ProtocolDefinition | undefined> = {
  http: HTTP_PROTOCOL,
  sse: SSE_PROTOCOL,
  websocket: undefined,
  grpc: undefined,
};

export function getProtocolDefinition(
  protocol: WorkspaceProtocol = DEFAULT_PROTOCOL,
): ProtocolDefinition {
  return PROTOCOL_REGISTRY[protocol] ?? HTTP_PROTOCOL;
}

export function getAvailableProtocols(): ProtocolDefinition[] {
  return [HTTP_PROTOCOL, SSE_PROTOCOL];
}
