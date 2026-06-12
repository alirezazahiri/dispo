package websocket

import (
	"context"
	"dispo/backend/api"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/http/cookiejar"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	eventOpen    = "ws:open"
	eventMessage = "ws:message"
	eventError   = "ws:error"
	eventClose   = "ws:close"
)

type activeConnection struct {
	tabID  string
	conn   *websocket.Conn
	cancel context.CancelFunc
}

// Service manages WebSocket connections and emits lifecycle events to the frontend.
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

// Connect starts a WebSocket connection in the background. Returns immediately
// unless the request cannot be constructed.
func (s *Service) Connect(req api.WsConnectPayload) (api.WsConnectResult, error) {
	if s.ctx == nil {
		return api.WsConnectResult{}, fmt.Errorf("websocket service is not available before app startup")
	}

	connectionID := strings.TrimSpace(req.ConnectionID)
	if connectionID == "" {
		connectionID = strings.TrimSpace(req.TabID)
	}
	if connectionID == "" {
		return api.WsConnectResult{}, fmt.Errorf("connection id is required")
	}
	if strings.TrimSpace(req.URL) == "" {
		return api.WsConnectResult{}, fmt.Errorf("url is required")
	}

	url := strings.TrimSpace(req.URL)
	lowerURL := strings.ToLower(url)
	if !strings.HasPrefix(lowerURL, "ws://") && !strings.HasPrefix(lowerURL, "wss://") {
		return api.WsConnectResult{}, fmt.Errorf("url must start with ws:// or wss://")
	}

	tabID := strings.TrimSpace(req.TabID)
	if tabID == "" {
		tabID = connectionID
	}

	s.mu.Lock()
	if existing, ok := s.connections[connectionID]; ok {
		existing.cancel()
		if existing.conn != nil {
			_ = existing.conn.Close()
		}
		delete(s.connections, connectionID)
	}

	connCtx, cancel := context.WithCancel(s.ctx)
	s.connections[connectionID] = &activeConnection{
		tabID:  tabID,
		cancel: cancel,
	}
	s.mu.Unlock()

	go s.connect(connCtx, connectionID, tabID, req)

	return api.WsConnectResult{ConnectionID: connectionID}, nil
}

// Disconnect closes an active WebSocket connection.
func (s *Service) Disconnect(connectionID string) error {
	connectionID = strings.TrimSpace(connectionID)
	if connectionID == "" {
		return fmt.Errorf("connection id is required")
	}

	s.mu.Lock()
	active, ok := s.connections[connectionID]
	if ok {
		active.cancel()
		if active.conn != nil {
			_ = active.conn.WriteMessage(
				websocket.CloseMessage,
				websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""),
			)
			_ = active.conn.Close()
		}
		delete(s.connections, connectionID)
	}
	s.mu.Unlock()

	if !ok {
		return nil
	}

	s.emit(eventClose, api.WsCloseEventPayload{
		ConnectionID: connectionID,
		TabID:        active.tabID,
	})
	return nil
}

// ReadFileBase64 reads a local file and returns its contents as base64.
func (s *Service) ReadFileBase64(path string) (string, error) {
	path = strings.TrimSpace(path)
	if path == "" {
		return "", fmt.Errorf("file path is required")
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("read file: %w", err)
	}

	return base64.StdEncoding.EncodeToString(data), nil
}

// SendMessage writes an outbound WebSocket frame.
func (s *Service) SendMessage(req api.WsSendPayload) error {
	connectionID := strings.TrimSpace(req.ConnectionID)
	if connectionID == "" {
		return fmt.Errorf("connection id is required")
	}

	messageType := strings.TrimSpace(strings.ToLower(req.MessageType))
	if messageType != "text" && messageType != "binary" {
		return fmt.Errorf(`message type must be "text" or "binary"`)
	}

	s.mu.Lock()
	active, ok := s.connections[connectionID]
	conn := active.conn
	s.mu.Unlock()

	if !ok || conn == nil {
		return fmt.Errorf("no active connection for %q", connectionID)
	}

	switch messageType {
	case "text":
		return conn.WriteMessage(websocket.TextMessage, []byte(req.Data))
	case "binary":
		data, err := base64.StdEncoding.DecodeString(req.Data)
		if err != nil {
			return fmt.Errorf("decode binary payload: %w", err)
		}
		return conn.WriteMessage(websocket.BinaryMessage, data)
	default:
		return fmt.Errorf(`unsupported message type %q`, messageType)
	}
}

// Close disconnects all active connections.
func (s *Service) Close() {
	s.mu.Lock()
	connections := s.connections
	s.connections = make(map[string]*activeConnection)
	s.mu.Unlock()

	for connectionID, active := range connections {
		active.cancel()
		if active.conn != nil {
			_ = active.conn.Close()
		}
		s.emit(eventClose, api.WsCloseEventPayload{
			ConnectionID: connectionID,
			TabID:        active.tabID,
		})
	}
}

func (s *Service) connect(
	ctx context.Context,
	connectionID string,
	tabID string,
	req api.WsConnectPayload,
) {
	defer s.removeConnection(connectionID)

	dialer := websocket.Dialer{
		HandshakeTimeout: 30 * time.Second,
	}

	if req.WithCredentials {
		jar, err := cookiejar.New(nil)
		if err != nil {
			s.emit(eventError, api.WsErrorEventPayload{
				ConnectionID: connectionID,
				TabID:        tabID,
				Error:        fmt.Sprintf("create cookie jar: %v", err),
			})
			return
		}
		dialer.Jar = jar
	}

	headers := http.Header{}
	for key, value := range req.Headers {
		headers.Set(key, value)
	}
	if headers.Get("User-Agent") == "" {
		headers.Set("User-Agent", "Dispo/1.0")
	}
	if len(req.Subprotocols) > 0 && headers.Get("Sec-WebSocket-Protocol") == "" {
		headers.Set("Sec-WebSocket-Protocol", strings.Join(req.Subprotocols, ", "))
	}

	conn, response, err := dialer.DialContext(ctx, req.URL, headers)
	if err != nil {
		if ctx.Err() != nil {
			return
		}
		s.emit(eventError, api.WsErrorEventPayload{
			ConnectionID: connectionID,
			TabID:        tabID,
			Error:        err.Error(),
		})
		return
	}

	s.mu.Lock()
	if active, ok := s.connections[connectionID]; ok {
		active.conn = conn
	}
	s.mu.Unlock()

	var responseHeaders []api.WsHeaderPayload
	statusCode := 101
	statusText := "Switching Protocols"
	subprotocol := conn.Subprotocol()

	if response != nil {
		statusCode = response.StatusCode
		statusText = response.Status
		responseHeaders = flattenHeaders(response.Header)
		_ = response.Body.Close()
	}

	s.emit(eventOpen, api.WsOpenEventPayload{
		ConnectionID: connectionID,
		TabID:        tabID,
		StatusCode:   statusCode,
		StatusText:   statusText,
		Headers:      responseHeaders,
		Subprotocol:  subprotocol,
	})

	s.readLoop(ctx, connectionID, tabID, conn)
}

func (s *Service) readLoop(
	ctx context.Context,
	connectionID string,
	tabID string,
	conn *websocket.Conn,
) {
	defer func() {
		closeCode, closeReason := readCloseInfo(conn)
		_ = conn.Close()
		s.emit(eventClose, api.WsCloseEventPayload{
			ConnectionID: connectionID,
			TabID:        tabID,
			CloseCode:    closeCode,
			CloseReason:  closeReason,
		})
	}()

	for {
		if ctx.Err() != nil {
			return
		}

		messageType, data, err := conn.ReadMessage()
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				return
			}
			if websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				s.emit(eventError, api.WsErrorEventPayload{
					ConnectionID: connectionID,
					TabID:        tabID,
					Error:        err.Error(),
				})
			}
			return
		}

		payload := toMessagePayload(connectionID, tabID, messageType, data)
		s.emit(eventMessage, payload)
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

func flattenHeaders(headers http.Header) []api.WsHeaderPayload {
	result := make([]api.WsHeaderPayload, 0, len(headers))
	for key, values := range headers {
		result = append(result, api.WsHeaderPayload{
			Key:   key,
			Value: strings.Join(values, ", "),
		})
	}
	return result
}

func toMessagePayload(
	connectionID string,
	tabID string,
	messageType int,
	data []byte,
) api.WsMessageEventPayload {
	switch messageType {
	case websocket.BinaryMessage:
		return api.WsMessageEventPayload{
			ConnectionID: connectionID,
			TabID:        tabID,
			MessageType:  "binary",
			Data:         base64.StdEncoding.EncodeToString(data),
			ByteLength:   len(data),
		}
	default:
		return api.WsMessageEventPayload{
			ConnectionID: connectionID,
			TabID:        tabID,
			MessageType:  "text",
			Data:         string(data),
			ByteLength:   len(data),
		}
	}
}

func readCloseInfo(conn *websocket.Conn) (int, string) {
	conn.SetReadDeadline(time.Now().Add(time.Millisecond))
	_, _, err := conn.ReadMessage()
	conn.SetReadDeadline(time.Time{})

	if closeErr, ok := err.(*websocket.CloseError); ok {
		return closeErr.Code, closeErr.Text
	}
	return 0, ""
}
