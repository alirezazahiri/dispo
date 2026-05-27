export type SseConnectionStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "error";

/**
 * Persisted SSE connection preferences for a workspace tab.
 */
export type SseConnectionConfig = {
  /**
   * Sent as the `Last-Event-ID` request header on connect/reconnect so the
   * server can resume the stream after the last seen event id.
   */
  lastEventId: string;

  /**
   * When set, only events whose `event:` field matches are shown in the
   * stream log. Empty string means accept all event types.
   */
  eventTypeFilter: string;

  /**
   * Include cookies on the cross-origin request (`credentials: 'include'`).
   */
  withCredentials: boolean;

  /**
   * When the connection drops unexpectedly, attempt to reconnect using the
   * latest received event id as `Last-Event-ID`.
   */
  autoReconnect: boolean;

  /**
   * Maximum number of events kept in the in-tab stream buffer. Oldest events
   * are dropped once the cap is reached.
   */
  maxBufferedEvents: number;
};

export type SseEventRecord = {
  id: string;
  receivedAt: number;
  eventId?: string;
  eventType?: string;
  data: string;
  retry?: number;
};

/**
 * Runtime SSE stream state for the active (or last) connection attempt.
 */
export type SseStreamState = {
  status: SseConnectionStatus;
  connectedAt?: number;
  closedAt?: number;
  statusCode?: number;
  statusText?: string;
  responseHeaders: Array<{ key: string; value: string }>;
  events: SseEventRecord[];
  error?: string;
  /**
   * Count of events accepted after applying `eventTypeFilter`.
   */
  eventCount: number;
  /**
   * Approximate bytes received in event `data` fields.
   */
  bytesReceived: number;
};

export const DEFAULT_SSE_CONFIG: SseConnectionConfig = {
  lastEventId: "",
  eventTypeFilter: "",
  withCredentials: false,
  autoReconnect: true,
  maxBufferedEvents: 500,
};

export const DEFAULT_SSE_STREAM: SseStreamState = {
  status: "idle",
  responseHeaders: [],
  events: [],
  eventCount: 0,
  bytesReceived: 0,
};
