package importpkg

import (
	"fmt"
	"strings"
)

// Registry maps a source identifier (e.g. "httpie") to an importer implementation.
type Registry struct {
	importers map[string]Importer
}

func NewRegistry() *Registry {
	return &Registry{
		importers: make(map[string]Importer),
	}
}

func (r *Registry) Register(source string, importer Importer) {
	r.importers[strings.ToLower(strings.TrimSpace(source))] = importer
}

func (r *Registry) Get(source string) (Importer, error) {
	importer, ok := r.importers[strings.ToLower(strings.TrimSpace(source))]
	if !ok {
		return nil, fmt.Errorf("unsupported import source: %s", source)
	}
	return importer, nil
}

func (r *Registry) SupportedSources() []string {
	sources := make([]string, 0, len(r.importers))
	for source := range r.importers {
		sources = append(sources, source)
	}
	return sources
}
