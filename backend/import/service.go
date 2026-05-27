package importpkg

import (
	"context"
	"dispo/backend/api"
	"dispo/backend/collections"
	"dispo/backend/import/httpie"
	"fmt"
	"os"
	"strings"
)

// Service coordinates third-party collection imports.
type Service struct {
	ctx        context.Context
	registry   *Registry
	collections *collections.Service
}

func NewService(collectionsService *collections.Service) *Service {
	registry := NewRegistry()
	registry.Register("httpie", httpie.Importer{})

	return &Service{
		registry:    registry,
		collections: collectionsService,
	}
}

func (s *Service) Startup(ctx context.Context) {
	s.ctx = ctx
}

func (s *Service) SupportedSources() []string {
	return s.registry.SupportedSources()
}

func (s *Service) ImportCollection(input api.ImportCollectionInput) (api.ImportCollectionResult, error) {
	if strings.TrimSpace(input.FilePath) == "" {
		return api.ImportCollectionResult{}, fmt.Errorf("file path is required")
	}

	importer, err := s.registry.Get(input.Source)
	if err != nil {
		return api.ImportCollectionResult{}, err
	}

	data, err := os.ReadFile(input.FilePath)
	if err != nil {
		return api.ImportCollectionResult{}, fmt.Errorf("read import file: %w", err)
	}

	parsed, err := importer.Import(data)
	if err != nil {
		return api.ImportCollectionResult{}, err
	}
	if parsed == nil {
		return api.ImportCollectionResult{}, fmt.Errorf("import returned no result")
	}
	if len(parsed.Trees) == 0 && len(parsed.SuggestedVariables) == 0 {
		return api.ImportCollectionResult{}, fmt.Errorf("import produced no collections or variables")
	}

	importedTrees := make([]api.CollectionTreePayload, 0, len(parsed.Trees))
	for _, tree := range parsed.Trees {
		saved, err := s.collections.ImportTree(tree)
		if err != nil {
			return api.ImportCollectionResult{}, err
		}
		importedTrees = append(importedTrees, saved)
	}

	return api.ImportCollectionResult{
		Trees:              importedTrees,
		SuggestedVariables: parsed.SuggestedVariables,
		Warnings:           parsed.Warnings,
	}, nil
}
