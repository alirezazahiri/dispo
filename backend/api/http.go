package api

type KeyValuePayload struct {
	ID      string `json:"id"`
	Key     string `json:"key"`
	Value   string `json:"value"`
	Enabled bool   `json:"enabled"`
}

type RequestAuthPayload struct {
	Type        string `json:"type"`
	BearerToken string `json:"bearerToken"`
}

// Body mode discriminator values. Mirrored from the frontend's
// `RequestBodyMode` union so the wire format stays self-describing.
const (
	BodyModeNone    = "none"
	BodyModeText    = "text"
	BodyModeForm    = "form"
	BodyModeFile    = "file"
	BodyModeGraphQL = "graphql"
)

// Form subtype values when BodyMode == "form".
const (
	FormSubtypeURLEncoded = "application/x-www-form-urlencoded"
	FormSubtypeMultipart  = "multipart/form-data"
)

// FormBodyFieldPayload is a single row in the multipart/url-encoded form
// editor. When Kind == "file", FilePath points at the source file the
// backend will read at transport time. When Kind == "text", Value carries
// the field's textual value and the file metadata fields are empty.
type FormBodyFieldPayload struct {
	ID              string `json:"id"`
	Enabled         bool   `json:"enabled"`
	Kind            string `json:"kind"`
	Key             string `json:"key"`
	Value           string `json:"value"`
	FileName        string `json:"fileName,omitempty"`
	FilePath        string `json:"filePath,omitempty"`
	FileContentType string `json:"fileContentType,omitempty"`
	FileSize        int64  `json:"fileSize,omitempty"`
}

// FileBodyPayload describes the single file selected for `file` body mode.
// Path is an absolute path on the user's machine (populated by the native
// open-file dialog) — never trusted/dereferenced unless the request is in
// `file` mode at send time.
type FileBodyPayload struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	ContentType string `json:"contentType"`
	Size        int64  `json:"size"`
}

// GraphQLBodyPayload is the structured GraphQL body. Variables is held as
// a JSON-encoded string so authors can keep their formatting; the
// transport layer parses it into an object when assembling the wire body.
type GraphQLBodyPayload struct {
	Query     string `json:"query"`
	Variables string `json:"variables"`
}

type EnvironmentPayload struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	Variables []KeyValuePayload `json:"variables"`
}

type RequestTabPayload struct {
	ID                 string                 `json:"id"`
	CollectionID       string                 `json:"collectionId"`
	SavedRequestID     *string                `json:"savedRequestId,omitempty"`
	Layout             string                 `json:"layout"`
	Protocol           string                 `json:"protocol"`
	Title              string                 `json:"title"`
	Method             string                 `json:"method"`
	URL                string                 `json:"url"`
	BodyMode           string                 `json:"bodyMode"`
	Body               string                 `json:"body"`
	BodyContentType    string                 `json:"bodyContentType"`
	FormSubtype        string                 `json:"formSubtype"`
	FormFields         []FormBodyFieldPayload `json:"formFields"`
	FileContentType    string                 `json:"fileContentType"`
	FileBody           *FileBodyPayload       `json:"fileBody,omitempty"`
	GraphQLQuery       string                 `json:"graphqlQuery"`
	GraphQLVariables   string                 `json:"graphqlVariables"`
	PreRequestScript   string                 `json:"preRequestScript"`
	PostResponseScript string                 `json:"postResponseScript"`
	Headers            []KeyValuePayload      `json:"headers"`
	QueryParams        []KeyValuePayload      `json:"queryParams"`
	PathParams         []KeyValuePayload      `json:"pathParams"`
	Auth               RequestAuthPayload     `json:"auth"`
	Response           map[string]any         `json:"response,omitempty"`
	CreatedAt          int64                  `json:"createdAt"`
	UpdatedAt          int64                  `json:"updatedAt"`
}

type WorkspaceStatePayload struct {
	Tabs                    []RequestTabPayload  `json:"tabs"`
	TabOrderByCollection    map[string][]string  `json:"tabOrderByCollection"`
	ActiveTabIDByCollection map[string]string    `json:"activeTabIdByCollection"`
	CurrentCollectionID     string               `json:"currentCollectionId"`
	Environments            []EnvironmentPayload `json:"environments"`
	ActiveEnvironmentID     string               `json:"activeEnvironmentId"`
}

type HttpRequestPayload struct {
	ID      string            `json:"id"`
	Method  string            `json:"method"`
	URL     string            `json:"url"`
	Headers map[string]string `json:"headers"`

	// BodyMode is the "general" body type — none / text / form / file /
	// graphql. When empty, the backend assumes the legacy text mode where
	// `Body` is the verbatim payload.
	BodyMode string `json:"bodyMode,omitempty"`

	// Body is the pre-encoded textual body. Populated for text mode and
	// for `form` + url-encoded (the frontend serialises url-encoded form
	// data into a string to keep the script hooks compatible).
	Body string `json:"body,omitempty"`

	// FormSubtype distinguishes url-encoded from multipart when BodyMode
	// is "form". Required for `form` mode; ignored otherwise.
	FormSubtype string `json:"formSubtype,omitempty"`

	// FormFields is the structured list of form rows used when BodyMode
	// is "form" with multipart subtype (or when the backend wants to
	// authoritatively encode url-encoded forms).
	FormFields []FormBodyFieldPayload `json:"formFields,omitempty"`

	// File is the binary payload for `file` body mode. Path must point at
	// a readable file on the user's machine.
	File *FileBodyPayload `json:"file,omitempty"`

	// FileContentType overrides the Content-Type header when sending a
	// `file` body. Defaults to `application/octet-stream` when empty.
	FileContentType string `json:"fileContentType,omitempty"`

	// GraphQL holds the structured query when BodyMode is "graphql". The
	// transport layer is responsible for assembling the JSON envelope.
	GraphQL *GraphQLBodyPayload `json:"graphql,omitempty"`
}

// PickFileOptions controls the native open-file dialog exposed by
// HTTPService.PickFile. All fields are optional.
type PickFileOptions struct {
	Title       string             `json:"title,omitempty"`
	DefaultDir  string             `json:"defaultDirectory,omitempty"`
	DefaultName string             `json:"defaultFilename,omitempty"`
	Filters     []FileDialogFilter `json:"filters,omitempty"`
}

type FileDialogFilter struct {
	DisplayName string `json:"displayName"`
	Pattern     string `json:"pattern"`
}

// PickFileResult is what HTTPService.PickFile returns: a file the user
// approved or `Cancelled=true` when the dialog was dismissed. ContentType
// is sniffed from the file's bytes (best-effort) so the UI can pre-fill
// the Content-Type field.
type PickFileResult struct {
	Path        string `json:"path"`
	Name        string `json:"name"`
	Size        int64  `json:"size"`
	ContentType string `json:"contentType"`
	Cancelled   bool   `json:"cancelled"`
}

type ResponseCookiePayload struct {
	Name     string `json:"name"`
	Value    string `json:"value"`
	Domain   string `json:"domain"`
	Path     string `json:"path"`
	Expires  string `json:"expires"`
	HTTPOnly bool   `json:"httpOnly"`
	Secure   bool   `json:"secure"`
	SameSite string `json:"sameSite"`
}

type HttpResponsePayload struct {
	Status     int                     `json:"status"`
	StatusText string                  `json:"statusText"`
	Headers    map[string]string       `json:"headers"`
	Cookies    []ResponseCookiePayload `json:"cookies"`
	Body       string                  `json:"body"`
	Duration   int64                   `json:"duration"`
	Error      string                  `json:"error,omitempty"`
}
