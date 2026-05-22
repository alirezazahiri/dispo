package scripting

import (
	"encoding/json"

	"github.com/dop251/goja"
)

func registerPM(vm *goja.Runtime, state *runtimeState, phase ScriptPhase) error {
	pmObject := vm.NewObject()

	environmentObject := vm.NewObject()
	_ = environmentObject.Set("get", func(key string) string {
		return state.env.Variables[key]
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
	_ = pmObject.Set("environment", environmentObject)

	requestObject := vm.NewObject()
	_ = requestObject.Set("method", state.request.Method)
	_ = requestObject.Set("url", state.request.URL)
	_ = requestObject.Set("body", state.request.Body)

	headersObject := vm.NewObject()
	_ = headersObject.Set("add", func(payload map[string]string) {
		key, ok := payload["key"]
		if !ok {
			return
		}
		value := payload["value"]
		state.request.Headers[key] = value
		state.mutations.Request.Headers = append(state.mutations.Request.Headers, ScriptRequestKVMutation{
			Operation: "set",
			Key:       key,
			Value:     value,
		})
	})
	_ = headersObject.Set("remove", func(key string) {
		delete(state.request.Headers, key)
		state.mutations.Request.Headers = append(state.mutations.Request.Headers, ScriptRequestKVMutation{
			Operation: "unset",
			Key:       key,
		})
	})
	_ = requestObject.Set("headers", headersObject)
	_ = pmObject.Set("request", requestObject)

	responseObject := vm.NewObject()
	if phase == ScriptPhasePost && state.response != nil {
		_ = responseObject.Set("code", state.response.Status)
		_ = responseObject.Set("text", func() string {
			return state.response.Body
		})
		_ = responseObject.Set("json", func() any {
			var parsed any
			if err := json.Unmarshal([]byte(state.response.Body), &parsed); err != nil {
				panic(vm.NewTypeError("response body is not valid JSON"))
			}
			return parsed
		})
	} else {
		_ = responseObject.Set("text", func() string {
			panic(vm.NewTypeError("pm.response is available only in post-response scripts"))
		})
		_ = responseObject.Set("json", func() any {
			panic(vm.NewTypeError("pm.response is available only in post-response scripts"))
		})
	}
	_ = pmObject.Set("response", responseObject)

	return vm.Set("pm", pmObject)
}
