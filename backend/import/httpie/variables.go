package httpie

import (
	"dispo/backend/api"
	"regexp"
	"sort"
	"strings"
)

var templateVariablePattern = regexp.MustCompile(`\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}`)

func collectTemplateVariables(trees []api.CollectionTreePayload) []api.SuggestedVariablePayload {
	seen := make(map[string]struct{})
	names := make([]string, 0)

	var walk func(value string)
	walk = func(value string) {
		if value == "" {
			return
		}
		matches := templateVariablePattern.FindAllStringSubmatch(value, -1)
		for _, match := range matches {
			name := match[1]
			if name == "" {
				continue
			}
			if _, exists := seen[name]; exists {
				continue
			}
			seen[name] = struct{}{}
			names = append(names, name)
		}
	}

	for _, tree := range trees {
		walk(tree.Collection.Name)
		walk(tree.Collection.Description)
		walk(tree.Collection.Auth.BearerToken)

		for _, request := range tree.SavedRequests {
			walk(request.Name)
			walk(request.URL)
			walk(request.Body)
			walk(request.GraphQLQuery)
			walk(request.GraphQLVariables)
			walk(request.PreRequestScript)
			walk(request.PostResponseScript)
			walk(request.Auth.BearerToken)

			for _, row := range request.Headers {
				walk(row.Key)
				walk(row.Value)
			}
			for _, row := range request.QueryParams {
				walk(row.Key)
				walk(row.Value)
			}
			for _, row := range request.PathParams {
				walk(row.Key)
				walk(row.Value)
			}
			for _, field := range request.FormFields {
				walk(field.Key)
				walk(field.Value)
			}
		}
	}

	sort.Strings(names)
	result := make([]api.SuggestedVariablePayload, 0, len(names))
	for _, name := range names {
		result = append(result, api.SuggestedVariablePayload{
			Name:  name,
			Value: "",
		})
	}
	return result
}

func mergeSuggestedVariables(
	provided []api.SuggestedVariablePayload,
	scanned []api.SuggestedVariablePayload,
) []api.SuggestedVariablePayload {
	byName := make(map[string]string, len(provided)+len(scanned))
	order := make([]string, 0, len(provided)+len(scanned))

	add := func(name, value string) {
		name = strings.TrimSpace(name)
		if name == "" {
			return
		}
		if _, exists := byName[name]; !exists {
			order = append(order, name)
		}
		if value != "" {
			byName[name] = value
		} else if _, exists := byName[name]; !exists {
			byName[name] = ""
		}
	}

	for _, item := range provided {
		add(item.Name, item.Value)
	}
	for _, item := range scanned {
		add(item.Name, item.Value)
	}

	sort.Strings(order)
	result := make([]api.SuggestedVariablePayload, 0, len(order))
	for _, name := range order {
		result = append(result, api.SuggestedVariablePayload{
			Name:  name,
			Value: byName[name],
		})
	}
	return result
}
