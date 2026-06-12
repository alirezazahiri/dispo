import { nanoid } from "nanoid";
import { EventsOff, EventsOn } from "~/wailsjs/runtime/runtime";
import { backendClient } from "@/lib/backend/client";
import { useWorkspaceStore } from "../../stores/workspace.store";
import type {
  RequestTab,
  WsMessageRecord,
  WsMessageType,
  WsStreamState,
} from "../../types";
import { DEFAULT_WS_STREAM } from "../../types";
import { parseWsTextData } from "./ws-message";

export type WsConnectInput = {
  url: string;
  headers: Record<string, string>;
  subprotocols: string[];
};

export type WsSendInput = {
  messageType: WsMessageType;
  data: string;
};

const WS_EVENTS = {
  open: "ws:open",
  message: "ws:message",
  error: "ws:error",
  close: "ws:close",
} as const;

type RuntimePayload = Record<string, unknown>;

type TabRuntime = {
  connectInput: WsConnectInput | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  intentionalDisconnect: boolean;
};

const tabRuntimes = new Map<string, TabRuntime>();
let started = false;
let stopListeners: (() => void) | null = null;

function normalizeRuntimePayload(raw: unknown): RuntimePayload | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as RuntimePayload;
}

function readString(payload: RuntimePayload, camelKey: string, pascalKey: string) {
  const value = payload[camelKey] ?? payload[pascalKey];
  return typeof value === "string" ? value : "";
}

function readOptionalString(
  payload: RuntimePayload,
  camelKey: string,
  pascalKey: string,
) {
  const value = payload[camelKey] ?? payload[pascalKey];
  return typeof value === "string" ? value : undefined;
}

function readOptionalNumber(
  payload: RuntimePayload,
  camelKey: string,
  pascalKey: string,
) {
  const value = payload[camelKey] ?? payload[pascalKey];
  return typeof value === "number" ? value : undefined;
}

function readHeaders(payload: RuntimePayload) {
  const rawHeaders = payload.headers ?? payload.Headers;
  if (!Array.isArray(rawHeaders)) {
    return [] as Array<{ key: string; value: string }>;
  }
  return rawHeaders
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const key = record.key ?? record.Key;
      const value = record.value ?? record.Value;
      if (typeof key !== "string" || typeof value !== "string") {
        return null;
      }
      return { key, value };
    })
    .filter((entry): entry is { key: string; value: string } => entry !== null);
}

function getTabRuntime(tabId: string): TabRuntime {
  let runtime = tabRuntimes.get(tabId);
  if (!runtime) {
    runtime = {
      connectInput: null,
      reconnectTimer: null,
      intentionalDisconnect: false,
    };
    tabRuntimes.set(tabId, runtime);
  }
  return runtime;
}

function getTab(tabId: string): RequestTab | undefined {
  return useWorkspaceStore.getState().tabsById[tabId];
}

function updateStream(tabId: string, wsStream: WsStreamState) {
  const tab = getTab(tabId);
  if (!tab) {
    return;
  }
  useWorkspaceStore.getState().updateTab(tabId, { wsStream });
}

function clearReconnectTimer(tabId: string) {
  const runtime = tabRuntimes.get(tabId);
  if (!runtime?.reconnectTimer) {
    return;
  }
  clearTimeout(runtime.reconnectTimer);
  runtime.reconnectTimer = null;
}

function appendMessage(
  tab: RequestTab,
  current: WsStreamState,
  record: Omit<WsMessageRecord, "id" | "receivedAt">,
): WsStreamState {
  const message: WsMessageRecord = {
    id: nanoid(),
    receivedAt: Date.now(),
    ...record,
  };

  const nextMessages = [...current.messages, message];
  const max = Math.max(1, tab.wsConfig.maxBufferedMessages);
  const trimmed =
    nextMessages.length > max
      ? nextMessages.slice(nextMessages.length - max)
      : nextMessages;

  const byteDelta = record.direction === "received" ? record.byteLength : 0;

  return {
    ...current,
    messages: trimmed,
    messageCount: current.messageCount + 1,
    bytesReceived: current.bytesReceived + byteDelta,
  };
}

function scheduleReconnect(tabId: string) {
  const runtime = getTabRuntime(tabId);
  const tab = getTab(tabId);
  const input = runtime.connectInput;

  if (!tab || !input || runtime.intentionalDisconnect || !tab.wsConfig.autoReconnect) {
    return;
  }

  clearReconnectTimer(tabId);
  runtime.reconnectTimer = setTimeout(() => {
    if (!getTab(tabId)) {
      return;
    }
    void connectWs(tabId, input);
  }, 3000);
}

function handleOpen(rawPayload: unknown) {
  const payload = normalizeRuntimePayload(rawPayload);
  if (!payload) {
    return;
  }

  const tabId = readString(payload, "tabId", "TabID");
  const tab = tabId ? getTab(tabId) : undefined;
  if (!tab) {
    return;
  }

  const statusCode = readOptionalNumber(payload, "statusCode", "StatusCode") ?? 0;
  const statusText = readString(payload, "statusText", "StatusText");
  const error = readOptionalString(payload, "error", "Error");
  const headers = readHeaders(payload);
  const subprotocol = readOptionalString(payload, "subprotocol", "Subprotocol");

  updateStream(tabId, {
    ...tab.wsStream,
    status: error ? "error" : statusCode === 101 ? "open" : "error",
    connectedAt: Date.now(),
    responseHeaders: headers,
    subprotocol,
    error: error || (statusCode !== 101 ? `HTTP ${statusCode} ${statusText}` : undefined),
  });
}

function handleMessage(rawPayload: unknown) {
  const payload = normalizeRuntimePayload(rawPayload);
  if (!payload) {
    return;
  }

  const tabId = readString(payload, "tabId", "TabID");
  const tab = tabId ? getTab(tabId) : undefined;
  if (!tab) {
    return;
  }

  const messageTypeRaw = readString(payload, "messageType", "MessageType");
  const messageType: WsMessageType =
    messageTypeRaw === "binary" ? "binary" : "text";
  const rawData = readString(payload, "data", "Data");
  const byteLength =
    readOptionalNumber(payload, "byteLength", "ByteLength") ??
    new TextEncoder().encode(rawData).length;

  const data =
    messageType === "text" ? parseWsTextData(rawData) : rawData;

  updateStream(
    tabId,
    appendMessage(tab, tab.wsStream, {
      direction: "received",
      messageType,
      data,
      byteLength,
    }),
  );
}

function handleError(rawPayload: unknown) {
  const payload = normalizeRuntimePayload(rawPayload);
  if (!payload) {
    return;
  }

  const tabId = readString(payload, "tabId", "TabID");
  const tab = tabId ? getTab(tabId) : undefined;
  if (!tab) {
    return;
  }

  const error = readString(payload, "error", "Error");
  updateStream(tabId, {
    ...tab.wsStream,
    status: "error",
    error,
    closedAt: Date.now(),
  });
}

function handleClose(rawPayload: unknown) {
  const payload = normalizeRuntimePayload(rawPayload);
  if (!payload) {
    return;
  }

  const tabId = readString(payload, "tabId", "TabID");
  const tab = tabId ? getTab(tabId) : undefined;
  if (!tab) {
    tabRuntimes.delete(tabId);
    return;
  }

  const runtime = getTabRuntime(tabId);
  const closeCode = readOptionalNumber(payload, "closeCode", "CloseCode");
  const closeReason = readOptionalString(payload, "closeReason", "CloseReason");

  if (runtime.intentionalDisconnect) {
    updateStream(tabId, {
      ...tab.wsStream,
      status: "closed",
      closedAt: Date.now(),
      closeCode,
      closeReason,
    });
    runtime.intentionalDisconnect = false;
    return;
  }

  const previousStatus = tab.wsStream.status;
  updateStream(tabId, {
    ...tab.wsStream,
    status: "closed",
    closedAt: Date.now(),
    closeCode,
    closeReason,
  });

  if (previousStatus === "open" || previousStatus === "error") {
    scheduleReconnect(tabId);
  }
}

export function ensureWsRuntimeStarted() {
  if (started) {
    return;
  }
  started = true;

  const cleanups = [
    EventsOn(WS_EVENTS.open, handleOpen),
    EventsOn(WS_EVENTS.message, handleMessage),
    EventsOn(WS_EVENTS.error, handleError),
    EventsOn(WS_EVENTS.close, handleClose),
  ];

  stopListeners = () => {
    cleanups.forEach((cleanup) => cleanup());
    EventsOff(WS_EVENTS.open, WS_EVENTS.message, WS_EVENTS.error, WS_EVENTS.close);
    started = false;
    stopListeners = null;
  };
}

export async function connectWs(tabId: string, input: WsConnectInput) {
  ensureWsRuntimeStarted();

  const tab = getTab(tabId);
  if (!tab) {
    return;
  }

  const runtime = getTabRuntime(tabId);
  runtime.intentionalDisconnect = false;
  clearReconnectTimer(tabId);
  runtime.connectInput = input;

  const preserveMessages =
    tab.wsStream.status === "open" || tab.wsStream.status === "connecting";

  updateStream(tabId, {
    ...DEFAULT_WS_STREAM,
    status: "connecting",
    messages: preserveMessages ? tab.wsStream.messages : [],
    messageCount: preserveMessages ? tab.wsStream.messageCount : 0,
    bytesReceived: preserveMessages ? tab.wsStream.bytesReceived : 0,
  });

  const result = await backendClient.websocket.connect({
    connectionId: tabId,
    tabId,
    url: input.url,
    headers: input.headers,
    subprotocols: input.subprotocols,
    withCredentials: tab.wsConfig.withCredentials,
  });

  if (result.error) {
    const latest = getTab(tabId);
    if (!latest) {
      return;
    }
    updateStream(tabId, {
      ...latest.wsStream,
      status: "error",
      error: result.error,
      closedAt: Date.now(),
    });
  }
}

export function disconnectWs(tabId: string) {
  const runtime = getTabRuntime(tabId);
  runtime.intentionalDisconnect = true;
  clearReconnectTimer(tabId);
  void backendClient.websocket.disconnect(tabId);
}

export async function sendWsMessage(tabId: string, input: WsSendInput) {
  const tab = getTab(tabId);
  if (!tab || tab.wsStream.status !== "open") {
    throw new Error("WebSocket is not connected");
  }

  await backendClient.websocket.sendMessage({
    connectionId: tabId,
    messageType: input.messageType,
    data: input.data,
  });

  const data =
    input.messageType === "text"
      ? parseWsTextData(input.data)
      : input.data;
  const byteLength =
    input.messageType === "binary"
      ? atob(input.data).length
      : new TextEncoder().encode(input.data).length;

  updateStream(
    tabId,
    appendMessage(tab, tab.wsStream, {
      direction: "sent",
      messageType: input.messageType,
      data,
      byteLength,
    }),
  );
}

export function clearWsStream(tabId: string) {
  disconnectWs(tabId);
  const tab = getTab(tabId);
  if (!tab) {
    tabRuntimes.delete(tabId);
    return;
  }
  updateStream(tabId, { ...DEFAULT_WS_STREAM });
}

export function disposeWsTab(tabId: string) {
  disconnectWs(tabId);
  tabRuntimes.delete(tabId);
}

export function isWsTabConnected(tabId: string) {
  const tab = getTab(tabId);
  if (!tab) {
    return false;
  }
  return tab.wsStream.status === "connecting" || tab.wsStream.status === "open";
}
