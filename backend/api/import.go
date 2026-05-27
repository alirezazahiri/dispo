package api

// ImportCollectionInput selects an importer and the export file to read.
type ImportCollectionInput struct {
	Source   string `json:"source"`
	FilePath string `json:"filePath"`
}

// SuggestedVariablePayload is a template variable discovered during import.
// The UI can offer to add these to the active environment.
type SuggestedVariablePayload struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// ImportCollectionResult is the normalized output of any collection importer.
type ImportCollectionResult struct {
	Trees              []CollectionTreePayload    `json:"trees"`
	SuggestedVariables []SuggestedVariablePayload `json:"suggestedVariables"`
	Warnings           []string                   `json:"warnings"`
}
