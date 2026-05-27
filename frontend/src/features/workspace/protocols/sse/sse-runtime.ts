import { nanoid } from "nanoid";
import { EventsOff, EventsOn } from "~/wailsjs/runtime/runtime";
import { backendClient } from "@/lib/backend/client";
import type { SseStreamEventPayload } from "@/lib/backend/types";
import { useWorkspaceStore } from "../../stores/workspace.store";
import type { RequestTab, SseEventRecord, SseStreamState } from "../../types";
import { DEFAULT_SSE_STREAM } from "../../types";
import { matchesEventTypeFilter, parseSseEventData } from "./sse-message";

export type SseConnectInput = {
  url: string;
  headers: Record<string, string>;
};

const SSE_EVENTS = {
  open: "sse:open",
  event: "sse:event",
  error: "sse:error",
  close: "sse:close",
} as const;

type RuntimePayload = Record<string, unknown>;

type TabRuntime = {
  connectInput: SseConnectInput | null;
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

function updateStream(tabId: string, sseStream: SseStreamState) {
  const tab = getTab(tabId);
  if (!tab) {
    return;
  }
  useWorkspaceStore.getState().updateTab(tabId, { sseStream });
}

function getLastEventId(tab: RequestTab) {
  return (
    tab.sseStream.events.at(-1)?.eventId?.trim() ||
    tab.sseConfig.lastEventId.trim() ||
    ""
  );
}

function clearReconnectTimer(tabId: string) {
  const runtime = tabRuntimes.get(tabId);
  if (!runtime?.reconnectTimer) {
    return;
  }
  clearTimeout(runtime.reconnectTimer);
  runtime.reconnectTimer = null;
}

function appendEvent(
  tab: RequestTab,
  current: SseStreamState,
  payload: SseStreamEventPayload,
): SseStreamState {
  const sseEventType = payload.eventType || "message";
  const parsed = parseSseEventData(payload.data, sseEventType);

  if (
    !matchesEventTypeFilter(
      tab.sseConfig.eventTypeFilter,
      parsed.eventType,
      sseEventType,
    )
  ) {
    return current;
  }

  const record: SseEventRecord = {
    id: nanoid(),
    receivedAt: Date.now(),
    eventId: payload.eventId,
    eventType: parsed.eventType,
    data: parsed.data,
    retry: payload.retry,
  };

  const nextEvents = [...current.events, record];
  const max = Math.max(1, tab.sseConfig.maxBufferedEvents);
  const trimmed =
    nextEvents.length > max ? nextEvents.slice(nextEvents.length - max) : nextEvents;

  return {
    ...current,
    events: trimmed,
    eventCount: current.eventCount + 1,
    bytesReceived: current.bytesReceived + parsed.rawBytes,
  };
}

function scheduleReconnect(tabId: string, retryMs?: number) {
  const runtime = getTabRuntime(tabId);
  const tab = getTab(tabId);
  const input = runtime.connectInput;

  if (!tab || !input || runtime.intentionalDisconnect || !tab.sseConfig.autoReconnect) {
    return;
  }

  const delay = Math.min(Math.max(retryMs ?? 3000, 1000), 30000);
  clearReconnectTimer(tabId);
  runtime.reconnectTimer = setTimeout(() => {
    if (!getTab(tabId)) {
      return;
    }
    void connectSse(tabId, input);
  }, delay);
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

  updateStream(tabId, {
    ...tab.sseStream,
    status: error ? "error" : statusCode >= 200 && statusCode < 300 ? "open" : "error",
    connectedAt: Date.now(),
    statusCode,
    statusText,
    responseHeaders: headers,
    error: error || undefined,
  });
}

function handleEvent(rawPayload: unknown) {
  const payload = normalizeRuntimePayload(rawPayload);
  if (!payload) {
    return;
  }

  const tabId = readString(payload, "tabId", "TabID");
  const tab = tabId ? getTab(tabId) : undefined;
  if (!tab) {
    return;
  }

  const eventPayload: SseStreamEventPayload = {
    connectionId: readString(payload, "connectionId", "ConnectionID"),
    tabId,
    eventId: readOptionalString(payload, "eventId", "EventID"),
    eventType: readOptionalString(payload, "eventType", "EventType"),
    data: readString(payload, "data", "Data"),
    retry: readOptionalNumber(payload, "retry", "Retry"),
  };

  updateStream(tabId, appendEvent(tab, tab.sseStream, eventPayload));
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
    ...tab.sseStream,
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

  if (runtime.intentionalDisconnect) {
    updateStream(tabId, {
      ...tab.sseStream,
      status: "closed",
      closedAt: Date.now(),
    });
    runtime.intentionalDisconnect = false;
    return;
  }

  const previousStatus = tab.sseStream.status;
  updateStream(tabId, {
    ...tab.sseStream,
    status: "closed",
    closedAt: Date.now(),
  });

  if (previousStatus === "open") {
    scheduleReconnect(tabId);
    return;
  }

  if (previousStatus === "error") {
    scheduleReconnect(tabId, tab.sseStream.events.at(-1)?.retry);
  }
}

export function ensureSseRuntimeStarted() {
  if (started) {
    return;
  }
  started = true;

  const cleanups = [
    EventsOn(SSE_EVENTS.open, handleOpen),
    EventsOn(SSE_EVENTS.event, handleEvent),
    EventsOn(SSE_EVENTS.error, handleError),
    EventsOn(SSE_EVENTS.close, handleClose),
  ];

  stopListeners = () => {
    cleanups.forEach((cleanup) => cleanup());
    EventsOff(SSE_EVENTS.open, SSE_EVENTS.event, SSE_EVENTS.error, SSE_EVENTS.close);
    started = false;
    stopListeners = null;
  };
}

export async function connectSse(tabId: string, input: SseConnectInput) {
  ensureSseRuntimeStarted();

  const tab = getTab(tabId);
  if (!tab) {
    return;
  }

  const runtime = getTabRuntime(tabId);
  runtime.intentionalDisconnect = false;
  clearReconnectTimer(tabId);
  runtime.connectInput = input;

  const preserveEvents =
    tab.sseStream.status === "open" || tab.sseStream.status === "connecting";

  updateStream(tabId, {
    ...DEFAULT_SSE_STREAM,
    status: "connecting",
    events: preserveEvents ? tab.sseStream.events : [],
    eventCount: preserveEvents ? tab.sseStream.eventCount : 0,
    bytesReceived: preserveEvents ? tab.sseStream.bytesReceived : 0,
  });

  const lastEventId = getLastEventId(tab);
  const result = await backendClient.sse.connect({
    connectionId: tabId,
    tabId,
    url: input.url,
    headers: input.headers,
    lastEventId: lastEventId || undefined,
    withCredentials: tab.sseConfig.withCredentials,
  });

  if (result.error) {
    const latest = getTab(tabId);
    if (!latest) {
      return;
    }
    updateStream(tabId, {
      ...latest.sseStream,
      status: "error",
      error: result.error,
      closedAt: Date.now(),
    });
  }
}

export function disconnectSse(tabId: string) {
  const runtime = getTabRuntime(tabId);
  runtime.intentionalDisconnect = true;
  clearReconnectTimer(tabId);
  void backendClient.sse.disconnect(tabId);
}

export function clearSseStream(tabId: string) {
  disconnectSse(tabId);
  const tab = getTab(tabId);
  if (!tab) {
    tabRuntimes.delete(tabId);
    return;
  }
  updateStream(tabId, { ...DEFAULT_SSE_STREAM });
}

export function disposeSseTab(tabId: string) {
  disconnectSse(tabId);
  tabRuntimes.delete(tabId);
}

export function isSseTabConnected(tabId: string) {
  const tab = getTab(tabId);
  if (!tab) {
    return false;
  }
  return tab.sseStream.status === "connecting" || tab.sseStream.status === "open";
}
