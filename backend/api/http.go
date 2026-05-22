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

type EnvironmentPayload struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	Variables []KeyValuePayload `json:"variables"`
}

type RequestTabPayload struct {
	ID                 string             `json:"id"`
	CollectionID       string             `json:"collectionId"`
	SavedRequestID     *string            `json:"savedRequestId,omitempty"`
	Layout             string             `json:"layout"`
	Protocol           string             `json:"protocol"`
	Title              string             `json:"title"`
	Method             string             `json:"method"`
	URL                string             `json:"url"`
	Body               string             `json:"body"`
	PreRequestScript   string             `json:"preRequestScript"`
	PostResponseScript string             `json:"postResponseScript"`
	Headers            []KeyValuePayload  `json:"headers"`
	QueryParams        []KeyValuePayload  `json:"queryParams"`
	Auth               RequestAuthPayload `json:"auth"`
	Response           map[string]any     `json:"response,omitempty"`
	CreatedAt          int64              `json:"createdAt"`
	UpdatedAt          int64              `json:"updatedAt"`
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
	Body    string            `json:"body,omitempty"`
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
