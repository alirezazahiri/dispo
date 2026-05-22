package api

type CollectionPayload struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	SortOrder   int    `json:"sortOrder"`
	CreatedAt   int64  `json:"createdAt"`
	UpdatedAt   int64  `json:"updatedAt"`
}

type FolderPayload struct {
	ID             string  `json:"id"`
	CollectionID   string  `json:"collectionId"`
	ParentFolderID *string `json:"parentFolderId,omitempty"`
	Name           string  `json:"name"`
	SortOrder      int     `json:"sortOrder"`
	CreatedAt      int64   `json:"createdAt"`
	UpdatedAt      int64   `json:"updatedAt"`
}

type SavedRequestPayload struct {
	ID                 string             `json:"id"`
	CollectionID       string             `json:"collectionId"`
	FolderID           *string            `json:"folderId,omitempty"`
	Name               string             `json:"name"`
	Method             string             `json:"method"`
	URL                string             `json:"url"`
	Body               string             `json:"body"`
	PreRequestScript   string             `json:"preRequestScript"`
	PostResponseScript string             `json:"postResponseScript"`
	Headers            []KeyValuePayload  `json:"headers"`
	QueryParams        []KeyValuePayload  `json:"queryParams"`
	Auth               RequestAuthPayload `json:"auth"`
	SortOrder          int                `json:"sortOrder"`
	CreatedAt          int64              `json:"createdAt"`
	UpdatedAt          int64              `json:"updatedAt"`
}

type CollectionTreePayload struct {
	Collection    CollectionPayload     `json:"collection"`
	Folders       []FolderPayload       `json:"folders"`
	SavedRequests []SavedRequestPayload `json:"savedRequests"`
}

type CreateCollectionInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type RenameCollectionInput struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type DeleteEntityInput struct {
	ID string `json:"id"`
}

type CreateFolderInput struct {
	CollectionID   string  `json:"collectionId"`
	ParentFolderID *string `json:"parentFolderId,omitempty"`
	Name           string  `json:"name"`
}

type RenameFolderInput struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type RenameRequestInput struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type MoveFolderInput struct {
	ID                string  `json:"id"`
	NewParentFolderID *string `json:"newParentFolderId,omitempty"`
	NewSortOrder      int     `json:"newSortOrder"`
}

type MoveSavedRequestInput struct {
	ID           string  `json:"id"`
	NewFolderID  *string `json:"newFolderId,omitempty"`
	NewSortOrder int     `json:"newSortOrder"`
}
