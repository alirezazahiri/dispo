export type WsConnectionStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "error";

export type WsMessageType = "text" | "binary";

export type WsMessageDirection = "sent" | "received";

/**
 * Persisted WebSocket connection preferences for a workspace tab.
 */
export type WsConnectionConfig = {
  /**
   * Comma-separated list sent as the `Sec-WebSocket-Protocol` header.
   */
  subprotocols: string;

  /**
   * Include cookies on the cross-origin handshake.
   */
  withCredentials: boolean;

  /**
   * When the connection drops unexpectedly, attempt to reconnect.
   */
  autoReconnect: boolean;

  /**
   * Maximum number of messages kept in the in-tab message buffer. Oldest
   * messages are dropped once the cap is reached.
   */
  maxBufferedMessages: number;
};

export type WsMessageRecord = {
  id: string;
  direction: WsMessageDirection;
  messageType: WsMessageType;
  /**
   * Plain text for text frames, base64 for binary frames.
   */
  data: string;
  receivedAt: number;
  byteLength: number;
};

/**
 * Runtime WebSocket state for the active (or last) connection attempt.
 */
export type WsStreamState = {
  status: WsConnectionStatus;
  connectedAt?: number;
  closedAt?: number;
  closeCode?: number;
  closeReason?: string;
  subprotocol?: string;
  responseHeaders: Array<{ key: string; value: string }>;
  messages: WsMessageRecord[];
  messageCount: number;
  bytesReceived: number;
  error?: string;
};

export const DEFAULT_WS_CONFIG: WsConnectionConfig = {
  subprotocols: "",
  withCredentials: false,
  autoReconnect: true,
  maxBufferedMessages: 500,
};

export const DEFAULT_WS_STREAM: WsStreamState = {
  status: "idle",
  responseHeaders: [],
  messages: [],
  messageCount: 0,
  bytesReceived: 0,
};
