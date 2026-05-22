package scripting

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/dop251/goja"
)

type logCollector struct {
	phase ScriptPhase
	logs  *[]ScriptLogEntry
}

func newLogCollector(phase ScriptPhase, logs *[]ScriptLogEntry) *logCollector {
	return &logCollector{
		phase: phase,
		logs:  logs,
	}
}

func (c *logCollector) push(level ScriptLogLevel, values []goja.Value) {
	messageParts := make([]string, 0, len(values))
	for _, value := range values {
		messageParts = append(messageParts, stringifyJSValue(value))
	}

	*c.logs = append(*c.logs, ScriptLogEntry{
		Level:     level,
		Message:   strings.Join(messageParts, " "),
		Timestamp: time.Now().UnixMilli(),
		Phase:     c.phase,
	})
}

func (c *logCollector) entries() []ScriptLogEntry {
	return *c.logs
}

func registerConsole(vm *goja.Runtime, collector *logCollector) {
	consoleObject := vm.NewObject()

	_ = consoleObject.Set("log", func(call goja.FunctionCall) goja.Value {
		collector.push(ScriptLogLevelLog, call.Arguments)
		return goja.Undefined()
	})
	_ = consoleObject.Set("info", func(call goja.FunctionCall) goja.Value {
		collector.push(ScriptLogLevelInfo, call.Arguments)
		return goja.Undefined()
	})
	_ = consoleObject.Set("warn", func(call goja.FunctionCall) goja.Value {
		collector.push(ScriptLogLevelWarn, call.Arguments)
		return goja.Undefined()
	})
	_ = consoleObject.Set("error", func(call goja.FunctionCall) goja.Value {
		collector.push(ScriptLogLevelError, call.Arguments)
		return goja.Undefined()
	})

	vm.Set("console", consoleObject)
}

func stringifyJSValue(value goja.Value) string {
	if value == nil {
		return "null"
	}

	exported := value.Export()
	if exported == nil {
		return "null"
	}

	switch typed := exported.(type) {
	case string:
		return typed
	case fmt.Stringer:
		return typed.String()
	}

	asJSON, err := json.Marshal(exported)
	if err != nil {
		return fmt.Sprintf("%v", exported)
	}

	return string(asJSON)
}
