package httpclient

import (
	"context"
	"dispo/backend/api"
	"io"
	"net/http"
	"strings"
	"time"
)

type HTTPService struct {
	ctx context.Context
}

func NewHTTPService() *HTTPService {
	return &HTTPService{}
}

func (a *HTTPService) SendHttpRequest(req api.HttpRequestPayload) (*api.HttpResponsePayload, error) {
	start := time.Now()

	client := &http.Client{}

	request, err := http.NewRequest(
		req.Method,
		req.URL,
		strings.NewReader(req.Body),
	)

	request.Header.Set("User-Agent", "dispo/1.0")

	if err != nil {
		return nil, err
	}

	for key, value := range req.Headers {
		request.Header.Set(key, value)
	}

	response, err := client.Do(request)

	if err != nil {
		return nil, err
	}

	defer response.Body.Close()

	body, _ := io.ReadAll(response.Body)

	headers := map[string]string{}

	for key, values := range response.Header {
		headers[key] = strings.Join(values, ", ")
	}

	return &api.HttpResponsePayload{
		Status:     response.StatusCode,
		StatusText: response.Status,
		Headers:    headers,
		Body:       string(body),
		Duration:   time.Since(start).Milliseconds(),
	}, nil
}

func (s *HTTPService) Startup(ctx context.Context) {
	s.ctx = ctx
}
