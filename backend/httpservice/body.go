package httpservice

import (
	"bytes"
	"dispo/backend/api"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"strings"
)

// CONTENT_TYPE_HEADER is the canonical capitalisation we write back to
// `req.Header` so the on-the-wire header matches what the user expects.
const contentTypeHeader = "Content-Type"

// builtBody captures the transport-level body and any header overrides
// that the request must apply before going out. headerOverrides is keyed
// by canonical MIME header name (textproto.CanonicalMIMEHeaderKey).
type builtBody struct {
	reader          io.Reader
	cleanup         func()
	headerOverrides map[string]string
	dropHeaders     []string
}

// buildRequestBody inspects the payload's BodyMode and returns the right
// `io.Reader` and Content-Type for the active mode.
//
// The function intentionally falls back to the legacy `payload.Body`
// string when BodyMode is unset, so older frontend builds and callers
// that just send a plain text body continue to work unchanged.
func buildRequestBody(payload api.HttpRequestPayload) (builtBody, error) {
	mode := payload.BodyMode
	if mode == "" {
		// Backwards compatibility: missing BodyMode → treat as text.
		mode = api.BodyModeText
	}

	switch mode {
	case api.BodyModeNone:
		return builtBody{
			dropHeaders: []string{contentTypeHeader},
		}, nil

	case api.BodyModeText:
		return builtBody{
			reader: strings.NewReader(payload.Body),
		}, nil

	case api.BodyModeForm:
		return buildFormBody(payload)

	case api.BodyModeFile:
		return buildFileBody(payload)

	case api.BodyModeGraphQL:
		return buildGraphQLBody(payload)

	default:
		return builtBody{}, fmt.Errorf("unsupported body mode: %q", mode)
	}
}

func buildFormBody(payload api.HttpRequestPayload) (builtBody, error) {
	subtype := payload.FormSubtype
	if subtype == "" {
		subtype = api.FormSubtypeURLEncoded
	}

	switch subtype {
	case api.FormSubtypeURLEncoded:
		// The frontend pre-encodes URL-encoded form bodies into
		// payload.Body so script hooks see the encoded string. We just
		// forward it.
		return builtBody{
			reader: strings.NewReader(payload.Body),
			headerOverrides: map[string]string{
				contentTypeHeader: api.FormSubtypeURLEncoded,
			},
		}, nil

	case api.FormSubtypeMultipart:
		return buildMultipartBody(payload)

	default:
		return builtBody{}, fmt.Errorf("unsupported form subtype: %q", subtype)
	}
}

func buildMultipartBody(payload api.HttpRequestPayload) (builtBody, error) {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	for _, field := range payload.FormFields {
		if !field.Enabled {
			continue
		}
		key := strings.TrimSpace(field.Key)
		if key == "" {
			continue
		}

		switch field.Kind {
		case "", "text":
			if err := writer.WriteField(key, field.Value); err != nil {
				return builtBody{}, fmt.Errorf("write form text field %q: %w", key, err)
			}

		case "file":
			if field.FilePath == "" {
				return builtBody{}, fmt.Errorf("form file field %q is missing a file path", key)
			}

			fileName := field.FileName
			if fileName == "" {
				fileName = "upload.bin"
			}

			partHeader := make(textproto.MIMEHeader)
			partHeader.Set(
				"Content-Disposition",
				fmt.Sprintf(
					`form-data; name=%q; filename=%q`,
					escapeQuotes(key),
					escapeQuotes(fileName),
				),
			)
			contentType := field.FileContentType
			if contentType == "" {
				contentType = "application/octet-stream"
			}
			partHeader.Set("Content-Type", contentType)

			part, err := writer.CreatePart(partHeader)
			if err != nil {
				return builtBody{}, fmt.Errorf("create multipart part for %q: %w", key, err)
			}

			file, err := os.Open(field.FilePath)
			if err != nil {
				return builtBody{}, fmt.Errorf("open file %q: %w", field.FilePath, err)
			}
			if _, err := io.Copy(part, file); err != nil {
				_ = file.Close()
				return builtBody{}, fmt.Errorf("copy file %q: %w", field.FilePath, err)
			}
			if err := file.Close(); err != nil {
				return builtBody{}, fmt.Errorf("close file %q: %w", field.FilePath, err)
			}

		default:
			return builtBody{}, fmt.Errorf("unsupported form field kind: %q", field.Kind)
		}
	}

	if err := writer.Close(); err != nil {
		return builtBody{}, fmt.Errorf("finalize multipart body: %w", err)
	}

	return builtBody{
		reader: &buf,
		headerOverrides: map[string]string{
			// multipart.Writer.FormDataContentType returns the full
			// "multipart/form-data; boundary=..." string.
			contentTypeHeader: writer.FormDataContentType(),
		},
	}, nil
}

func buildFileBody(payload api.HttpRequestPayload) (builtBody, error) {
	if payload.File == nil || payload.File.Path == "" {
		return builtBody{}, errors.New("file body mode selected but no file path provided")
	}

	file, err := os.Open(payload.File.Path)
	if err != nil {
		return builtBody{}, fmt.Errorf("open body file %q: %w", payload.File.Path, err)
	}

	contentType := payload.FileContentType
	if contentType == "" {
		contentType = payload.File.ContentType
	}
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	return builtBody{
		reader: file,
		cleanup: func() {
			_ = file.Close()
		},
		headerOverrides: map[string]string{
			contentTypeHeader: contentType,
		},
	}, nil
}

func buildGraphQLBody(payload api.HttpRequestPayload) (builtBody, error) {
	if payload.GraphQL == nil {
		// Treat absent GraphQL payload as an empty query; the server
		// will respond with its own validation error, which is more
		// useful feedback than a client-side panic.
		return builtBody{
			reader: strings.NewReader("{}"),
			headerOverrides: map[string]string{
				contentTypeHeader: "application/json",
			},
		}, nil
	}

	envelope := map[string]any{
		"query": payload.GraphQL.Query,
	}

	variablesText := strings.TrimSpace(payload.GraphQL.Variables)
	if variablesText != "" {
		var variables any
		if err := json.Unmarshal([]byte(variablesText), &variables); err != nil {
			return builtBody{}, fmt.Errorf("parse graphql variables: %w", err)
		}
		envelope["variables"] = variables
	}

	body, err := json.Marshal(envelope)
	if err != nil {
		return builtBody{}, fmt.Errorf("encode graphql body: %w", err)
	}

	return builtBody{
		reader: bytes.NewReader(body),
		headerOverrides: map[string]string{
			contentTypeHeader: "application/json",
		},
	}, nil
}

// applyHeaders writes the user's headers onto the outgoing request, then
// applies overrides from `built` (which may either replace the value of
// an existing header — case-insensitive — or drop it entirely).
func applyHeaders(req *http.Request, userHeaders map[string]string, built builtBody) {
	for key, value := range userHeaders {
		req.Header.Set(key, value)
	}

	for _, drop := range built.dropHeaders {
		req.Header.Del(drop)
	}
	for key, value := range built.headerOverrides {
		req.Header.Set(key, value)
	}
}

func escapeQuotes(value string) string {
	return strings.ReplaceAll(value, `"`, `\"`)
}
