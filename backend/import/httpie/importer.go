package httpie

import (
	"crypto/rand"
	"dispo/backend/api"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// Importer converts HTTPie Desktop export JSON into Dispo collection trees.
type Importer struct{}

func (Importer) Import(data []byte) (*api.ImportCollectionResult, error) {
	var document exportDocument
	if err := json.Unmarshal(data, &document); err != nil {
		return nil, fmt.Errorf("parse HTTPie export JSON: %w", err)
	}

	if document.Meta.Format != "httpie" {
		return nil, fmt.Errorf("not an HTTPie export (meta.format=%q)", document.Meta.Format)
	}

	result := &api.ImportCollectionResult{
		Trees:    make([]api.CollectionTreePayload, 0),
		Warnings: make([]string, 0),
	}

	switch document.Meta.ContentType {
	case "collection":
		collection, err := decodeEntry[collectionEntry](document.Entry)
		if err != nil {
			return nil, err
		}
		tree, warnings, err := importCollectionEntry(collection)
		if err != nil {
			return nil, err
		}
		result.Trees = append(result.Trees, tree)
		result.Warnings = append(result.Warnings, warnings...)
	case "workspace":
		workspace, err := decodeEntry[workspaceEntry](document.Entry)
		if err != nil {
			return nil, err
		}
		for _, collection := range workspace.Collections {
			tree, warnings, err := importCollectionEntry(collection)
			if err != nil {
				return nil, err
			}
			result.Trees = append(result.Trees, tree)
			result.Warnings = append(result.Warnings, warnings...)
		}
		for _, environment := range workspace.Environments {
			result.SuggestedVariables = append(
				result.SuggestedVariables,
				mapEnvironmentVariables(environment)...)
		}
	case "environment":
		environment, err := decodeEntry[environmentEntry](document.Entry)
		if err != nil {
			return nil, err
		}
		result.SuggestedVariables = mapEnvironmentVariables(environment)
	default:
		return nil, fmt.Errorf(
			"unsupported HTTPie export content type %q (expected collection, workspace, or environment)",
			document.Meta.ContentType,
		)
	}

	scanned := collectTemplateVariables(result.Trees)
	result.SuggestedVariables = mergeSuggestedVariables(
		result.SuggestedVariables,
		scanned,
	)

	return result, nil
}

func importCollectionEntry(
	entry collectionEntry,
) (api.CollectionTreePayload, []string, error) {
	warnings := make([]string, 0)
	now := time.Now().UnixMilli()

	collectionAuth, authWarnings := mapHTTPieAuth(entry.Auth, false)
	warnings = append(warnings, authWarnings...)

	tree := api.CollectionTreePayload{
		Collection: api.CollectionPayload{
			ID:          "",
			Name:        strings.TrimSpace(entry.Name),
			Description: "",
			SortOrder:   -1,
			Auth:        collectionAuth,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
		Folders:       []api.FolderPayload{},
		SavedRequests: make([]api.SavedRequestPayload, 0, len(entry.Requests)),
	}

	if tree.Collection.Name == "" {
		tree.Collection.Name = "Imported Collection"
	}

	for index, request := range entry.Requests {
		mapped, requestWarnings, err := mapHTTPieRequest(request, index)
		if err != nil {
			return api.CollectionTreePayload{}, nil, err
		}
		warnings = append(warnings, requestWarnings...)
		tree.SavedRequests = append(tree.SavedRequests, mapped)
	}

	return tree, warnings, nil
}

func mapHTTPieRequest(request requestEntry, sortOrder int) (api.SavedRequestPayload, []string, error) {
	warnings := make([]string, 0)
	now := time.Now().UnixMilli()

	name := strings.TrimSpace(request.Name)
	if name == "" {
		name = "Untitled Request"
	}

	bodyMode, body, bodyMeta, bodyWarnings := mapHTTPieBody(request.Body)
	warnings = append(warnings, bodyWarnings...)

	requestAuth, authWarnings := mapHTTPieAuth(request.Auth, true)
	warnings = append(warnings, authWarnings...)

	payload := api.SavedRequestPayload{
		ID:                 "",
		CollectionID:       "",
		FolderID:           nil,
		Name:               name,
		Method:             strings.ToUpper(strings.TrimSpace(request.Method)),
		URL:                request.URL,
		BodyMode:           bodyMode,
		Body:               body,
		BodyContentType:    bodyMeta.BodyContentType,
		FormSubtype:        bodyMeta.FormSubtype,
		FormFields:         bodyMeta.FormFields,
		FileContentType:    bodyMeta.FileContentType,
		FileBody:           bodyMeta.FileBody,
		GraphQLQuery:       bodyMeta.GraphQLQuery,
		GraphQLVariables:   bodyMeta.GraphQLVariables,
		PreRequestScript:   "",
		PostResponseScript: "",
		Headers:            mapHTTPieList(request.Headers),
		QueryParams:        mapHTTPieList(request.QueryParams),
		PathParams:         mapHTTPieList(request.PathParams),
		Auth:               requestAuth,
		SortOrder:          sortOrder,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	if payload.Method == "" {
		payload.Method = "GET"
	}

	return payload, warnings, nil
}

func mapHTTPieBody(body requestBody) (string, string, api.BodyMetaPayload, []string) {
	warnings := make([]string, 0)
	meta := api.BodyMetaPayload{
		FormFields:      []api.FormBodyFieldPayload{},
		FileContentType: "application/octet-stream",
	}

	switch body.Type {
	case "none", "":
		return api.BodyModeNone, "", meta, warnings
	case "text":
		meta.BodyContentType = body.Text.Format
		if meta.BodyContentType == "" {
			meta.BodyContentType = "application/json"
		}
		return api.BodyModeText, body.Text.Value, meta, warnings
	case "graphql":
		meta.GraphQLQuery = body.GraphQL.Query
		meta.GraphQLVariables = body.GraphQL.Variables
		return api.BodyModeGraphQL, "", meta, warnings
	case "form":
		if body.Form.IsMultipart {
			meta.FormSubtype = api.FormSubtypeMultipart
			meta.FormFields = mapHTTPieFormFields(body.Form.Fields)
			return api.BodyModeForm, "", meta, warnings
		}
		meta.FormSubtype = api.FormSubtypeURLEncoded
		if len(body.Form.Fields) > 0 {
			meta.FormFields = mapHTTPieFormFields(body.Form.Fields)
			return api.BodyModeForm, "", meta, warnings
		}
		return api.BodyModeForm, body.Text.Value, meta, warnings
	case "file":
		warnings = append(warnings, fmt.Sprintf(
			"file body %q cannot be imported automatically — select the file again after import",
			body.File.Name,
		))
		return api.BodyModeFile, "", meta, warnings
	default:
		warnings = append(warnings, fmt.Sprintf("unsupported HTTPie body type %q — stored as none", body.Type))
		return api.BodyModeNone, "", meta, warnings
	}
}

func mapHTTPieFormFields(fields []formField) []api.FormBodyFieldPayload {
	result := make([]api.FormBodyFieldPayload, 0, len(fields))
	for _, field := range fields {
		kind := "text"
		if field.Type == "file" || field.Type == "filetext" {
			kind = "file"
		}
		result = append(result, api.FormBodyFieldPayload{
			ID:              newID(),
			Enabled:         field.Enabled,
			Kind:            kind,
			Key:             field.Name,
			Value:           field.Value,
			FileName:        field.File.Name,
			FilePath:        "",
			FileContentType: "",
			FileSize:        0,
		})
	}
	return result
}

func mapHTTPieList(items []listItem) []api.KeyValuePayload {
	result := make([]api.KeyValuePayload, 0, len(items))
	for _, item := range items {
		result = append(result, api.KeyValuePayload{
			ID:      newID(),
			Key:     item.Name,
			Value:   item.Value,
			Enabled: item.Enabled,
		})
	}
	return result
}

func mapHTTPieAuth(auth authEntry, allowInherited bool) (api.RequestAuthPayload, []string) {
	warnings := make([]string, 0)
	authType := strings.TrimSpace(auth.Type)

	if authType == "inherited" {
		if allowInherited {
			return api.RequestAuthPayload{Type: "inherited", BearerToken: ""}, warnings
		}
		return api.RequestAuthPayload{Type: "none", BearerToken: ""}, warnings
	}

	switch authType {
	case "", "none":
		return api.RequestAuthPayload{Type: "none", BearerToken: ""}, warnings
	case "bearer":
		token := strings.TrimSpace(auth.Credentials.Password)
		if token == "" {
			token = strings.TrimSpace(auth.Credentials.Username)
		}
		return api.RequestAuthPayload{Type: "bearer", BearerToken: token}, warnings
	case "basic", "apiKey":
		warnings = append(warnings, fmt.Sprintf(
			"HTTPie %s auth is not fully supported yet — configure headers manually or use bearer/none",
			authType,
		))
		return api.RequestAuthPayload{Type: "none", BearerToken: ""}, warnings
	default:
		warnings = append(warnings, fmt.Sprintf("unknown HTTPie auth type %q — stored as none", authType))
		return api.RequestAuthPayload{Type: "none", BearerToken: ""}, warnings
	}
}

func mapEnvironmentVariables(environment environmentEntry) []api.SuggestedVariablePayload {
	result := make([]api.SuggestedVariablePayload, 0, len(environment.Variables))
	for _, variable := range environment.Variables {
		name := strings.TrimSpace(variable.Name)
		if name == "" {
			continue
		}
		result = append(result, api.SuggestedVariablePayload{
			Name:  name,
			Value: variable.Value,
		})
	}
	return result
}

func decodeEntry[T any](entry json.RawMessage) (T, error) {
	var value T
	if err := json.Unmarshal(entry, &value); err != nil {
		return value, fmt.Errorf("decode HTTPie entry: %w", err)
	}
	return value, nil
}

func newID() string {
	buffer := make([]byte, 10)
	if _, err := rand.Read(buffer); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(buffer)
}

type exportDocument struct {
	Meta  exportMeta       `json:"meta"`
	Entry json.RawMessage  `json:"entry"`
}

type exportMeta struct {
	Format      string `json:"format"`
	Version     string `json:"version"`
	ContentType string `json:"contentType"`
}

type collectionEntry struct {
	Name     string         `json:"name"`
	Auth     authEntry      `json:"auth"`
	Requests []requestEntry `json:"requests"`
}

type workspaceEntry struct {
	Name         string             `json:"name"`
	Collections  []collectionEntry  `json:"collections"`
	Environments []environmentEntry `json:"environments"`
}

type environmentEntry struct {
	Name      string            `json:"name"`
	Variables []environmentVar  `json:"variables"`
}

type environmentVar struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type requestEntry struct {
	Name        string      `json:"name"`
	URL         string      `json:"url"`
	Method      string      `json:"method"`
	Headers     []listItem  `json:"headers"`
	QueryParams []listItem  `json:"queryParams"`
	PathParams  []listItem  `json:"pathParams"`
	Auth        authEntry   `json:"auth"`
	Body        requestBody `json:"body"`
}

type authEntry struct {
	Type        string          `json:"type"`
	Credentials authCredentials `json:"credentials"`
}

type authCredentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type listItem struct {
	Name    string `json:"name"`
	Value   string `json:"value"`
	Enabled bool   `json:"enabled"`
}

type requestBody struct {
	Type    string          `json:"type"`
	Text    bodyText        `json:"text"`
	Form    bodyForm        `json:"form"`
	GraphQL bodyGraphQL     `json:"graphql"`
	File    bodyFile        `json:"file"`
}

type bodyText struct {
	Value  string `json:"value"`
	Format string `json:"format"`
}

type bodyForm struct {
	IsMultipart bool        `json:"isMultipart"`
	Fields      []formField `json:"fields"`
}

type formField struct {
	Enabled bool      `json:"enabled"`
	Name    string    `json:"name"`
	Type    string    `json:"type"`
	Value   string    `json:"value"`
	File    bodyFile  `json:"file"`
}

type bodyGraphQL struct {
	Query     string `json:"query"`
	Variables string `json:"variables"`
}

type bodyFile struct {
	Name string `json:"name"`
}
