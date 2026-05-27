package collections

import (
	"crypto/rand"
	"database/sql"
	"dispo/backend/api"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

type Repository struct {
	db *sql.DB
}

const (
	defaultCollectionID   = "default-collection"
	defaultCollectionName = "Workspace"
)

func NewRepository() (*Repository, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return nil, fmt.Errorf("resolve user config dir: %w", err)
	}

	dbDir := filepath.Join(configDir, "dispo")
	if err := os.MkdirAll(dbDir, 0o755); err != nil {
		return nil, fmt.Errorf("create db directory: %w", err)
	}

	dbPath := filepath.Join(dbDir, "workspace.db")
	// busy_timeout makes SQLite wait briefly for the write lock instead of
	// returning SQLITE_BUSY immediately. Important because the workspace and
	// collections services share the same file with independent connection
	// pools.
	dsn := fmt.Sprintf("file:%s?_pragma=busy_timeout(5000)", dbPath)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("open sqlite database: %w", err)
	}

	repo := &Repository{db: db}
	if err := repo.initSchema(); err != nil {
		_ = db.Close()
		return nil, err
	}

	return repo, nil
}

func (r *Repository) Close() error {
	if r.db == nil {
		return nil
	}

	return r.db.Close()
}

func (r *Repository) initSchema() error {
	if _, err := r.db.Exec(`PRAGMA foreign_keys = ON`); err != nil {
		return fmt.Errorf("enable foreign keys: %w", err)
	}

	statements := []string{
		`CREATE TABLE IF NOT EXISTS collections (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS folders (
			id TEXT PRIMARY KEY,
			collection_id TEXT NOT NULL,
			parent_folder_id TEXT,
			name TEXT NOT NULL,
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
			FOREIGN KEY(parent_folder_id) REFERENCES folders(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS saved_requests (
			id TEXT PRIMARY KEY,
			collection_id TEXT NOT NULL,
			folder_id TEXT,
			name TEXT NOT NULL,
			method TEXT NOT NULL,
			url TEXT NOT NULL,
			body TEXT NOT NULL DEFAULT '',
			pre_request_script TEXT NOT NULL DEFAULT '',
			post_response_script TEXT NOT NULL DEFAULT '',
			auth_type TEXT NOT NULL DEFAULT 'none',
			bearer_token TEXT NOT NULL DEFAULT '',
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
			FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE SET NULL
		)`,
		`CREATE TABLE IF NOT EXISTS saved_request_headers (
			id TEXT PRIMARY KEY,
			saved_request_id TEXT NOT NULL,
			position INTEGER NOT NULL,
			key_name TEXT NOT NULL,
			value TEXT NOT NULL,
			enabled INTEGER NOT NULL,
			FOREIGN KEY(saved_request_id) REFERENCES saved_requests(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS saved_request_query_params (
			id TEXT PRIMARY KEY,
			saved_request_id TEXT NOT NULL,
			position INTEGER NOT NULL,
			key_name TEXT NOT NULL,
			value TEXT NOT NULL,
			enabled INTEGER NOT NULL,
			FOREIGN KEY(saved_request_id) REFERENCES saved_requests(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS saved_request_path_params (
			id TEXT PRIMARY KEY,
			saved_request_id TEXT NOT NULL,
			position INTEGER NOT NULL,
			key_name TEXT NOT NULL,
			value TEXT NOT NULL,
			enabled INTEGER NOT NULL,
			FOREIGN KEY(saved_request_id) REFERENCES saved_requests(id) ON DELETE CASCADE
		)`,
	}

	for _, statement := range statements {
		if _, err := r.db.Exec(statement); err != nil {
			return fmt.Errorf("apply collections schema statement: %w", err)
		}
	}

	// `body_meta_json` mirrors the structured body extras stored on the
	// workspace `request_tabs` table — populated when the request body
	// editor gained general modes (none/form/file/graphql). Legacy
	// `body` is preserved so older saves continue to read back as text.
	if err := r.ensureColumnExists(
		"saved_requests",
		"body_meta_json",
		`ALTER TABLE saved_requests ADD COLUMN body_meta_json TEXT NOT NULL DEFAULT ''`,
	); err != nil {
		return err
	}

	if err := r.ensureColumnExists(
		"collections",
		"auth_type",
		`ALTER TABLE collections ADD COLUMN auth_type TEXT NOT NULL DEFAULT 'none'`,
	); err != nil {
		return err
	}
	if err := r.ensureColumnExists(
		"collections",
		"bearer_token",
		`ALTER TABLE collections ADD COLUMN bearer_token TEXT NOT NULL DEFAULT ''`,
	); err != nil {
		return err
	}

	now := time.Now().UnixMilli()
	if _, err := r.db.Exec(
		`INSERT OR IGNORE INTO collections (id, name, description, sort_order, created_at, updated_at) VALUES (?, ?, '', 0, ?, ?)`,
		defaultCollectionID,
		defaultCollectionName,
		now,
		now,
	); err != nil {
		return fmt.Errorf("ensure default collection: %w", err)
	}

	if _, err := r.db.Exec(`UPDATE folders SET parent_folder_id = NULL WHERE parent_folder_id IS NOT NULL`); err != nil {
		return fmt.Errorf("flatten nested folders: %w", err)
	}

	return nil
}

func (r *Repository) LoadAllCollections() ([]api.CollectionTreePayload, error) {
	collections := make([]api.CollectionTreePayload, 0)

	rows, err := r.db.Query(`
		SELECT id, name, description, sort_order, auth_type, bearer_token, created_at, updated_at
		FROM collections
		ORDER BY sort_order ASC, created_at ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("query collections: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var tree api.CollectionTreePayload
		if err := rows.Scan(
			&tree.Collection.ID,
			&tree.Collection.Name,
			&tree.Collection.Description,
			&tree.Collection.SortOrder,
			&tree.Collection.Auth.Type,
			&tree.Collection.Auth.BearerToken,
			&tree.Collection.CreatedAt,
			&tree.Collection.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan collection: %w", err)
		}

		folders, err := r.loadFolders(tree.Collection.ID)
		if err != nil {
			return nil, err
		}
		requests, err := r.loadSavedRequests(tree.Collection.ID)
		if err != nil {
			return nil, err
		}

		tree.Folders = folders
		tree.SavedRequests = requests
		collections = append(collections, tree)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate collections: %w", err)
	}

	return collections, nil
}

func (r *Repository) CreateCollection(input api.CreateCollectionInput) (api.CollectionPayload, error) {
	now := time.Now().UnixMilli()
	collection := api.CollectionPayload{
		ID:          newID(),
		Name:        input.Name,
		Description: input.Description,
		SortOrder:   r.nextSortOrder("collections", "1=1"),
		Auth:        api.RequestAuthPayload{Type: "none", BearerToken: ""},
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	_, err := r.db.Exec(
		`INSERT INTO collections (id, name, description, sort_order, auth_type, bearer_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		collection.ID,
		collection.Name,
		collection.Description,
		collection.SortOrder,
		collection.Auth.Type,
		collection.Auth.BearerToken,
		collection.CreatedAt,
		collection.UpdatedAt,
	)
	if err != nil {
		return api.CollectionPayload{}, fmt.Errorf("insert collection: %w", err)
	}

	return collection, nil
}

func (r *Repository) UpdateCollectionAuth(input api.UpdateCollectionAuthInput) (api.CollectionPayload, error) {
	authType := strings.TrimSpace(input.Auth.Type)
	if authType == "" {
		authType = "none"
	}
	if authType == "inherited" {
		return api.CollectionPayload{}, errors.New("collection auth cannot be inherited")
	}

	now := time.Now().UnixMilli()
	result, err := r.db.Exec(
		`UPDATE collections SET auth_type = ?, bearer_token = ?, updated_at = ? WHERE id = ?`,
		authType,
		input.Auth.BearerToken,
		now,
		input.ID,
	)
	if err != nil {
		return api.CollectionPayload{}, fmt.Errorf("update collection auth: %w", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return api.CollectionPayload{}, fmt.Errorf("check collection auth update: %w", err)
	}
	if affected == 0 {
		return api.CollectionPayload{}, fmt.Errorf("collection not found: %s", input.ID)
	}

	var collection api.CollectionPayload
	err = r.db.QueryRow(`
		SELECT id, name, description, sort_order, auth_type, bearer_token, created_at, updated_at
		FROM collections
		WHERE id = ?
	`, input.ID).Scan(
		&collection.ID,
		&collection.Name,
		&collection.Description,
		&collection.SortOrder,
		&collection.Auth.Type,
		&collection.Auth.BearerToken,
		&collection.CreatedAt,
		&collection.UpdatedAt,
	)
	if err != nil {
		return api.CollectionPayload{}, fmt.Errorf("load updated collection: %w", err)
	}

	return collection, nil
}

func (r *Repository) ImportTree(tree api.CollectionTreePayload) (api.CollectionTreePayload, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return api.CollectionTreePayload{}, fmt.Errorf("begin import transaction: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	now := time.Now().UnixMilli()
	collection := tree.Collection
	if strings.TrimSpace(collection.ID) == "" {
		collection.ID = newID()
	}
	collection.SortOrder = r.nextSortOrder("collections", "1=1")
	collection.CreatedAt = now
	collection.UpdatedAt = now
	if strings.TrimSpace(collection.Auth.Type) == "" {
		collection.Auth.Type = "none"
	}
	if collection.Auth.Type == "inherited" {
		collection.Auth.Type = "none"
	}

	_, err = tx.Exec(
		`INSERT INTO collections (id, name, description, sort_order, auth_type, bearer_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		collection.ID,
		collection.Name,
		collection.Description,
		collection.SortOrder,
		collection.Auth.Type,
		collection.Auth.BearerToken,
		collection.CreatedAt,
		collection.UpdatedAt,
	)
	if err != nil {
		return api.CollectionTreePayload{}, fmt.Errorf("insert imported collection: %w", err)
	}

	imported := api.CollectionTreePayload{
		Collection:    collection,
		Folders:       make([]api.FolderPayload, 0, len(tree.Folders)),
		SavedRequests: make([]api.SavedRequestPayload, 0, len(tree.SavedRequests)),
	}

	for index, folder := range tree.Folders {
		if strings.TrimSpace(folder.ID) == "" {
			folder.ID = newID()
		}
		folder.CollectionID = collection.ID
		folder.ParentFolderID = nil
		folder.SortOrder = index
		folder.CreatedAt = now
		folder.UpdatedAt = now

		_, err = tx.Exec(
			`INSERT INTO folders (id, collection_id, parent_folder_id, name, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			folder.ID,
			folder.CollectionID,
			folder.ParentFolderID,
			folder.Name,
			folder.SortOrder,
			folder.CreatedAt,
			folder.UpdatedAt,
		)
		if err != nil {
			return api.CollectionTreePayload{}, fmt.Errorf("insert imported folder: %w", err)
		}
		imported.Folders = append(imported.Folders, folder)
	}

	for index, request := range tree.SavedRequests {
		request.CollectionID = collection.ID
		request.SortOrder = index
		saved, saveErr := r.saveRequestTx(tx, request)
		if saveErr != nil {
			err = saveErr
			return api.CollectionTreePayload{}, saveErr
		}
		imported.SavedRequests = append(imported.SavedRequests, saved)
	}

	if err = tx.Commit(); err != nil {
		return api.CollectionTreePayload{}, fmt.Errorf("commit import transaction: %w", err)
	}

	return imported, nil
}

func (r *Repository) saveRequestTx(
	tx *sql.Tx,
	payload api.SavedRequestPayload,
) (api.SavedRequestPayload, error) {
	now := time.Now().UnixMilli()
	if strings.TrimSpace(payload.ID) == "" {
		payload.ID = newID()
	}
	payload.CreatedAt = now
	payload.UpdatedAt = now
	if strings.TrimSpace(payload.Auth.Type) == "" {
		payload.Auth.Type = "none"
	}

	bodyMetaJSON, err := api.MarshalBodyMeta(bodyMetaFromSavedRequest(payload))
	if err != nil {
		return api.SavedRequestPayload{}, fmt.Errorf("marshal body meta: %w", err)
	}

	_, err = tx.Exec(
		`INSERT INTO saved_requests (id, collection_id, folder_id, name, method, url, body, body_meta_json, pre_request_script, post_response_script, auth_type, bearer_token, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		payload.ID,
		payload.CollectionID,
		payload.FolderID,
		payload.Name,
		payload.Method,
		payload.URL,
		payload.Body,
		bodyMetaJSON,
		payload.PreRequestScript,
		payload.PostResponseScript,
		payload.Auth.Type,
		payload.Auth.BearerToken,
		payload.SortOrder,
		payload.CreatedAt,
		payload.UpdatedAt,
	)
	if err != nil {
		return api.SavedRequestPayload{}, fmt.Errorf("insert imported request: %w", err)
	}

	if err := r.replaceRequestRowsTx(tx, "saved_request_headers", payload.ID, payload.Headers); err != nil {
		return api.SavedRequestPayload{}, err
	}
	if err := r.replaceRequestRowsTx(tx, "saved_request_query_params", payload.ID, payload.QueryParams); err != nil {
		return api.SavedRequestPayload{}, err
	}
	if err := r.replaceRequestRowsTx(tx, "saved_request_path_params", payload.ID, payload.PathParams); err != nil {
		return api.SavedRequestPayload{}, err
	}

	return payload, nil
}

func (r *Repository) replaceRequestRowsTx(
	tx *sql.Tx,
	table string,
	requestID string,
	rows []api.KeyValuePayload,
) error {
	if _, err := tx.Exec(fmt.Sprintf(`DELETE FROM %s WHERE saved_request_id = ?`, table), requestID); err != nil {
		return fmt.Errorf("clear %s rows: %w", table, err)
	}

	for index, row := range rows {
		if strings.TrimSpace(row.ID) == "" {
			row.ID = newID()
		}
		if _, err := tx.Exec(
			fmt.Sprintf(`INSERT INTO %s (id, saved_request_id, position, key_name, value, enabled) VALUES (?, ?, ?, ?, ?, ?)`, table),
			row.ID,
			requestID,
			index,
			row.Key,
			row.Value,
			boolToInt(row.Enabled),
		); err != nil {
			return fmt.Errorf("insert %s row: %w", table, err)
		}
	}

	return nil
}

func (r *Repository) RenameCollection(input api.RenameCollectionInput) error {
	_, err := r.db.Exec(
		`UPDATE collections SET name = ?, updated_at = ? WHERE id = ?`,
		input.Name,
		time.Now().UnixMilli(),
		input.ID,
	)
	if err != nil {
		return fmt.Errorf("rename collection: %w", err)
	}
	return nil
}

func (r *Repository) DeleteCollection(id string) error {
	if _, err := r.db.Exec(`DELETE FROM collections WHERE id = ?`, id); err != nil {
		return fmt.Errorf("delete collection: %w", err)
	}
	return nil
}

func (r *Repository) CreateFolder(input api.CreateFolderInput) (api.FolderPayload, error) {
	if input.ParentFolderID != nil {
		return api.FolderPayload{}, errors.New("nested folders are not supported")
	}

	now := time.Now().UnixMilli()
	folder := api.FolderPayload{
		ID:             newID(),
		CollectionID:   input.CollectionID,
		ParentFolderID: input.ParentFolderID,
		Name:           input.Name,
		// With max depth enforced, folder sort order is scoped to the collection root.
		SortOrder: r.nextSortOrder("folders", "collection_id = ? AND parent_folder_id IS NULL", input.CollectionID),
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	_, err := r.db.Exec(
		`INSERT INTO folders (id, collection_id, parent_folder_id, name, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		folder.ID, folder.CollectionID, folder.ParentFolderID, folder.Name, folder.SortOrder, folder.CreatedAt, folder.UpdatedAt,
	)
	if err != nil {
		return api.FolderPayload{}, fmt.Errorf("create folder: %w", err)
	}
	return folder, nil
}

func (r *Repository) RenameFolder(input api.RenameFolderInput) error {
	_, err := r.db.Exec(`UPDATE folders SET name = ?, updated_at = ? WHERE id = ?`, input.Name, time.Now().UnixMilli(), input.ID)
	if err != nil {
		return fmt.Errorf("rename folder: %w", err)
	}
	return nil
}

func (r *Repository) MoveFolder(input api.MoveFolderInput) error {
	if input.NewParentFolderID != nil {
		return errors.New("nested folders are not supported")
	}

	_, err := r.db.Exec(
		`UPDATE folders SET parent_folder_id = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
		input.NewParentFolderID,
		input.NewSortOrder,
		time.Now().UnixMilli(),
		input.ID,
	)
	if err != nil {
		return fmt.Errorf("move folder: %w", err)
	}
	return nil
}

func (r *Repository) RenameRequest(id string, name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return errors.New("request name cannot be empty")
	}

	result, err := r.db.Exec(
		`UPDATE saved_requests SET name = ?, updated_at = ? WHERE id = ?`,
		name,
		time.Now().UnixMilli(),
		id,
	)
	if err != nil {
		return fmt.Errorf("rename saved request: %w", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("check rename affected rows: %w", err)
	}
	if affected == 0 {
		return fmt.Errorf("saved request not found: %s", id)
	}

	return nil
}

func (r *Repository) DuplicateRequest(id string) (api.SavedRequestPayload, error) {
	request, err := r.loadSavedRequestByID(id)
	if err != nil {
		return api.SavedRequestPayload{}, err
	}

	now := time.Now().UnixMilli()
	request.ID = ""
	request.Name = request.Name + " Copy"
	request.CreatedAt = now
	request.UpdatedAt = now

	return r.SaveRequest(request)
}

func (r *Repository) DeleteFolder(id string) error {
	if _, err := r.db.Exec(`DELETE FROM folders WHERE id = ?`, id); err != nil {
		return fmt.Errorf("delete folder: %w", err)
	}
	return nil
}

func (r *Repository) SaveRequest(payload api.SavedRequestPayload) (api.SavedRequestPayload, error) {
	now := time.Now().UnixMilli()
	isCreate := payload.ID == ""
	if isCreate {
		payload.ID = newID()
		payload.CreatedAt = now
		payload.SortOrder = r.nextSortOrder("saved_requests", "collection_id = ?", payload.CollectionID)
	}
	payload.UpdatedAt = now

	tx, err := r.db.Begin()
	if err != nil {
		return api.SavedRequestPayload{}, fmt.Errorf("begin transaction: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	bodyMetaJSON, err := api.MarshalBodyMeta(bodyMetaFromSavedRequest(payload))
	if err != nil {
		return api.SavedRequestPayload{}, fmt.Errorf("marshal body meta: %w", err)
	}

	if isCreate {
		_, err = tx.Exec(
			`INSERT INTO saved_requests (id, collection_id, folder_id, name, method, url, body, body_meta_json, pre_request_script, post_response_script, auth_type, bearer_token, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			payload.ID, payload.CollectionID, payload.FolderID, payload.Name, payload.Method, payload.URL, payload.Body, bodyMetaJSON,
			payload.PreRequestScript, payload.PostResponseScript, payload.Auth.Type, payload.Auth.BearerToken,
			payload.SortOrder, payload.CreatedAt, payload.UpdatedAt,
		)
	} else {
		_, err = tx.Exec(
			`UPDATE saved_requests
			 SET collection_id = ?, folder_id = ?, name = ?, method = ?, url = ?, body = ?, body_meta_json = ?, pre_request_script = ?, post_response_script = ?, auth_type = ?, bearer_token = ?, sort_order = CASE WHEN ? < 0 THEN sort_order ELSE ? END, updated_at = ?
			 WHERE id = ?`,
			payload.CollectionID, payload.FolderID, payload.Name, payload.Method, payload.URL, payload.Body, bodyMetaJSON,
			payload.PreRequestScript, payload.PostResponseScript, payload.Auth.Type, payload.Auth.BearerToken,
			payload.SortOrder, payload.SortOrder, payload.UpdatedAt, payload.ID,
		)
	}
	if err != nil {
		return api.SavedRequestPayload{}, fmt.Errorf("upsert saved request: %w", err)
	}

	if _, err = tx.Exec(`DELETE FROM saved_request_headers WHERE saved_request_id = ?`, payload.ID); err != nil {
		return api.SavedRequestPayload{}, fmt.Errorf("clear saved request headers: %w", err)
	}
	if _, err = tx.Exec(`DELETE FROM saved_request_query_params WHERE saved_request_id = ?`, payload.ID); err != nil {
		return api.SavedRequestPayload{}, fmt.Errorf("clear saved request query params: %w", err)
	}
	if _, err = tx.Exec(`DELETE FROM saved_request_path_params WHERE saved_request_id = ?`, payload.ID); err != nil {
		return api.SavedRequestPayload{}, fmt.Errorf("clear saved request path params: %w", err)
	}

	for index, header := range payload.Headers {
		headerID := header.ID
		if headerID == "" {
			headerID = newID()
		}
		if _, err = tx.Exec(
			`INSERT INTO saved_request_headers (id, saved_request_id, position, key_name, value, enabled) VALUES (?, ?, ?, ?, ?, ?)`,
			headerID, payload.ID, index, header.Key, header.Value, boolToInt(header.Enabled),
		); err != nil {
			return api.SavedRequestPayload{}, fmt.Errorf("insert saved request header: %w", err)
		}
	}

	for index, param := range payload.QueryParams {
		paramID := param.ID
		if paramID == "" {
			paramID = newID()
		}
		if _, err = tx.Exec(
			`INSERT INTO saved_request_query_params (id, saved_request_id, position, key_name, value, enabled) VALUES (?, ?, ?, ?, ?, ?)`,
			paramID, payload.ID, index, param.Key, param.Value, boolToInt(param.Enabled),
		); err != nil {
			return api.SavedRequestPayload{}, fmt.Errorf("insert saved request param: %w", err)
		}
	}

	for index, param := range payload.PathParams {
		paramID := param.ID
		if paramID == "" {
			paramID = newID()
		}
		if _, err = tx.Exec(
			`INSERT INTO saved_request_path_params (id, saved_request_id, position, key_name, value, enabled) VALUES (?, ?, ?, ?, ?, ?)`,
			paramID, payload.ID, index, param.Key, param.Value, boolToInt(param.Enabled),
		); err != nil {
			return api.SavedRequestPayload{}, fmt.Errorf("insert saved request path param: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return api.SavedRequestPayload{}, fmt.Errorf("commit save request transaction: %w", err)
	}

	return payload, nil
}

func (r *Repository) MoveRequest(input api.MoveSavedRequestInput) error {
	_, err := r.db.Exec(
		`UPDATE saved_requests SET folder_id = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
		input.NewFolderID,
		input.NewSortOrder,
		time.Now().UnixMilli(),
		input.ID,
	)
	if err != nil {
		return fmt.Errorf("move saved request: %w", err)
	}
	return nil
}

// ReorderRequests applies an ordered batch of folder/sortOrder updates inside
// a single SQL transaction. This avoids the SQLITE_BUSY contention that would
// otherwise happen if the frontend issued many parallel MoveRequest calls.
func (r *Repository) ReorderRequests(input api.ReorderSavedRequestsInput) error {
	if len(input.Items) == 0 {
		return nil
	}

	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin reorder transaction: %w", err)
	}

	stmt, err := tx.Prepare(
		`UPDATE saved_requests SET folder_id = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
	)
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("prepare reorder statement: %w", err)
	}

	now := time.Now().UnixMilli()
	for _, item := range input.Items {
		if _, err := stmt.Exec(item.NewFolderID, item.NewSortOrder, now, item.ID); err != nil {
			_ = stmt.Close()
			_ = tx.Rollback()
			return fmt.Errorf("reorder saved request %s: %w", item.ID, err)
		}
	}

	if err := stmt.Close(); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("close reorder statement: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit reorder transaction: %w", err)
	}
	return nil
}

func (r *Repository) DeleteRequest(id string) error {
	if _, err := r.db.Exec(`DELETE FROM saved_requests WHERE id = ?`, id); err != nil {
		return fmt.Errorf("delete saved request: %w", err)
	}
	return nil
}

func (r *Repository) loadSavedRequestByID(id string) (api.SavedRequestPayload, error) {
	var request api.SavedRequestPayload
	var bodyMetaJSON string
	err := r.db.QueryRow(`
		SELECT id, collection_id, folder_id, name, method, url, body, body_meta_json, pre_request_script, post_response_script, auth_type, bearer_token, sort_order, created_at, updated_at
		FROM saved_requests
		WHERE id = ?
	`, id).Scan(
		&request.ID, &request.CollectionID, &request.FolderID, &request.Name, &request.Method, &request.URL, &request.Body, &bodyMetaJSON,
		&request.PreRequestScript, &request.PostResponseScript, &request.Auth.Type, &request.Auth.BearerToken,
		&request.SortOrder, &request.CreatedAt, &request.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return api.SavedRequestPayload{}, fmt.Errorf("saved request not found: %s", id)
		}
		return api.SavedRequestPayload{}, fmt.Errorf("query saved request: %w", err)
	}

	meta, err := api.UnmarshalBodyMeta(bodyMetaJSON)
	if err != nil {
		return api.SavedRequestPayload{}, fmt.Errorf("unmarshal body meta: %w", err)
	}
	applyBodyMetaToSavedRequest(&request, meta)

	headers, err := r.loadRequestRows("saved_request_headers", request.ID)
	if err != nil {
		return api.SavedRequestPayload{}, err
	}
	params, err := r.loadRequestRows("saved_request_query_params", request.ID)
	if err != nil {
		return api.SavedRequestPayload{}, err
	}
	pathParams, err := r.loadRequestRows("saved_request_path_params", request.ID)
	if err != nil {
		return api.SavedRequestPayload{}, err
	}
	request.Headers = headers
	request.QueryParams = params
	request.PathParams = pathParams

	return request, nil
}

func (r *Repository) loadFolders(collectionID string) ([]api.FolderPayload, error) {
	rows, err := r.db.Query(`
		SELECT id, collection_id, parent_folder_id, name, sort_order, created_at, updated_at
		FROM folders
		WHERE collection_id = ?
		ORDER BY sort_order ASC, created_at ASC
	`, collectionID)
	if err != nil {
		return nil, fmt.Errorf("query folders: %w", err)
	}
	defer rows.Close()

	folders := make([]api.FolderPayload, 0)
	for rows.Next() {
		var folder api.FolderPayload
		if err := rows.Scan(
			&folder.ID, &folder.CollectionID, &folder.ParentFolderID, &folder.Name,
			&folder.SortOrder, &folder.CreatedAt, &folder.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan folder: %w", err)
		}
		folders = append(folders, folder)
	}
	return folders, rows.Err()
}

func (r *Repository) loadSavedRequests(collectionID string) ([]api.SavedRequestPayload, error) {
	rows, err := r.db.Query(`
		SELECT id, collection_id, folder_id, name, method, url, body, body_meta_json, pre_request_script, post_response_script, auth_type, bearer_token, sort_order, created_at, updated_at
		FROM saved_requests
		WHERE collection_id = ?
		ORDER BY sort_order ASC, created_at ASC
	`, collectionID)
	if err != nil {
		return nil, fmt.Errorf("query saved requests: %w", err)
	}
	defer rows.Close()

	requests := make([]api.SavedRequestPayload, 0)
	for rows.Next() {
		var request api.SavedRequestPayload
		var bodyMetaJSON string
		if err := rows.Scan(
			&request.ID, &request.CollectionID, &request.FolderID, &request.Name, &request.Method, &request.URL, &request.Body, &bodyMetaJSON,
			&request.PreRequestScript, &request.PostResponseScript, &request.Auth.Type, &request.Auth.BearerToken,
			&request.SortOrder, &request.CreatedAt, &request.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan saved request: %w", err)
		}

		meta, err := api.UnmarshalBodyMeta(bodyMetaJSON)
		if err != nil {
			return nil, fmt.Errorf("unmarshal body meta: %w", err)
		}
		applyBodyMetaToSavedRequest(&request, meta)

		headers, err := r.loadRequestRows("saved_request_headers", request.ID)
		if err != nil {
			return nil, err
		}
		params, err := r.loadRequestRows("saved_request_query_params", request.ID)
		if err != nil {
			return nil, err
		}
		pathParams, err := r.loadRequestRows("saved_request_path_params", request.ID)
		if err != nil {
			return nil, err
		}
		request.Headers = headers
		request.QueryParams = params
		request.PathParams = pathParams
		requests = append(requests, request)
	}
	return requests, rows.Err()
}

func (r *Repository) loadRequestRows(table string, requestID string) ([]api.KeyValuePayload, error) {
	rows, err := r.db.Query(
		fmt.Sprintf(`SELECT id, key_name, value, enabled FROM %s WHERE saved_request_id = ? ORDER BY position ASC`, table),
		requestID,
	)
	if err != nil {
		return nil, fmt.Errorf("query request rows: %w", err)
	}
	defer rows.Close()

	result := make([]api.KeyValuePayload, 0)
	for rows.Next() {
		var item api.KeyValuePayload
		var enabled int
		if err := rows.Scan(&item.ID, &item.Key, &item.Value, &enabled); err != nil {
			return nil, fmt.Errorf("scan request row: %w", err)
		}
		item.Enabled = enabled == 1
		result = append(result, item)
	}
	return result, rows.Err()
}

// bodyMetaFromSavedRequest mirrors the workspace repository helper. We
// keep these as small, type-local functions so each package owns its own
// translation between API payload and the shared BodyMetaPayload blob.
func bodyMetaFromSavedRequest(request api.SavedRequestPayload) api.BodyMetaPayload {
	return api.BodyMetaPayload{
		BodyMode:         request.BodyMode,
		BodyContentType:  request.BodyContentType,
		FormSubtype:      request.FormSubtype,
		FormFields:       request.FormFields,
		FileContentType:  request.FileContentType,
		FileBody:         request.FileBody,
		GraphQLQuery:     request.GraphQLQuery,
		GraphQLVariables: request.GraphQLVariables,
	}
}

func applyBodyMetaToSavedRequest(request *api.SavedRequestPayload, meta api.BodyMetaPayload) {
	request.BodyMode = meta.BodyMode
	request.BodyContentType = meta.BodyContentType
	request.FormSubtype = meta.FormSubtype
	request.FormFields = meta.FormFields
	if request.FormFields == nil {
		request.FormFields = []api.FormBodyFieldPayload{}
	}
	request.FileContentType = meta.FileContentType
	request.FileBody = meta.FileBody
	request.GraphQLQuery = meta.GraphQLQuery
	request.GraphQLVariables = meta.GraphQLVariables

	if request.BodyMode == "" {
		if request.Body != "" {
			request.BodyMode = api.BodyModeText
		} else {
			request.BodyMode = api.BodyModeNone
		}
	}
	if request.BodyContentType == "" {
		request.BodyContentType = "application/json"
	}
	if request.FormSubtype == "" {
		request.FormSubtype = api.FormSubtypeURLEncoded
	}
	if request.FileContentType == "" {
		request.FileContentType = "application/octet-stream"
	}
}

func (r *Repository) nextSortOrder(table string, whereClause string, args ...any) int {
	query := fmt.Sprintf("SELECT COALESCE(MAX(sort_order), -1) + 1 FROM %s WHERE %s", table, whereClause)
	var value int
	if err := r.db.QueryRow(query, args...).Scan(&value); err != nil {
		return 0
	}
	return value
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

// ensureColumnExists adds `column` to `table` if it isn't already
// present. Used for incremental schema migrations that can't piggy-back
// off `CREATE TABLE IF NOT EXISTS`.
func (r *Repository) ensureColumnExists(
	table string,
	column string,
	addColumnStatement string,
) error {
	rows, err := r.db.Query(fmt.Sprintf(`PRAGMA table_info(%s)`, table))
	if err != nil {
		return fmt.Errorf("read table info for %s: %w", table, err)
	}
	defer rows.Close()

	for rows.Next() {
		var cid int
		var name string
		var columnType string
		var notNull int
		var defaultValue sql.NullString
		var primaryKey int
		if err := rows.Scan(&cid, &name, &columnType, &notNull, &defaultValue, &primaryKey); err != nil {
			return fmt.Errorf("scan table info row for %s: %w", table, err)
		}
		if name == column {
			return nil
		}
	}

	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate table info for %s: %w", table, err)
	}

	if _, err := r.db.Exec(addColumnStatement); err != nil {
		return fmt.Errorf("add missing column %s.%s: %w", table, column, err)
	}

	return nil
}

func newID() string {
	buffer := make([]byte, 10)
	if _, err := rand.Read(buffer); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(buffer)
}
