package api

import "encoding/json"

// BodyMetaPayload is the persisted, JSON-encoded "extra" body data that
// lives next to the legacy `body TEXT` column in both request_tabs and
// saved_requests. The legacy column continues to hold the textual body
// payload so a Dispo install that pre-dates body modes keeps working.
//
// New fields can be appended here without a schema migration — they
// simply default to their zero-value when absent from the stored JSON.
type BodyMetaPayload struct {
	BodyMode         string                 `json:"bodyMode,omitempty"`
	BodyContentType  string                 `json:"bodyContentType,omitempty"`
	FormSubtype      string                 `json:"formSubtype,omitempty"`
	FormFields       []FormBodyFieldPayload `json:"formFields,omitempty"`
	FileContentType  string                 `json:"fileContentType,omitempty"`
	FileBody         *FileBodyPayload       `json:"fileBody,omitempty"`
	GraphQLQuery     string                 `json:"graphqlQuery,omitempty"`
	GraphQLVariables string                 `json:"graphqlVariables,omitempty"`
}

// MarshalBodyMeta serialises the meta payload to JSON. Returns an empty
// string when the meta is effectively empty (default-mode tab) so the
// SQLite column stays compact.
func MarshalBodyMeta(meta BodyMetaPayload) (string, error) {
	if isEmptyBodyMeta(meta) {
		return "", nil
	}
	data, err := json.Marshal(meta)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// UnmarshalBodyMeta parses a previously stored meta blob. Empty input
// yields a zero-value payload (no error) so callers can rely on it for
// legacy rows that pre-date the body-mode work.
func UnmarshalBodyMeta(value string) (BodyMetaPayload, error) {
	var meta BodyMetaPayload
	if value == "" {
		return meta, nil
	}
	if err := json.Unmarshal([]byte(value), &meta); err != nil {
		return BodyMetaPayload{}, err
	}
	return meta, nil
}

func isEmptyBodyMeta(meta BodyMetaPayload) bool {
	if meta.BodyMode != "" {
		return false
	}
	if meta.BodyContentType != "" || meta.FormSubtype != "" || meta.FileContentType != "" {
		return false
	}
	if meta.GraphQLQuery != "" || meta.GraphQLVariables != "" {
		return false
	}
	if len(meta.FormFields) > 0 {
		return false
	}
	if meta.FileBody != nil {
		return false
	}
	return true
}
