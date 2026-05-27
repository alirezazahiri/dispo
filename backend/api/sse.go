package api

// SseConnectPayload starts a long-lived SSE stream identified by ConnectionID
// (typically the workspace tab id).
type SseConnectPayload struct {
	ConnectionID    string            `json:"connectionId"`
	TabID           string            `json:"tabId"`
	URL             string            `json:"url"`
	Headers         map[string]string `json:"headers"`
	LastEventID     string            `json:"lastEventId,omitempty"`
	WithCredentials bool              `json:"withCredentials"`
}

// SseConnectResult is returned immediately when a connect attempt is accepted.
// Handshake details and streamed events follow on Wails runtime events.
type SseConnectResult struct {
	ConnectionID string `json:"connectionId"`
	Error        string `json:"error,omitempty"`
}

type SseHeaderPayload struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// SseOpenEventPayload is emitted on event "sse:open" after the HTTP handshake.
type SseOpenEventPayload struct {
	ConnectionID string             `json:"connectionId"`
	TabID        string             `json:"tabId"`
	StatusCode   int                `json:"statusCode"`
	StatusText   string             `json:"statusText"`
	Headers      []SseHeaderPayload `json:"headers"`
	Error        string             `json:"error,omitempty"`
}

// SseStreamEventPayload is emitted on event "sse:event" for each parsed SSE message.
type SseStreamEventPayload struct {
	ConnectionID string `json:"connectionId"`
	TabID        string `json:"tabId"`
	EventID      string `json:"eventId,omitempty"`
	EventType    string `json:"eventType,omitempty"`
	Data         string `json:"data"`
	Retry        *int64 `json:"retry,omitempty"`
}

// SseErrorEventPayload is emitted on event "sse:error".
type SseErrorEventPayload struct {
	ConnectionID string `json:"connectionId"`
	TabID        string `json:"tabId"`
	Error        string `json:"error"`
}

// SseCloseEventPayload is emitted on event "sse:close".
type SseCloseEventPayload struct {
	ConnectionID string `json:"connectionId"`
	TabID        string `json:"tabId"`
}
