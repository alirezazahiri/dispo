package postman

import (
	"os"
	"path/filepath"
	"testing"
)

func TestImporter_NESAuthenticationCollection(t *testing.T) {
	root, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(root, "..", "..", "..", "examples", "postman-collection.json")
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}

	result, err := Importer{}.Import(data)
	if err != nil {
		t.Fatalf("import: %v", err)
	}

	if len(result.Trees) != 1 {
		t.Fatalf("expected 1 tree, got %d", len(result.Trees))
	}

	tree := result.Trees[0]
	if tree.Collection.Name != "🏭 NES Authentication" {
		t.Fatalf("unexpected collection name: %q", tree.Collection.Name)
	}
	if len(tree.Folders) != 2 {
		t.Fatalf("expected 2 folders (Auth, User), got %d", len(tree.Folders))
	}
	if len(tree.SavedRequests) < 8 {
		t.Fatalf("expected at least 8 requests, got %d", len(tree.SavedRequests))
	}

	authFolderRequests := 0
	for _, request := range tree.SavedRequests {
		if request.FolderID == nil {
			continue
		}
		if request.Name == "login" && request.Auth.Type == "inherited" {
			authFolderRequests++
		}
		if request.Name == "validate session (for backend)" && request.Auth.Type == "bearer" {
			if request.Auth.BearerToken == "" {
				t.Fatal("expected bearer token on validate session request")
			}
		}
	}
	if authFolderRequests == 0 {
		t.Fatal("expected inherited auth on login request")
	}

	foundAPIServiceURL := false
	for _, variable := range result.SuggestedVariables {
		if variable.Name == "APIServiceURL" && variable.Value == "localhost:4003" {
			foundAPIServiceURL = true
		}
	}
	if !foundAPIServiceURL {
		t.Fatal("expected APIServiceURL collection variable in suggested variables")
	}

	foundUserID := false
	for _, request := range tree.SavedRequests {
		for _, param := range request.PathParams {
			if param.Key == "userId" {
				foundUserID = true
			}
		}
	}
	if !foundUserID {
		t.Fatal("expected userId path param from Postman URL variables")
	}

	for _, request := range tree.SavedRequests {
		if request.Name != "login" {
			continue
		}
		if request.Method != "POST" {
			t.Fatalf("login method = %q, want POST", request.Method)
		}
		if request.BodyContentType != "application/json" {
			t.Fatalf("login bodyContentType = %q, want application/json", request.BodyContentType)
		}
		contentType := ""
		for _, header := range request.Headers {
			if header.Key == "Content-Type" && header.Enabled {
				contentType = header.Value
			}
		}
		if contentType != "application/json" {
			t.Fatalf("login Content-Type header = %q, want application/json", contentType)
		}
	}
}
