package workspace

import (
	"database/sql"
	"dispo/backend/api"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

type Repository struct {
	db *sql.DB
}

const (
	defaultCollectionID = "default-collection"
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

	schemaStatements := []string{
		`CREATE TABLE IF NOT EXISTS workspace_meta (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			active_tab_id TEXT NOT NULL DEFAULT '',
			tab_order_by_collection_json TEXT NOT NULL DEFAULT '{}',
			active_tab_by_collection_json TEXT NOT NULL DEFAULT '{}',
			current_collection_id TEXT NOT NULL DEFAULT '` + defaultCollectionID + `',
			active_environment_id TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS request_tabs (
			id TEXT PRIMARY KEY,
			collection_id TEXT NOT NULL DEFAULT '` + defaultCollectionID + `',
			saved_request_id TEXT,
			layout TEXT NOT NULL,
			protocol TEXT NOT NULL,
			title TEXT NOT NULL,
			method TEXT NOT NULL,
			url TEXT NOT NULL,
			body TEXT NOT NULL,
			auth_type TEXT NOT NULL DEFAULT 'none',
			bearer_token TEXT NOT NULL DEFAULT '',
			response_json TEXT NOT NULL DEFAULT '',
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
			FOREIGN KEY(saved_request_id) REFERENCES saved_requests(id) ON DELETE SET NULL
		)`,
		`CREATE TABLE IF NOT EXISTS request_headers (
			id TEXT PRIMARY KEY,
			tab_id TEXT NOT NULL,
			position INTEGER NOT NULL,
			key_name TEXT NOT NULL,
			value TEXT NOT NULL,
			enabled INTEGER NOT NULL,
			FOREIGN KEY(tab_id) REFERENCES request_tabs(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS request_params (
			id TEXT PRIMARY KEY,
			tab_id TEXT NOT NULL,
			position INTEGER NOT NULL,
			key_name TEXT NOT NULL,
			value TEXT NOT NULL,
			enabled INTEGER NOT NULL,
			FOREIGN KEY(tab_id) REFERENCES request_tabs(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS environments (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			position INTEGER NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS environment_variables (
			id TEXT PRIMARY KEY,
			environment_id TEXT NOT NULL,
			position INTEGER NOT NULL,
			key_name TEXT NOT NULL,
			value TEXT NOT NULL,
			enabled INTEGER NOT NULL,
			FOREIGN KEY(environment_id) REFERENCES environments(id) ON DELETE CASCADE
		)`,
		`INSERT OR IGNORE INTO workspace_meta (id, active_tab_id, active_environment_id) VALUES (1, '', '')`,
	}

	for _, statement := range schemaStatements {
		if _, err := r.db.Exec(statement); err != nil {
			return fmt.Errorf("apply schema statement: %w", err)
		}
	}

	if err := r.ensureColumnExists(
		"request_tabs",
		"response_json",
		`ALTER TABLE request_tabs ADD COLUMN response_json TEXT NOT NULL DEFAULT ''`,
	); err != nil {
		return err
	}
	if err := r.ensureColumnExists(
		"request_tabs",
		"pre_request_script",
		`ALTER TABLE request_tabs ADD COLUMN pre_request_script TEXT NOT NULL DEFAULT ''`,
	); err != nil {
		return err
	}
	if err := r.ensureColumnExists(
		"request_tabs",
		"post_response_script",
		`ALTER TABLE request_tabs ADD COLUMN post_response_script TEXT NOT NULL DEFAULT ''`,
	); err != nil {
		return err
	}
	if err := r.ensureColumnExists(
		"request_tabs",
		"collection_id",
		`ALTER TABLE request_tabs ADD COLUMN collection_id TEXT NOT NULL DEFAULT '`+defaultCollectionID+`'`,
	); err != nil {
		return err
	}
	if err := r.ensureColumnExists(
		"request_tabs",
		"saved_request_id",
		`ALTER TABLE request_tabs ADD COLUMN saved_request_id TEXT`,
	); err != nil {
		return err
	}
	if err := r.ensureColumnExists(
		"workspace_meta",
		"tab_order_by_collection_json",
		`ALTER TABLE workspace_meta ADD COLUMN tab_order_by_collection_json TEXT NOT NULL DEFAULT '{}'`,
	); err != nil {
		return err
	}
	if err := r.ensureColumnExists(
		"workspace_meta",
		"active_tab_by_collection_json",
		`ALTER TABLE workspace_meta ADD COLUMN active_tab_by_collection_json TEXT NOT NULL DEFAULT '{}'`,
	); err != nil {
		return err
	}
	if err := r.ensureColumnExists(
		"workspace_meta",
		"current_collection_id",
		`ALTER TABLE workspace_meta ADD COLUMN current_collection_id TEXT NOT NULL DEFAULT '`+defaultCollectionID+`'`,
	); err != nil {
		return err
	}
	if _, err := r.db.Exec(
		`UPDATE workspace_meta
		 SET tab_order_by_collection_json = COALESCE(NULLIF(tab_order_by_collection_json, ''), '{}'),
		     active_tab_by_collection_json = COALESCE(NULLIF(active_tab_by_collection_json, ''), '{}'),
		     current_collection_id = COALESCE(NULLIF(current_collection_id, ''), ?)
		 WHERE id = 1`,
		defaultCollectionID,
	); err != nil {
		return fmt.Errorf("normalize workspace_meta defaults: %w", err)
	}
	if _, err := r.db.Exec(
		`UPDATE request_tabs SET collection_id = ? WHERE collection_id IS NULL OR collection_id = ''`,
		defaultCollectionID,
	); err != nil {
		return fmt.Errorf("assign default collection: %w", err)
	}
	if err := r.ensureRequestTabsForeignKeys(); err != nil {
		return err
	}

	return nil
}

func (r *Repository) SaveState(state api.WorkspaceStatePayload) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	if _, err = tx.Exec(`DELETE FROM request_headers`); err != nil {
		return fmt.Errorf("clear headers: %w", err)
	}
	if _, err = tx.Exec(`DELETE FROM request_params`); err != nil {
		return fmt.Errorf("clear params: %w", err)
	}
	if _, err = tx.Exec(`DELETE FROM request_tabs`); err != nil {
		return fmt.Errorf("clear tabs: %w", err)
	}
	if _, err = tx.Exec(`DELETE FROM environment_variables`); err != nil {
		return fmt.Errorf("clear environment variables: %w", err)
	}
	if _, err = tx.Exec(`DELETE FROM environments`); err != nil {
		return fmt.Errorf("clear environments: %w", err)
	}

	for _, tab := range state.Tabs {
		responseJSON, marshalErr := marshalResponse(tab.Response)
		if marshalErr != nil {
			return fmt.Errorf("marshal response for tab %s: %w", tab.ID, marshalErr)
		}

		if _, err = tx.Exec(
			`INSERT INTO request_tabs (
				id, collection_id, saved_request_id, layout, protocol, title, method, url, body, auth_type, bearer_token, pre_request_script, post_response_script, response_json, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			tab.ID,
			tab.CollectionID,
			tab.SavedRequestID,
			tab.Layout,
			tab.Protocol,
			tab.Title,
			tab.Method,
			tab.URL,
			tab.Body,
			tab.Auth.Type,
			tab.Auth.BearerToken,
			tab.PreRequestScript,
			tab.PostResponseScript,
			responseJSON,
			tab.CreatedAt,
			tab.UpdatedAt,
		); err != nil {
			return fmt.Errorf("insert tab %s: %w", tab.ID, err)
		}

		for index, header := range tab.Headers {
			if _, err = tx.Exec(
				`INSERT INTO request_headers (id, tab_id, position, key_name, value, enabled) VALUES (?, ?, ?, ?, ?, ?)`,
				header.ID,
				tab.ID,
				index,
				header.Key,
				header.Value,
				boolToInt(header.Enabled),
			); err != nil {
				return fmt.Errorf("insert header %s: %w", header.ID, err)
			}
		}

		for index, param := range tab.QueryParams {
			if _, err = tx.Exec(
				`INSERT INTO request_params (id, tab_id, position, key_name, value, enabled) VALUES (?, ?, ?, ?, ?, ?)`,
				param.ID,
				tab.ID,
				index,
				param.Key,
				param.Value,
				boolToInt(param.Enabled),
			); err != nil {
				return fmt.Errorf("insert param %s: %w", param.ID, err)
			}
		}
	}

	for index, environment := range state.Environments {
		if _, err = tx.Exec(
			`INSERT INTO environments (id, name, position) VALUES (?, ?, ?)`,
			environment.ID,
			environment.Name,
			index,
		); err != nil {
			return fmt.Errorf("insert environment %s: %w", environment.ID, err)
		}

		for variableIndex, variable := range environment.Variables {
			if _, err = tx.Exec(
				`INSERT INTO environment_variables (id, environment_id, position, key_name, value, enabled) VALUES (?, ?, ?, ?, ?, ?)`,
				variable.ID,
				environment.ID,
				variableIndex,
				variable.Key,
				variable.Value,
				boolToInt(variable.Enabled),
			); err != nil {
				return fmt.Errorf("insert environment variable %s: %w", variable.ID, err)
			}
		}
	}

	tabOrderByCollectionJSON, marshalErr := json.Marshal(state.TabOrderByCollection)
	if marshalErr != nil {
		return fmt.Errorf("marshal tab_order_by_collection_json: %w", marshalErr)
	}
	activeTabByCollectionJSON, marshalErr := json.Marshal(state.ActiveTabIDByCollection)
	if marshalErr != nil {
		return fmt.Errorf("marshal active_tab_by_collection_json: %w", marshalErr)
	}

	if _, err = tx.Exec(
		`UPDATE workspace_meta
		 SET active_tab_id = ?, tab_order_by_collection_json = ?, active_tab_by_collection_json = ?, current_collection_id = ?, active_environment_id = ?
		 WHERE id = 1`,
		"",
		string(tabOrderByCollectionJSON),
		string(activeTabByCollectionJSON),
		state.CurrentCollectionID,
		state.ActiveEnvironmentID,
	); err != nil {
		return fmt.Errorf("update workspace meta: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}

func (r *Repository) LoadState() (api.WorkspaceStatePayload, error) {
	var state api.WorkspaceStatePayload

	var activeTabID string
	var tabOrderByCollectionJSON string
	var activeTabByCollectionJSON string
	var currentCollectionID string
	var activeEnvironmentID string
	err := r.db.QueryRow(`
		SELECT active_tab_id, tab_order_by_collection_json, active_tab_by_collection_json, current_collection_id, active_environment_id
		FROM workspace_meta WHERE id = 1
	`).Scan(&activeTabID, &tabOrderByCollectionJSON, &activeTabByCollectionJSON, &currentCollectionID, &activeEnvironmentID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return state, fmt.Errorf("read workspace meta: %w", err)
	}
	_ = activeTabID

	tabsRows, err := r.db.Query(`
		SELECT id, collection_id, saved_request_id, layout, protocol, title, method, url, body, auth_type, bearer_token, pre_request_script, post_response_script, response_json, created_at, updated_at
		FROM request_tabs
		ORDER BY created_at ASC
	`)
	if err != nil {
		return state, fmt.Errorf("query tabs: %w", err)
	}
	defer tabsRows.Close()

	tabs := make([]api.RequestTabPayload, 0)
	for tabsRows.Next() {
		var tab api.RequestTabPayload
		var responseJSON string
		if err := tabsRows.Scan(
			&tab.ID,
			&tab.CollectionID,
			&tab.SavedRequestID,
			&tab.Layout,
			&tab.Protocol,
			&tab.Title,
			&tab.Method,
			&tab.URL,
			&tab.Body,
			&tab.Auth.Type,
			&tab.Auth.BearerToken,
			&tab.PreRequestScript,
			&tab.PostResponseScript,
			&responseJSON,
			&tab.CreatedAt,
			&tab.UpdatedAt,
		); err != nil {
			return state, fmt.Errorf("scan tab: %w", err)
		}

		response, unmarshalErr := unmarshalResponse(responseJSON)
		if unmarshalErr != nil {
			return state, fmt.Errorf("unmarshal response for tab %s: %w", tab.ID, unmarshalErr)
		}
		tab.Response = response

		headers, err := r.loadKeyValueRows("request_headers", tab.ID)
		if err != nil {
			return state, fmt.Errorf("load headers for tab %s: %w", tab.ID, err)
		}
		params, err := r.loadKeyValueRows("request_params", tab.ID)
		if err != nil {
			return state, fmt.Errorf("load params for tab %s: %w", tab.ID, err)
		}

		tab.Headers = headers
		tab.QueryParams = params
		tabs = append(tabs, tab)
	}

	if err := tabsRows.Err(); err != nil {
		return state, fmt.Errorf("iterate tabs: %w", err)
	}

	envRows, err := r.db.Query(`
		SELECT id, name
		FROM environments
		ORDER BY position ASC
	`)
	if err != nil {
		return state, fmt.Errorf("query environments: %w", err)
	}
	defer envRows.Close()

	environments := make([]api.EnvironmentPayload, 0)
	for envRows.Next() {
		var environment api.EnvironmentPayload
		if err := envRows.Scan(&environment.ID, &environment.Name); err != nil {
			return state, fmt.Errorf("scan environment: %w", err)
		}

		variables, err := r.loadKeyValueRows("environment_variables", environment.ID)
		if err != nil {
			return state, fmt.Errorf("load environment variables for %s: %w", environment.ID, err)
		}
		environment.Variables = variables
		environments = append(environments, environment)
	}

	if err := envRows.Err(); err != nil {
		return state, fmt.Errorf("iterate environments: %w", err)
	}

	tabOrderByCollection := map[string][]string{}
	if tabOrderByCollectionJSON != "" {
		if err := json.Unmarshal([]byte(tabOrderByCollectionJSON), &tabOrderByCollection); err != nil {
			return state, fmt.Errorf("unmarshal tab_order_by_collection_json: %w", err)
		}
	}
	activeTabByCollection := map[string]string{}
	if activeTabByCollectionJSON != "" {
		if err := json.Unmarshal([]byte(activeTabByCollectionJSON), &activeTabByCollection); err != nil {
			return state, fmt.Errorf("unmarshal active_tab_by_collection_json: %w", err)
		}
	}
	if currentCollectionID == "" {
		currentCollectionID = defaultCollectionID
	}

	state = api.WorkspaceStatePayload{
		Tabs:                    tabs,
		TabOrderByCollection:    tabOrderByCollection,
		ActiveTabIDByCollection: activeTabByCollection,
		CurrentCollectionID:     currentCollectionID,
		Environments:            environments,
		ActiveEnvironmentID:     activeEnvironmentID,
	}

	return state, nil
}

func (r *Repository) loadKeyValueRows(table string, foreignID string) ([]api.KeyValuePayload, error) {
	rows, err := r.db.Query(
		fmt.Sprintf(
			`SELECT id, key_name, value, enabled FROM %s WHERE %s = ? ORDER BY position ASC`,
			table,
			mapTableToForeignColumn(table),
		),
		foreignID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]api.KeyValuePayload, 0)
	for rows.Next() {
		var item api.KeyValuePayload
		var enabledInt int
		if err := rows.Scan(&item.ID, &item.Key, &item.Value, &enabledInt); err != nil {
			return nil, err
		}
		item.Enabled = enabledInt == 1
		result = append(result, item)
	}

	return result, rows.Err()
}

func (r *Repository) ensureRequestTabsForeignKeys() error {
	rows, err := r.db.Query(`PRAGMA foreign_key_list(request_tabs)`)
	if err != nil {
		return fmt.Errorf("read request_tabs foreign keys: %w", err)
	}
	defer rows.Close()

	hasCollectionFK := false
	hasSavedRequestFK := false
	for rows.Next() {
		var id int
		var seq int
		var table string
		var from string
		var to string
		var onUpdate string
		var onDelete string
		var match string
		if err := rows.Scan(&id, &seq, &table, &from, &to, &onUpdate, &onDelete, &match); err != nil {
			return fmt.Errorf("scan request_tabs foreign key: %w", err)
		}
		if table == "collections" && from == "collection_id" {
			hasCollectionFK = true
		}
		if table == "saved_requests" && from == "saved_request_id" {
			hasSavedRequestFK = true
		}
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate request_tabs foreign keys: %w", err)
	}
	if hasCollectionFK && hasSavedRequestFK {
		return nil
	}

	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin request_tabs migration transaction: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	if _, err = tx.Exec(`
		CREATE TABLE request_tabs_new (
			id TEXT PRIMARY KEY,
			collection_id TEXT NOT NULL DEFAULT '` + defaultCollectionID + `',
			saved_request_id TEXT,
			layout TEXT NOT NULL,
			protocol TEXT NOT NULL,
			title TEXT NOT NULL,
			method TEXT NOT NULL,
			url TEXT NOT NULL,
			body TEXT NOT NULL,
			auth_type TEXT NOT NULL DEFAULT 'none',
			bearer_token TEXT NOT NULL DEFAULT '',
			pre_request_script TEXT NOT NULL DEFAULT '',
			post_response_script TEXT NOT NULL DEFAULT '',
			response_json TEXT NOT NULL DEFAULT '',
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
			FOREIGN KEY(saved_request_id) REFERENCES saved_requests(id) ON DELETE SET NULL
		)
	`); err != nil {
		return fmt.Errorf("create request_tabs_new: %w", err)
	}

	if _, err = tx.Exec(`
		INSERT INTO request_tabs_new (
			id, collection_id, saved_request_id, layout, protocol, title, method, url, body, auth_type, bearer_token, pre_request_script, post_response_script, response_json, created_at, updated_at
		)
		SELECT
			request_tabs.id,
			COALESCE(collections.id, ?),
			CASE
				WHEN saved_requests.id IS NULL THEN NULL
				ELSE request_tabs.saved_request_id
			END,
			request_tabs.layout,
			request_tabs.protocol,
			request_tabs.title,
			request_tabs.method,
			request_tabs.url,
			request_tabs.body,
			request_tabs.auth_type,
			request_tabs.bearer_token,
			request_tabs.pre_request_script,
			request_tabs.post_response_script,
			request_tabs.response_json,
			request_tabs.created_at,
			request_tabs.updated_at
		FROM request_tabs
		LEFT JOIN collections ON collections.id = request_tabs.collection_id
		LEFT JOIN saved_requests ON saved_requests.id = request_tabs.saved_request_id
	`, defaultCollectionID); err != nil {
		return fmt.Errorf("copy request_tabs data: %w", err)
	}

	if _, err = tx.Exec(`DROP TABLE request_tabs`); err != nil {
		return fmt.Errorf("drop legacy request_tabs: %w", err)
	}
	if _, err = tx.Exec(`ALTER TABLE request_tabs_new RENAME TO request_tabs`); err != nil {
		return fmt.Errorf("rename request_tabs_new: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit request_tabs migration transaction: %w", err)
	}

	return nil
}

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
		if err := rows.Scan(
			&cid,
			&name,
			&columnType,
			&notNull,
			&defaultValue,
			&primaryKey,
		); err != nil {
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

func mapTableToForeignColumn(table string) string {
	switch table {
	case "request_headers", "request_params":
		return "tab_id"
	case "environment_variables":
		return "environment_id"
	default:
		return "tab_id"
	}
}

func boolToInt(value bool) int {
	if value {
		return 1
	}

	return 0
}

func marshalResponse(response map[string]any) (string, error) {
	if len(response) == 0 {
		return "", nil
	}

	data, err := json.Marshal(response)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func unmarshalResponse(value string) (map[string]any, error) {
	if value == "" {
		return nil, nil
	}

	response := map[string]any{}
	if err := json.Unmarshal([]byte(value), &response); err != nil {
		return nil, err
	}

	return response, nil
}
