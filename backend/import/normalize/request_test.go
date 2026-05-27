package normalize

import (
	"dispo/backend/api"
	"testing"
)

func TestRequest_syncsJSONContentType(t *testing.T) {
	request := &api.SavedRequestPayload{
		Method:          "POST",
		BodyMode:        api.BodyModeText,
		Body:            `{"ok":true}`,
		BodyContentType: "json",
		Headers:         []api.KeyValuePayload{},
	}

	Request(request)

	if request.BodyContentType != "application/json" {
		t.Fatalf("bodyContentType = %q, want application/json", request.BodyContentType)
	}

	value := headerValue(request.Headers, contentTypeHeader)
	if value != "application/json" {
		t.Fatalf("Content-Type header = %q, want application/json", value)
	}
}

func TestRequest_infersMethodFromBody(t *testing.T) {
	request := &api.SavedRequestPayload{
		Method:   "",
		BodyMode: api.BodyModeText,
		Body:     `{"name":"dispo"}`,
	}

	Request(request)

	if request.Method != "POST" {
		t.Fatalf("method = %q, want POST", request.Method)
	}
}

func TestRequest_usesExistingContentTypeHeader(t *testing.T) {
	request := &api.SavedRequestPayload{
		Method:   "PUT",
		BodyMode: api.BodyModeText,
		Body:     "<note/>",
		Headers: []api.KeyValuePayload{
			{Key: "Content-Type", Value: "application/xml", Enabled: true},
		},
	}

	Request(request)

	if request.BodyContentType != "application/xml; charset=utf-8" {
		t.Fatalf("bodyContentType = %q", request.BodyContentType)
	}
}
