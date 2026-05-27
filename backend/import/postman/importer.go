package postman

import (
	"dispo/backend/api"
	"fmt"
)

// Importer is a placeholder for future Postman Collection v2.1 support.
type Importer struct{}

func (Importer) Import(_ []byte) (*api.ImportCollectionResult, error) {
	return nil, fmt.Errorf("postman import is not implemented yet")
}
