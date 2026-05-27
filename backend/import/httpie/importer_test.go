package httpie

import (
	"os"
	"path/filepath"
	"testing"
)

func TestImporter_NestJSMiniAppsCollection(t *testing.T) {
	root, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	// test runs from backend/import/httpie
	path := filepath.Join(root, "..", "..", "..", "examples", "httpie-collection-nestjs-mini-apps.json")
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
	if tree.Collection.Name != "NestJS Mini Apps🔥" {
		t.Fatalf("unexpected collection name: %q", tree.Collection.Name)
	}
	if len(tree.SavedRequests) < 15 {
		t.Fatalf("expected many requests, got %d", len(tree.SavedRequests))
	}

	inheritedCount := 0
	for _, request := range tree.SavedRequests {
		if request.Auth.Type == "inherited" {
			inheritedCount++
		}
	}
	if inheritedCount == 0 {
		t.Fatal("expected inherited auth on imported requests")
	}

	if len(result.SuggestedVariables) == 0 {
		t.Fatal("expected discovered template variables")
	}
}
