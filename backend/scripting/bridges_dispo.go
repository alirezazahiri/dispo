package scripting

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/dop251/goja"
	"github.com/google/uuid"
)

func registerDispo(vm *goja.Runtime, state *runtimeState, phase ScriptPhase) error {
	dispoObject := vm.NewObject()

	if err := dispoObject.Set("request", buildDispoRequest(vm, state)); err != nil {
		return err
	}
	if err := dispoObject.Set("environment", buildDispoEnvironment(vm, state)); err != nil {
		return err
	}
	if err := dispoObject.Set("response", buildDispoResponse(vm, state, phase)); err != nil {
		return err
	}
	if err := dispoObject.Set("utils", buildDispoUtils(vm)); err != nil {
		return err
	}

	return vm.Set("dispo", dispoObject)
}

func buildDispoRequest(vm *goja.Runtime, state *runtimeState) *goja.Object {
	requestObject := vm.NewObject()

	_ = requestObject.Set("getMethod", func() string { return state.request.Method })
	_ = requestObject.Set("setMethod", func(method string) {
		state.request.Method = method
		state.mutations.Request.Method = stringPointer(method)
	})

	_ = requestObject.Set("getUrl", func() string { return state.request.URL })
	_ = requestObject.Set("setUrl", func(url string) {
		state.request.URL = url
		state.mutations.Request.URL = stringPointer(url)
	})

	_ = requestObject.Set("getBody", func() string { return state.request.Body })
	_ = requestObject.Set("setBody", func(body string) {
		state.request.Body = body
		state.mutations.Request.Body = stringPointer(body)
	})

	_ = requestObject.Set("getHeader", func(key string) string {
		return state.request.Headers[key]
	})
	_ = requestObject.Set("setHeader", func(key, value string) {
		state.request.Headers[key] = value
		state.mutations.Request.Headers = append(state.mutations.Request.Headers, ScriptRequestKVMutation{
			Operation: "set",
			Key:       key,
			Value:     value,
		})
	})
	_ = requestObject.Set("removeHeader", func(key string) {
		delete(state.request.Headers, key)
		state.mutations.Request.Headers = append(state.mutations.Request.Headers, ScriptRequestKVMutation{
			Operation: "unset",
			Key:       key,
		})
	})
	_ = requestObject.Set("headers", func() map[string]string {
		return cloneStringMap(state.request.Headers)
	})

	_ = requestObject.Set("getParam", func(key string) string {
		return state.request.Params[key]
	})
	_ = requestObject.Set("setParam", func(key, value string) {
		state.request.Params[key] = value
		state.mutations.Request.Params = append(state.mutations.Request.Params, ScriptRequestKVMutation{
			Operation: "set",
			Key:       key,
			Value:     value,
		})
	})
	_ = requestObject.Set("removeParam", func(key string) {
		delete(state.request.Params, key)
		state.mutations.Request.Params = append(state.mutations.Request.Params, ScriptRequestKVMutation{
			Operation: "unset",
			Key:       key,
		})
	})
	_ = requestObject.Set("params", func() map[string]string {
		return cloneStringMap(state.request.Params)
	})

	return requestObject
}

func buildDispoEnvironment(vm *goja.Runtime, state *runtimeState) *goja.Object {
	environmentObject := vm.NewObject()

	_ = environmentObject.Set("name", state.env.Name)
	_ = environmentObject.Set("get", func(key string) string {
		return state.env.Variables[key]
	})
	_ = environmentObject.Set("has", func(key string) bool {
		_, exists := state.env.Variables[key]
		return exists
	})
	_ = environmentObject.Set("set", func(key, value string) {
		state.env.Variables[key] = value
		state.mutations.Env = append(state.mutations.Env, ScriptEnvMutation{
			Operation: "set",
			Key:       key,
			Value:     value,
		})
	})
	_ = environmentObject.Set("unset", func(key string) {
		delete(state.env.Variables, key)
		state.mutations.Env = append(state.mutations.Env, ScriptEnvMutation{
			Operation: "unset",
			Key:       key,
		})
	})
	_ = environmentObject.Set("all", func() map[string]string {
		return cloneStringMap(state.env.Variables)
	})

	return environmentObject
}

func buildDispoResponse(vm *goja.Runtime, state *runtimeState, phase ScriptPhase) *goja.Object {
	if phase != ScriptPhasePost || state.response == nil {
		responseObject := vm.NewObject()
		_ = responseObject.Set("text", func() string {
			panic(vm.NewTypeError("dispo.response is available only in post-response scripts"))
		})
		_ = responseObject.Set("json", func() any {
			panic(vm.NewTypeError("dispo.response is available only in post-response scripts"))
		})
		_ = responseObject.Set("getHeader", func(_ string) string {
			panic(vm.NewTypeError("dispo.response is available only in post-response scripts"))
		})
		return responseObject
	}

	responseObject := vm.NewObject()
	_ = responseObject.Set("status", state.response.Status)
	_ = responseObject.Set("statusText", state.response.StatusText)
	_ = responseObject.Set("durationMs", state.response.DurationMs)
	_ = responseObject.Set("size", len(state.response.Body))
	_ = responseObject.Set("headers", cloneStringMap(state.response.Headers))
	_ = responseObject.Set("cookies", state.response.Cookies)
	_ = responseObject.Set("text", func() string {
		return state.response.Body
	})
	_ = responseObject.Set("json", func() any {
		var parsed any
		if err := json.Unmarshal([]byte(state.response.Body), &parsed); err != nil {
			panic(vm.NewTypeError(fmt.Sprintf("response body is not valid JSON: %s", err.Error())))
		}
		return parsed
	})
	_ = responseObject.Set("getHeader", func(key string) string {
		for headerKey, headerValue := range state.response.Headers {
			if strings.EqualFold(headerKey, key) {
				return headerValue
			}
		}
		return ""
	})

	return responseObject
}

func buildDispoUtils(vm *goja.Runtime) *goja.Object {
	utilsObject := vm.NewObject()
	_ = utilsObject.Set("uuid", func() string { return uuid.NewString() })
	_ = utilsObject.Set("btoa", func(input string) string {
		return base64.StdEncoding.EncodeToString([]byte(input))
	})
	_ = utilsObject.Set("atob", func(input string) string {
		decoded, err := base64.StdEncoding.DecodeString(input)
		if err != nil {
			panic(vm.NewTypeError(fmt.Sprintf("invalid base64 input: %s", err.Error())))
		}
		return string(decoded)
	})
	return utilsObject
}

func stringPointer(value string) *string {
	return &value
}
