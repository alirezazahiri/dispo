package postman

import (
	"crypto/rand"
	"dispo/backend/api"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// Importer converts Postman Collection v2.1 JSON into Dispo collection trees.
type Importer struct{}

func (Importer) Import(data []byte) (*api.ImportCollectionResult, error) {
	var collection postmanCollection
	if err := json.Unmarshal(data, &collection); err != nil {
		return nil, fmt.Errorf("parse Postman collection JSON: %w", err)
	}

	schema := strings.TrimSpace(collection.Info.Schema)
	if schema != "" && !strings.Contains(schema, "collection") {
		return nil, fmt.Errorf("not a Postman collection export (schema=%q)", schema)
	}

	result := &api.ImportCollectionResult{
		Trees:    make([]api.CollectionTreePayload, 0, 1),
		Warnings: make([]string, 0),
	}

	now := time.Now().UnixMilli()
	collectionAuth, authWarnings := mapPostmanAuth(collection.Auth, false)
	result.Warnings = append(result.Warnings, authWarnings...)

	tree := api.CollectionTreePayload{
		Collection: api.CollectionPayload{
			ID:          "",
			Name:        strings.TrimSpace(collection.Info.Name),
			Description: strings.TrimSpace(collection.Info.Description),
			SortOrder:   -1,
			Auth:        collectionAuth,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
		Folders:       []api.FolderPayload{},
		SavedRequests: []api.SavedRequestPayload{},
	}

	if tree.Collection.Name == "" {
		tree.Collection.Name = "Imported Collection"
	}

	for _, variable := range collection.Variable {
		key := strings.TrimSpace(variable.Key)
		if key == "" {
			continue
		}
		result.SuggestedVariables = append(result.SuggestedVariables, api.SuggestedVariablePayload{
			Name:  key,
			Value: variable.Value,
		})
	}

	requestSort := 0
	walkItems(collection.Item, nil, &tree, &requestSort, &result.Warnings)

	if len(tree.SavedRequests) == 0 && len(tree.Folders) == 0 {
		return nil, fmt.Errorf("postman collection contains no importable requests")
	}

	if hasCollectionScripts(collection.Event) {
		result.Warnings = append(result.Warnings,
			"collection-level Postman scripts were not imported (configure scripts per request in Dispo)")
	}

	result.Trees = append(result.Trees, tree)

	scanned := collectTemplateVariables(result.Trees)
	result.SuggestedVariables = mergeSuggestedVariables(
		result.SuggestedVariables,
		scanned,
	)

	return result, nil
}

func walkItems(
	items []postmanItem,
	folderID *string,
	tree *api.CollectionTreePayload,
	requestSort *int,
	warnings *[]string,
) {
	for _, item := range items {
		if item.Request != nil {
			mapped, itemWarnings := mapPostmanRequest(*item.Request, item.Name, folderID, *requestSort)
			*warnings = append(*warnings, itemWarnings...)
			tree.SavedRequests = append(tree.SavedRequests, mapped)
			*requestSort++
			continue
		}

		if len(item.Item) == 0 {
			continue
		}

		if folderID != nil {
			*warnings = append(*warnings,
				fmt.Sprintf("nested folder %q was flattened (Dispo supports one folder level)", item.Name))
			prefix := strings.TrimSpace(item.Name) + "/"
			walkItemsFlattened(item.Item, folderID, tree, requestSort, warnings, prefix)
			continue
		}

		now := time.Now().UnixMilli()
		fid := newID()
		tree.Folders = append(tree.Folders, api.FolderPayload{
			ID:           fid,
			CollectionID: "",
			Name:         strings.TrimSpace(item.Name),
			SortOrder:    len(tree.Folders),
			CreatedAt:    now,
			UpdatedAt:    now,
		})
		walkItems(item.Item, &fid, tree, requestSort, warnings)
	}
}

func walkItemsFlattened(
	items []postmanItem,
	folderID *string,
	tree *api.CollectionTreePayload,
	requestSort *int,
	warnings *[]string,
	namePrefix string,
) {
	for _, item := range items {
		if item.Request != nil {
			name := namePrefix + strings.TrimSpace(item.Name)
			mapped, itemWarnings := mapPostmanRequest(*item.Request, name, folderID, *requestSort)
			*warnings = append(*warnings, itemWarnings...)
			tree.SavedRequests = append(tree.SavedRequests, mapped)
			*requestSort++
			continue
		}
		if len(item.Item) > 0 {
			nestedPrefix := namePrefix + strings.TrimSpace(item.Name) + "/"
			walkItemsFlattened(item.Item, folderID, tree, requestSort, warnings, nestedPrefix)
		}
	}
}

func mapPostmanRequest(
	request postmanRequest,
	name string,
	folderID *string,
	sortOrder int,
) (api.SavedRequestPayload, []string) {
	warnings := make([]string, 0)
	now := time.Now().UnixMilli()

	displayName := strings.TrimSpace(name)
	if displayName == "" {
		displayName = "Untitled Request"
	}

	bodyMode, body, bodyMeta, bodyWarnings := mapPostmanBody(request.Body)
	warnings = append(warnings, bodyWarnings...)

	requestAuth, authWarnings := mapPostmanAuth(request.Auth, true)
	warnings = append(warnings, authWarnings...)

	url, urlWarnings := resolvePostmanURL(request.URL)
	warnings = append(warnings, urlWarnings...)

	headers := mapPostmanHeaders(request.Header)
	queryParams := mapPostmanQueryParams(request.URL.Query)
	pathParams := mapPostmanPathParams(request.URL.Variable)

	payload := api.SavedRequestPayload{
		ID:                 "",
		CollectionID:       "",
		FolderID:           folderID,
		Name:               displayName,
		Method:             strings.ToUpper(strings.TrimSpace(request.Method)),
		URL:                url,
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
		Headers:            headers,
		QueryParams:        queryParams,
		PathParams:         pathParams,
		Auth:               requestAuth,
		SortOrder:          sortOrder,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	if payload.Method == "" {
		payload.Method = "GET"
	}

	return payload, warnings
}

func resolvePostmanURL(url postmanURL) (string, []string) {
	warnings := make([]string, 0)
	raw := strings.TrimSpace(url.Raw)
	if raw != "" {
		return raw, warnings
	}

	host := strings.Join(url.Host, "")
	if host == "" && len(url.Host) > 0 {
		host = url.Host[0]
	}

	path := "/" + strings.Join(url.Path, "/")
	path = strings.ReplaceAll(path, "//", "/")

	resolved := host + path

	if len(url.Query) > 0 {
		var parts []string
		for _, param := range url.Query {
			if param.Disabled {
				continue
			}
			key := strings.TrimSpace(param.Key)
			if key == "" {
				continue
			}
			value := param.Value
			if value == "" {
				parts = append(parts, key)
			} else {
				parts = append(parts, fmt.Sprintf("%s=%s", key, value))
			}
		}
		if len(parts) > 0 {
			resolved += "?" + strings.Join(parts, "&")
		}
	}

	if resolved == "" {
		warnings = append(warnings, "request URL was empty after import")
	}

	return resolved, warnings
}

func mapPostmanBody(body *postmanBody) (string, string, api.BodyMetaPayload, []string) {
	warnings := make([]string, 0)
	meta := api.BodyMetaPayload{
		FormFields:      []api.FormBodyFieldPayload{},
		FileContentType: "application/octet-stream",
	}

	if body == nil {
		return api.BodyModeNone, "", meta, warnings
	}

	switch strings.ToLower(strings.TrimSpace(body.Mode)) {
	case "", "none":
		return api.BodyModeNone, "", meta, warnings
	case "raw":
		meta.BodyContentType = mapRawLanguage(body.Options.Raw.Language)
		return api.BodyModeText, body.Raw, meta, warnings
	case "urlencoded":
		meta.FormSubtype = api.FormSubtypeURLEncoded
		meta.FormFields = mapPostmanFormURLEncoded(body.URLEncoded)
		return api.BodyModeForm, "", meta, warnings
	case "formdata":
		meta.FormSubtype = api.FormSubtypeMultipart
		meta.FormFields = mapPostmanFormData(body.FormData)
		return api.BodyModeForm, "", meta, warnings
	case "graphql":
		meta.GraphQLQuery = body.GraphQL.Query
		meta.GraphQLVariables = body.GraphQL.Variables
		return api.BodyModeGraphQL, "", meta, warnings
	case "file":
		warnings = append(warnings, "file body mode cannot be imported automatically — re-select the file after import")
		return api.BodyModeFile, "", meta, warnings
	default:
		warnings = append(warnings, fmt.Sprintf("unsupported Postman body mode %q — stored as none", body.Mode))
		return api.BodyModeNone, "", meta, warnings
	}
}

func mapRawLanguage(language string) string {
	switch strings.ToLower(strings.TrimSpace(language)) {
	case "json":
		return "application/json"
	case "xml":
		return "application/xml"
	case "html":
		return "text/html"
	case "javascript":
		return "application/javascript"
	case "text":
		return "text/plain"
	default:
		if language != "" {
			return language
		}
		return "application/json"
	}
}

func mapPostmanFormURLEncoded(entries []postmanFormParam) []api.FormBodyFieldPayload {
	result := make([]api.FormBodyFieldPayload, 0, len(entries))
	for _, entry := range entries {
		if entry.Disabled {
			continue
		}
		result = append(result, api.FormBodyFieldPayload{
			ID:      newID(),
			Enabled: true,
			Kind:    "text",
			Key:     entry.Key,
			Value:   entry.Value,
		})
	}
	return result
}

func mapPostmanFormData(entries []postmanFormParam) []api.FormBodyFieldPayload {
	result := make([]api.FormBodyFieldPayload, 0, len(entries))
	for _, entry := range entries {
		if entry.Disabled {
			continue
		}
		kind := "text"
		if strings.EqualFold(entry.Type, "file") {
			kind = "file"
		}
		result = append(result, api.FormBodyFieldPayload{
			ID:       newID(),
			Enabled:  true,
			Kind:     kind,
			Key:      entry.Key,
			Value:    entry.Value,
			FileName: entry.Src,
		})
	}
	return result
}

func mapPostmanHeaders(headers []postmanHeader) []api.KeyValuePayload {
	result := make([]api.KeyValuePayload, 0, len(headers))
	for _, header := range headers {
		if header.Disabled {
			continue
		}
		key := strings.TrimSpace(header.Key)
		if key == "" {
			continue
		}
		result = append(result, api.KeyValuePayload{
			ID:      newID(),
			Key:     key,
			Value:   header.Value,
			Enabled: true,
		})
	}
	return result
}

func mapPostmanQueryParams(params []postmanQueryParam) []api.KeyValuePayload {
	result := make([]api.KeyValuePayload, 0, len(params))
	for _, param := range params {
		if param.Disabled {
			continue
		}
		key := strings.TrimSpace(param.Key)
		if key == "" {
			continue
		}
		value := param.Value
		if value == "null" {
			value = ""
		}
		result = append(result, api.KeyValuePayload{
			ID:      newID(),
			Key:     key,
			Value:   value,
			Enabled: true,
		})
	}
	return result
}

func mapPostmanPathParams(params []postmanURLVariable) []api.KeyValuePayload {
	result := make([]api.KeyValuePayload, 0, len(params))
	for _, param := range params {
		key := strings.TrimSpace(param.Key)
		if key == "" {
			continue
		}
		result = append(result, api.KeyValuePayload{
			ID:      newID(),
			Key:     key,
			Value:   param.Value,
			Enabled: true,
		})
	}
	return result
}

func mapPostmanAuth(auth *postmanAuth, allowInherited bool) (api.RequestAuthPayload, []string) {
	warnings := make([]string, 0)

	if auth == nil {
		if allowInherited {
			return api.RequestAuthPayload{Type: "inherited", BearerToken: ""}, warnings
		}
		return api.RequestAuthPayload{Type: "none", BearerToken: ""}, warnings
	}

	authType := strings.ToLower(strings.TrimSpace(auth.Type))
	switch authType {
	case "", "noauth":
		return api.RequestAuthPayload{Type: "none", BearerToken: ""}, warnings
	case "bearer":
		token := authValue(auth.Bearer, "token")
		return api.RequestAuthPayload{Type: "bearer", BearerToken: token}, warnings
	case "basic":
		username := authValue(auth.Basic, "username")
		password := authValue(auth.Basic, "password")
		warnings = append(warnings, "Postman basic auth was not imported — use bearer or set Authorization header manually")
		_ = username
		_ = password
		return api.RequestAuthPayload{Type: "none", BearerToken: ""}, warnings
	case "apikey", "oauth2", "hawk", "awsv4", "digest", "ntlm":
		warnings = append(warnings, fmt.Sprintf("Postman %s auth is not fully supported yet", authType))
		return api.RequestAuthPayload{Type: "none", BearerToken: ""}, warnings
	default:
		warnings = append(warnings, fmt.Sprintf("unknown Postman auth type %q — stored as none", authType))
		return api.RequestAuthPayload{Type: "none", BearerToken: ""}, warnings
	}
}

func authValue(entries []postmanAuthParam, key string) string {
	for _, entry := range entries {
		if strings.EqualFold(entry.Key, key) {
			return entry.Value
		}
	}
	return ""
}

func hasCollectionScripts(events []postmanEvent) bool {
	for _, event := range events {
		if len(event.Script.Exec) > 0 && strings.TrimSpace(strings.Join(event.Script.Exec, "\n")) != "" {
			return true
		}
	}
	return false
}

func newID() string {
	buffer := make([]byte, 10)
	if _, err := rand.Read(buffer); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(buffer)
}

type postmanCollection struct {
	Info     postmanInfo      `json:"info"`
	Item     []postmanItem    `json:"item"`
	Auth     *postmanAuth     `json:"auth"`
	Variable []postmanVariable `json:"variable"`
	Event    []postmanEvent   `json:"event"`
}

type postmanInfo struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Schema      string `json:"schema"`
}

type postmanItem struct {
	Name    string          `json:"name"`
	Item    []postmanItem   `json:"item"`
	Request *postmanRequest `json:"request"`
}

type postmanRequest struct {
	Method string          `json:"method"`
	Header []postmanHeader `json:"header"`
	Body   *postmanBody    `json:"body"`
	URL    postmanURL      `json:"url"`
	Auth   *postmanAuth    `json:"auth"`
}

type postmanHeader struct {
	Key      string `json:"key"`
	Value    string `json:"value"`
	Disabled bool   `json:"disabled"`
}

type postmanBody struct {
	Mode        string             `json:"mode"`
	Raw         string             `json:"raw"`
	URLEncoded  []postmanFormParam `json:"urlencoded"`
	FormData    []postmanFormParam `json:"formdata"`
	GraphQL     postmanGraphQLBody `json:"graphql"`
	Options     postmanBodyOptions `json:"options"`
}

type postmanBodyOptions struct {
	Raw postmanRawOptions `json:"raw"`
}

type postmanRawOptions struct {
	Language string `json:"language"`
}

type postmanGraphQLBody struct {
	Query     string `json:"query"`
	Variables string `json:"variables"`
}

type postmanFormParam struct {
	Key      string `json:"key"`
	Value    string `json:"value"`
	Type     string `json:"type"`
	Src      string `json:"src"`
	Disabled bool   `json:"disabled"`
}

type postmanURL struct {
	Raw      string              `json:"raw"`
	Host     []string            `json:"host"`
	Path     []string            `json:"path"`
	Query    []postmanQueryParam `json:"query"`
	Variable []postmanURLVariable `json:"variable"`
}

type postmanQueryParam struct {
	Key      string `json:"key"`
	Value    string `json:"value"`
	Disabled bool   `json:"disabled"`
}

type postmanURLVariable struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type postmanAuth struct {
	Type   string             `json:"type"`
	Bearer []postmanAuthParam `json:"bearer"`
	Basic  []postmanAuthParam `json:"basic"`
}

type postmanAuthParam struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type postmanVariable struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type postmanEvent struct {
	Listen string        `json:"listen"`
	Script postmanScript `json:"script"`
}

type postmanScript struct {
	Exec []string `json:"exec"`
}
