package collections

import (
	"context"
	"dispo/backend/api"
	"fmt"
)

type Service struct {
	ctx  context.Context
	repo *Repository
}

func NewService() *Service {
	repo, err := NewRepository()
	if err != nil {
		panic(fmt.Sprintf("failed to initialize collections repository: %v", err))
	}
	return &Service{
		repo: repo,
	}
}

func (s *Service) Startup(ctx context.Context) {
	s.ctx = ctx
}

func (s *Service) LoadAllCollections() ([]api.CollectionTreePayload, error) {
	return s.repo.LoadAllCollections()
}

func (s *Service) CreateCollection(input api.CreateCollectionInput) (api.CollectionPayload, error) {
	return s.repo.CreateCollection(input)
}

func (s *Service) RenameCollection(input api.RenameCollectionInput) error {
	return s.repo.RenameCollection(input)
}

func (s *Service) DeleteCollection(input api.DeleteEntityInput) error {
	return s.repo.DeleteCollection(input.ID)
}

func (s *Service) CreateFolder(input api.CreateFolderInput) (api.FolderPayload, error) {
	return s.repo.CreateFolder(input)
}

func (s *Service) RenameFolder(input api.RenameFolderInput) error {
	return s.repo.RenameFolder(input)
}

func (s *Service) MoveFolder(input api.MoveFolderInput) error {
	return s.repo.MoveFolder(input)
}

func (s *Service) DeleteFolder(input api.DeleteEntityInput) error {
	return s.repo.DeleteFolder(input.ID)
}

func (s *Service) SaveRequest(input api.SavedRequestPayload) (api.SavedRequestPayload, error) {
	return s.repo.SaveRequest(input)
}

func (s *Service) MoveRequest(input api.MoveSavedRequestInput) error {
	return s.repo.MoveRequest(input)
}

func (s *Service) DeleteRequest(input api.DeleteEntityInput) error {
	return s.repo.DeleteRequest(input.ID)
}
