package sse

import (
	"bufio"
	"context"
	"dispo/backend/api"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"strings"
	"sync"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	eventOpen  = "sse:open"
	eventData  = "sse:event"
	eventError = "sse:error"
	eventClose = "sse:close"
)

type activeConnection struct {
	tabID  string
	cancel context.CancelFunc
}

// Service manages SSE streams and emits lifecycle events to the frontend.
type Service struct {
	ctx         context.Context
	mu          sync.Mutex
	connections map[string]*activeConnection
}

func NewService() *Service {
	return &Service{
		connections: make(map[string]*activeConnection),
	}
}

func (s *Service) Startup(ctx context.Context) {
	s.ctx = ctx
}

// Connect starts streaming in the background. Returns immediately unless the
// request cannot be constructed.
func (s *Service) Connect(req api.SseConnectPayload) (api.SseConnectResult, error) {
	if s.ctx == nil {
		return api.SseConnectResult{}, fmt.Errorf("sse service is not available before app startup")
	}

	connectionID := strings.TrimSpace(req.ConnectionID)
	if connectionID == "" {
		connectionID = strings.TrimSpace(req.TabID)
	}
	if connectionID == "" {
		return api.SseConnectResult{}, fmt.Errorf("connection id is required")
	}
	if strings.TrimSpace(req.URL) == "" {
		return api.SseConnectResult{}, fmt.Errorf("url is required")
	}

	tabID := strings.TrimSpace(req.TabID)
	if tabID == "" {
		tabID = connectionID
	}

	s.mu.Lock()
	if existing, ok := s.connections[connectionID]; ok {
		existing.cancel()
		delete(s.connections, connectionID)
	}

	streamCtx, cancel := context.WithCancel(s.ctx)
	s.connections[connectionID] = &activeConnection{
		tabID:  tabID,
		cancel: cancel,
	}
	s.mu.Unlock()

	go s.stream(streamCtx, connectionID, tabID, req)

	return api.SseConnectResult{ConnectionID: connectionID}, nil
}

// Disconnect cancels an active SSE stream.
func (s *Service) Disconnect(connectionID string) error {
	connectionID = strings.TrimSpace(connectionID)
	if connectionID == "" {
		return fmt.Errorf("connection id is required")
	}

	s.mu.Lock()
	active, ok := s.connections[connectionID]
	if ok {
		active.cancel()
		delete(s.connections, connectionID)
	}
	s.mu.Unlock()

	if !ok {
		return nil
	}

	s.emit(eventClose, api.SseCloseEventPayload{
		ConnectionID: connectionID,
		TabID:        active.tabID,
	})
	return nil
}

// Close disconnects all active streams.
func (s *Service) Close() {
	s.mu.Lock()
	connections := s.connections
	s.connections = make(map[string]*activeConnection)
	s.mu.Unlock()

	for connectionID, active := range connections {
		active.cancel()
		s.emit(eventClose, api.SseCloseEventPayload{
			ConnectionID: connectionID,
			TabID:        active.tabID,
		})
	}
}

func (s *Service) stream(
	ctx context.Context,
	connectionID string,
	tabID string,
	req api.SseConnectPayload,
) {
	defer s.removeConnection(connectionID)

	client, err := newHTTPClient(req.WithCredentials)
	if err != nil {
		s.emit(eventError, api.SseErrorEventPayload{
			ConnectionID: connectionID,
			TabID:        tabID,
			Error:        err.Error(),
		})
		return
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, req.URL, nil)
	if err != nil {
		s.emit(eventError, api.SseErrorEventPayload{
			ConnectionID: connectionID,
			TabID:        tabID,
			Error:        err.Error(),
		})
		return
	}

	httpReq.Header.Set("User-Agent", "Dispo/1.0")
	httpReq.Header.Set("Accept", "text/event-stream")
	httpReq.Header.Set("Cache-Control", "no-cache")
	applyHeaders(httpReq, req.Headers)

	lastEventID := strings.TrimSpace(req.LastEventID)
	if lastEventID != "" {
		httpReq.Header.Set("Last-Event-ID", lastEventID)
	}

	response, err := client.Do(httpReq)
	if err != nil {
		if ctx.Err() != nil {
			return
		}
		s.emit(eventError, api.SseErrorEventPayload{
			ConnectionID: connectionID,
			TabID:        tabID,
			Error:        err.Error(),
		})
		return
	}
	defer response.Body.Close()

	headers := flattenHeaders(response.Header)
	s.emit(eventOpen, api.SseOpenEventPayload{
		ConnectionID: connectionID,
		TabID:        tabID,
		StatusCode:   response.StatusCode,
		StatusText:   response.Status,
		Headers:      headers,
		Error:        openErrorMessage(response),
	})

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
		message := strings.TrimSpace(string(body))
		if message != "" {
			s.emit(eventError, api.SseErrorEventPayload{
				ConnectionID: connectionID,
				TabID:        tabID,
				Error:        fmt.Sprintf("HTTP %d %s: %s", response.StatusCode, response.Status, message),
			})
		}
		return
	}

	contentType := strings.ToLower(response.Header.Get("Content-Type"))
	if !strings.Contains(contentType, "text/event-stream") {
		s.emit(eventError, api.SseErrorEventPayload{
			ConnectionID: connectionID,
			TabID:        tabID,
			Error: fmt.Sprintf(
				`expected Content-Type text/event-stream but received %q`,
				response.Header.Get("Content-Type"),
			),
		})
		return
	}

	reader := bufio.NewReader(response.Body)
	var parser Parser
	buffer := make([]byte, 4096)

	for {
		if ctx.Err() != nil {
			return
		}

		n, readErr := reader.Read(buffer)
		if n > 0 {
			for _, event := range parser.Parse(string(buffer[:n])) {
				s.emit(eventData, toStreamEvent(connectionID, tabID, event))
			}
		}

		if readErr != nil {
			if ctx.Err() != nil {
				return
			}
			if readErr != io.EOF {
				s.emit(eventError, api.SseErrorEventPayload{
					ConnectionID: connectionID,
					TabID:        tabID,
					Error:        readErr.Error(),
				})
			}
			s.emit(eventClose, api.SseCloseEventPayload{
				ConnectionID: connectionID,
				TabID:        tabID,
			})
			return
		}
	}
}

func (s *Service) removeConnection(connectionID string) {
	s.mu.Lock()
	delete(s.connections, connectionID)
	s.mu.Unlock()
}

func (s *Service) emit(eventName string, payload any) {
	if s.ctx == nil {
		return
	}
	wailsruntime.EventsEmit(s.ctx, eventName, payload)
}

func newHTTPClient(withCredentials bool) (*http.Client, error) {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	client := &http.Client{
		Transport: transport,
		Timeout:   0,
	}

	if withCredentials {
		jar, err := cookiejar.New(nil)
		if err != nil {
			return nil, fmt.Errorf("create cookie jar: %w", err)
		}
		client.Jar = jar
	}

	return client, nil
}

func applyHeaders(req *http.Request, headers map[string]string) {
	for key, value := range headers {
		req.Header.Set(key, value)
	}
}

func flattenHeaders(headers http.Header) []api.SseHeaderPayload {
	result := make([]api.SseHeaderPayload, 0, len(headers))
	for key, values := range headers {
		result = append(result, api.SseHeaderPayload{
			Key:   key,
			Value: strings.Join(values, ", "),
		})
	}
	return result
}

func openErrorMessage(response *http.Response) string {
	if response.StatusCode >= 200 && response.StatusCode < 300 {
		return ""
	}
	return fmt.Sprintf("HTTP %d %s", response.StatusCode, response.Status)
}

func toStreamEvent(connectionID, tabID string, event Event) api.SseStreamEventPayload {
	eventType := event.Event
	if eventType == "" {
		eventType = "message"
	}

	return api.SseStreamEventPayload{
		ConnectionID: connectionID,
		TabID:        tabID,
		EventID:      event.ID,
		EventType:    eventType,
		Data:         event.Data,
		Retry:        event.Retry,
	}
}
