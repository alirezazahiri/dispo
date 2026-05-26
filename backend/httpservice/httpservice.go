package httpservice

import (
	"context"
	"dispo/backend/api"
	"dispo/backend/workspace"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
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

	built, err := buildRequestBody(req)
	if err != nil {
		return &api.HttpResponsePayload{
			Status:     0,
			StatusText: "Invalid Request Body",
			Headers:    map[string]string{},
			Cookies:    []api.ResponseCookiePayload{},
			Body:       "",
			Duration:   time.Since(start).Milliseconds(),
			Error:      err.Error(),
		}, nil
	}
	if built.cleanup != nil {
		defer built.cleanup()
	}

	request, err := http.NewRequest(req.Method, req.URL, built.reader)

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

	applyHeaders(request, req.Headers, built)

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

// PickFile opens the OS-native open-file dialog and returns metadata for
// the selected file (size + sniffed content type) along with its
// absolute path. The path is what the frontend should hand back to
// SendHttpRequest in `file` body mode or as `formFields[].filePath` for
// multipart form parts.
//
// If the user dismisses the dialog the returned PickFileResult has
// Cancelled=true and all other fields zero-valued; callers should treat
// that as a no-op rather than an error.
func (s *HTTPService) PickFile(options api.PickFileOptions) (api.PickFileResult, error) {
	if s.ctx == nil {
		return api.PickFileResult{}, fmt.Errorf("file picker is not available before app startup")
	}

	filters := make([]wailsruntime.FileFilter, 0, len(options.Filters))
	for _, filter := range options.Filters {
		filters = append(filters, wailsruntime.FileFilter{
			DisplayName: filter.DisplayName,
			Pattern:     filter.Pattern,
		})
	}

	path, err := wailsruntime.OpenFileDialog(s.ctx, wailsruntime.OpenDialogOptions{
		Title:                options.Title,
		DefaultDirectory:     options.DefaultDir,
		DefaultFilename:      options.DefaultName,
		Filters:              filters,
		CanCreateDirectories: false,
	})
	if err != nil {
		return api.PickFileResult{}, fmt.Errorf("open file dialog: %w", err)
	}
	if path == "" {
		return api.PickFileResult{Cancelled: true}, nil
	}

	stat, err := os.Stat(path)
	if err != nil {
		return api.PickFileResult{}, fmt.Errorf("stat picked file: %w", err)
	}

	contentType := sniffContentType(path)

	return api.PickFileResult{
		Path:        path,
		Name:        filepath.Base(path),
		Size:        stat.Size(),
		ContentType: contentType,
	}, nil
}

// sniffContentType reads up to 512 bytes from `path` and asks Go's
// stdlib MIME detector for a best-effort guess. Falls back to
// `application/octet-stream` on any I/O error or when the file is
// shorter than the sniff window.
func sniffContentType(path string) string {
	file, err := os.Open(path)
	if err != nil {
		return "application/octet-stream"
	}
	defer file.Close()

	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return "application/octet-stream"
	}

	return http.DetectContentType(buffer[:n])
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
