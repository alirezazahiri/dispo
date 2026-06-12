package api

// WsConnectPayload starts a WebSocket connection identified by ConnectionID
// (typically the workspace tab id).
type WsConnectPayload struct {
	ConnectionID    string            `json:"connectionId"`
	TabID           string            `json:"tabId"`
	URL             string            `json:"url"`
	Headers         map[string]string `json:"headers"`
	Subprotocols    []string          `json:"subprotocols,omitempty"`
	WithCredentials bool              `json:"withCredentials"`
}

// WsConnectResult is returned immediately when a connect attempt is accepted.
// Handshake details and streamed messages follow on Wails runtime events.
type WsConnectResult struct {
	ConnectionID string `json:"connectionId"`
	Error        string `json:"error,omitempty"`
}

// WsSendPayload sends an outbound WebSocket frame on an active connection.
type WsSendPayload struct {
	ConnectionID string `json:"connectionId"`
	MessageType  string `json:"messageType"` // "text" or "binary"
	Data         string `json:"data"`        // plain text or base64 for binary
}

type WsHeaderPayload struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// WsOpenEventPayload is emitted on event "ws:open" after the handshake.
type WsOpenEventPayload struct {
	ConnectionID string            `json:"connectionId"`
	TabID        string            `json:"tabId"`
	StatusCode   int               `json:"statusCode"`
	StatusText   string            `json:"statusText"`
	Headers      []WsHeaderPayload `json:"headers"`
	Subprotocol  string            `json:"subprotocol,omitempty"`
	Error        string            `json:"error,omitempty"`
}

// WsMessageEventPayload is emitted on event "ws:message" for each inbound frame.
type WsMessageEventPayload struct {
	ConnectionID string `json:"connectionId"`
	TabID        string `json:"tabId"`
	MessageType  string `json:"messageType"` // "text" or "binary"
	Data         string `json:"data"`        // plain text or base64 for binary
	ByteLength   int    `json:"byteLength"`
}

// WsErrorEventPayload is emitted on event "ws:error".
type WsErrorEventPayload struct {
	ConnectionID string `json:"connectionId"`
	TabID        string `json:"tabId"`
	Error        string `json:"error"`
}

// WsCloseEventPayload is emitted on event "ws:close".
type WsCloseEventPayload struct {
	ConnectionID string `json:"connectionId"`
	TabID        string `json:"tabId"`
	CloseCode    int    `json:"closeCode,omitempty"`
	CloseReason  string `json:"closeReason,omitempty"`
}
