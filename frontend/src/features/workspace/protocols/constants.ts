import type { WorkspaceProtocol } from "../types";
import type { ProtocolMeta } from "./types";

export const PROTOCOL_META: ProtocolMeta[] = [
  {
    id: "http",
    label: "HTTP",
    shortLabel: "HTTP",
    description: "Send REST-style HTTP requests",
    availability: "available",
  },
  {
    id: "sse",
    label: "Server-Sent Events",
    shortLabel: "SSE",
    description: "Subscribe to a text/event-stream endpoint",
    availability: "available",
  },
  {
    id: "websocket",
    label: "WebSocket",
    shortLabel: "WS",
    description: "Bidirectional WebSocket messaging",
    availability: "coming_soon",
  },
  {
    id: "grpc",
    label: "gRPC",
    shortLabel: "gRPC",
    description: "Unary and streaming gRPC calls",
    availability: "coming_soon",
  },
];

export const DEFAULT_PROTOCOL: WorkspaceProtocol = "http";

export function getProtocolMeta(protocol: WorkspaceProtocol): ProtocolMeta {
  return (
    PROTOCOL_META.find((entry) => entry.id === protocol) ??
    PROTOCOL_META[0]
  );
}
