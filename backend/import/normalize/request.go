package normalize

import (
	"crypto/rand"
	"dispo/backend/api"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

const contentTypeHeader = "Content-Type"

// Request fills in missing method/body metadata and keeps the headers list
// aligned with the inferred body configuration.
func Request(request *api.SavedRequestPayload) {
	normalizeMethod(request)
	normalizeBodyMeta(request)
	syncContentTypeHeader(request)
}

func normalizeMethod(request *api.SavedRequestPayload) {
	method := strings.ToUpper(strings.TrimSpace(request.Method))
	if method == "" {
		if hasRequestBody(request) {
			method = "POST"
		} else {
			method = "GET"
		}
	}
	request.Method = method
}

func hasRequestBody(request *api.SavedRequestPayload) bool {
	switch request.BodyMode {
	case api.BodyModeForm:
		return len(request.FormFields) > 0 || strings.TrimSpace(request.Body) != ""
	case api.BodyModeText, api.BodyModeGraphQL, api.BodyModeFile:
		return strings.TrimSpace(request.Body) != "" ||
			strings.TrimSpace(request.GraphQLQuery) != ""
	default:
		return strings.TrimSpace(request.Body) != ""
	}
}

func normalizeBodyMeta(request *api.SavedRequestPayload) {
	if request.BodyMode == "" {
		if strings.TrimSpace(request.Body) != "" {
			request.BodyMode = api.BodyModeText
		} else if len(request.FormFields) > 0 {
			request.BodyMode = api.BodyModeForm
		} else if strings.TrimSpace(request.GraphQLQuery) != "" {
			request.BodyMode = api.BodyModeGraphQL
		} else {
			request.BodyMode = api.BodyModeNone
		}
	}

	if request.BodyContentType == "" {
		if value := headerValue(request.Headers, contentTypeHeader); value != "" {
			request.BodyContentType = NormalizeTextContentType(value)
		}
	}

	if request.BodyMode == api.BodyModeText && request.BodyContentType == "" {
		request.BodyContentType = inferTextContentTypeFromBody(request.Body)
	}

	if request.BodyContentType != "" {
		request.BodyContentType = NormalizeTextContentType(request.BodyContentType)
	}

	if request.BodyMode == api.BodyModeText && request.BodyContentType == "" {
		request.BodyContentType = "application/json"
	}

	if request.FormSubtype == "" {
		request.FormSubtype = api.FormSubtypeURLEncoded
	}
	if request.FileContentType == "" {
		request.FileContentType = "application/octet-stream"
	}
	if request.FormFields == nil {
		request.FormFields = []api.FormBodyFieldPayload{}
	}
}

func resolveBodyContentType(request api.SavedRequestPayload) string {
	switch request.BodyMode {
	case api.BodyModeText:
		if request.BodyContentType != "" {
			return request.BodyContentType
		}
		return "application/json"
	case api.BodyModeForm:
		if request.FormSubtype != "" {
			return request.FormSubtype
		}
		return api.FormSubtypeURLEncoded
	case api.BodyModeFile:
		if request.FileContentType != "" {
			return request.FileContentType
		}
		return "application/octet-stream"
	case api.BodyModeGraphQL:
		return "application/json"
	default:
		return ""
	}
}

func syncContentTypeHeader(request *api.SavedRequestPayload) {
	contentType := resolveBodyContentType(*request)
	if contentType == "" {
		request.Headers = removeHeader(request.Headers, contentTypeHeader)
		return
	}

	index := findHeaderIndex(request.Headers, contentTypeHeader)
	if index == -1 {
		request.Headers = append(request.Headers, api.KeyValuePayload{
			ID:      newID(),
			Key:     contentTypeHeader,
			Value:   contentType,
			Enabled: true,
		})
		return
	}

	request.Headers[index].Value = contentType
	request.Headers[index].Enabled = true
	if strings.TrimSpace(request.Headers[index].Key) == "" {
		request.Headers[index].Key = contentTypeHeader
	}
}

// NormalizeTextContentType maps importer-specific labels to Dispo mime types.
func NormalizeTextContentType(raw string) string {
	value := strings.TrimSpace(strings.ToLower(raw))
	value = strings.Split(value, ";")[0]
	value = strings.TrimSpace(value)

	switch value {
	case "json", "application/json":
		return "application/json"
	case "xml", "application/xml", "text/xml":
		return "application/xml; charset=utf-8"
	case "html", "text/html":
		return "text/plain; charset=utf-8"
	case "javascript", "application/javascript":
		return "text/plain; charset=utf-8"
	case "yaml", "text/yaml", "application/x-yaml":
		return "text/yaml; charset=utf-8"
	case "text", "text/plain":
		return "text/plain; charset=utf-8"
	case "application/x-www-form-urlencoded":
		return api.FormSubtypeURLEncoded
	case "multipart/form-data":
		return api.FormSubtypeMultipart
	default:
		if raw == "" {
			return ""
		}
		return strings.TrimSpace(raw)
	}
}

func inferTextContentTypeFromBody(body string) string {
	trimmed := strings.TrimSpace(body)
	if trimmed == "" {
		return ""
	}
	if json.Valid([]byte(trimmed)) {
		return "application/json"
	}
	if strings.HasPrefix(trimmed, "<") && strings.Contains(trimmed, ">") {
		return "application/xml; charset=utf-8"
	}
	if strings.Contains(trimmed, "\n") && strings.Contains(trimmed, ":") {
		return "text/yaml; charset=utf-8"
	}
	return "text/plain; charset=utf-8"
}

func headerValue(headers []api.KeyValuePayload, name string) string {
	index := findHeaderIndex(headers, name)
	if index == -1 {
		return ""
	}
	row := headers[index]
	if !row.Enabled {
		return ""
	}
	return strings.TrimSpace(row.Value)
}

func findHeaderIndex(headers []api.KeyValuePayload, name string) int {
	needle := strings.ToLower(strings.TrimSpace(name))
	for index, header := range headers {
		if strings.ToLower(strings.TrimSpace(header.Key)) == needle {
			return index
		}
	}
	return -1
}

func removeHeader(headers []api.KeyValuePayload, name string) []api.KeyValuePayload {
	index := findHeaderIndex(headers, name)
	if index == -1 {
		return headers
	}
	next := make([]api.KeyValuePayload, 0, len(headers)-1)
	next = append(next, headers[:index]...)
	return append(next, headers[index+1:]...)
}

func newID() string {
	buffer := make([]byte, 10)
	if _, err := rand.Read(buffer); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(buffer)
}
