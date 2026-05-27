package importpkg

import "dispo/backend/api"

// Importer converts a third-party export file into Dispo's collection model.
type Importer interface {
	Import(data []byte) (*api.ImportCollectionResult, error)
}
