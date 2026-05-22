package scripting

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/dop251/goja"
)

const defaultScriptTimeoutMs int64 = 5000

type runtimeState struct {
	context   ScriptContext
	request   ScriptRequest
	response  *ScriptResponse
	env       ScriptEnvContext
	mutations ScriptMutations
}

func newRuntimeState(ctx ScriptContext) runtimeState {
	requestHeaders := cloneStringMap(ctx.Request.Headers)
	requestParams := cloneStringMap(ctx.Request.Params)
	envVariables := cloneStringMap(ctx.Env.Variables)

	return runtimeState{
		context: ctx,
		request: ScriptRequest{
			Method:  ctx.Request.Method,
			URL:     ctx.Request.URL,
			Body:    ctx.Request.Body,
			Headers: requestHeaders,
			Params:  requestParams,
		},
		response: ctx.Response,
		env: ScriptEnvContext{
			Name:      ctx.Env.Name,
			Variables: envVariables,
		},
		mutations: ScriptMutations{
			Request: ScriptRequestMutations{
				Headers: make([]ScriptRequestKVMutation, 0),
				Params:  make([]ScriptRequestKVMutation, 0),
			},
			Env: make([]ScriptEnvMutation, 0),
		},
	}
}

func executeScript(ctx ScriptContext) (ScriptResult, error) {
	result := ScriptResult{
		Logs: make([]ScriptLogEntry, 0),
		Mutations: ScriptMutations{
			Request: ScriptRequestMutations{
				Headers: make([]ScriptRequestKVMutation, 0),
				Params:  make([]ScriptRequestKVMutation, 0),
			},
			Env: make([]ScriptEnvMutation, 0),
		},
	}

	if strings.TrimSpace(ctx.Source) == "" {
		return result, nil
	}

	startedAt := time.Now()
	state := newRuntimeState(ctx)
	vm := goja.New()
	collector := newLogCollector(ctx.Phase, &result.Logs)

	registerConsole(vm, collector)
	if err := registerDispo(vm, &state, ctx.Phase); err != nil {
		return result, fmt.Errorf("register dispo bridge: %w", err)
	}
	if err := registerPM(vm, &state, ctx.Phase); err != nil {
		return result, fmt.Errorf("register pm bridge: %w", err)
	}

	timeout := ctx.TimeoutMs
	if timeout <= 0 {
		timeout = defaultScriptTimeoutMs
	}

	timer := time.AfterFunc(time.Duration(timeout)*time.Millisecond, func() {
		vm.Interrupt("script execution timeout")
	})
	defer timer.Stop()

	_, runErr := vm.RunString(ctx.Source)
	result.DurationMs = time.Since(startedAt).Milliseconds()
	result.Logs = collector.entries()
	result.Mutations = state.mutations

	if runErr == nil {
		return result, nil
	}

	var interrupted *goja.InterruptedError
	if errors.As(runErr, &interrupted) {
		result.Error = fmt.Sprintf("script timeout after %dms", timeout)
		return result, nil
	}

	result.Error = runErr.Error()
	return result, nil
}

func cloneStringMap(source map[string]string) map[string]string {
	if len(source) == 0 {
		return map[string]string{}
	}

	destination := make(map[string]string, len(source))
	for key, value := range source {
		destination[key] = value
	}

	return destination
}
