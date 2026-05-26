package httpservice

import (
	"context"
	"dispo/backend/api"
	"dispo/backend/workspace"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type HTTPService struct {
	ctx            context.Context
	workspaceStore *workspace.Repository
}

func NewHTTPService() *HTTPService {
	repo, err := workspace.NewRepository()
	if err != nil {
		panic(fmt.Sprintf("failed to initialize workspace repository: %v", err))
	}

	return &HTTPService{
		workspaceStore: repo,
	}
}

func (a *HTTPService) SendHttpRequest(
	req api.HttpRequestPayload,
) (*api.HttpResponsePayload, error) {
	start := time.Now()

	client := &http.Client{
		Timeout: 60 * time.Second,
	}

	request, err := http.NewRequest(
		req.Method,
		req.URL,
		strings.NewReader(req.Body),
	)

	if err != nil {
		return &api.HttpResponsePayload{
			Status:     0,
			StatusText: "Invalid Request",
			Headers:    map[string]string{},
			Cookies:    []api.ResponseCookiePayload{},
			Body:       "",
			Duration:   time.Since(start).Milliseconds(),
			Error:      err.Error(),
		}, nil
	}

	request.Header.Set("User-Agent", "Dispo/1.0")

	for key, value := range req.Headers {
		request.Header.Set(key, value)
	}

	response, err := client.Do(request)

	if err != nil {
		return &api.HttpResponsePayload{
			Status:     0,
			StatusText: "Network Error",
			Headers:    map[string]string{},
			Cookies:    []api.ResponseCookiePayload{},
			Body:       "",
			Duration:   time.Since(start).Milliseconds(),
			Error:      err.Error(),
		}, nil
	}

	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)

	if err != nil {
		return &api.HttpResponsePayload{
			Status:     response.StatusCode,
			StatusText: response.Status,
			Headers:    map[string]string{},
			Cookies:    []api.ResponseCookiePayload{},
			Body:       "",
			Duration:   time.Since(start).Milliseconds(),
			Error:      err.Error(),
		}, nil
	}

	headers := map[string]string{}

	for key, values := range response.Header {
		headers[key] = strings.Join(values, ", ")
	}

	cookies := make([]api.ResponseCookiePayload, 0, len(response.Cookies()))
	for _, cookie := range response.Cookies() {
		cookies = append(cookies, api.ResponseCookiePayload{
			Name:     cookie.Name,
			Value:    cookie.Value,
			Domain:   cookie.Domain,
			Path:     cookie.Path,
			Expires:  cookie.Expires.Format(time.RFC3339),
			HTTPOnly: cookie.HttpOnly,
			Secure:   cookie.Secure,
			SameSite: sameSiteToString(cookie.SameSite),
		})
	}

	return &api.HttpResponsePayload{
		Status:     response.StatusCode,
		StatusText: response.Status,
		Headers:    headers,
		Cookies:    cookies,
		Body:       string(body),
		Duration:   time.Since(start).Milliseconds(),
		Error:      "",
	}, nil
}

func (s *HTTPService) Startup(ctx context.Context) {
	s.ctx = ctx
}

func (s *HTTPService) LoadWorkspaceState() (*api.WorkspaceStatePayload, error) {
	state, err := s.workspaceStore.LoadState()
	if err != nil {
		return nil, err
	}

	return &state, nil
}

func (s *HTTPService) SaveWorkspaceState(state api.WorkspaceStatePayload) error {
	return s.workspaceStore.SaveState(state)
}

func (s *HTTPService) Close() error {
	return s.workspaceStore.Close()
}

func sameSiteToString(value http.SameSite) string {
	switch value {
	case http.SameSiteStrictMode:
		return "Strict"
	case http.SameSiteLaxMode:
		return "Lax"
	case http.SameSiteNoneMode:
		return "None"
	default:
		return ""
	}
}
