package scripting

type ScriptPhase string

const (
	ScriptPhasePre  ScriptPhase = "pre"
	ScriptPhasePost ScriptPhase = "post"
)

type ScriptLogLevel string

const (
	ScriptLogLevelLog   ScriptLogLevel = "log"
	ScriptLogLevelInfo  ScriptLogLevel = "info"
	ScriptLogLevelWarn  ScriptLogLevel = "warn"
	ScriptLogLevelError ScriptLogLevel = "error"
)

type ScriptContext struct {
	Phase     ScriptPhase      `json:"phase"`
	Source    string           `json:"source"`
	TimeoutMs int64            `json:"timeoutMs"`
	Request   ScriptRequest    `json:"request"`
	Response  *ScriptResponse  `json:"response,omitempty"`
	Env       ScriptEnvContext `json:"env"`
}

type ScriptRequest struct {
	Method  string            `json:"method"`
	URL     string            `json:"url"`
	Body    string            `json:"body"`
	Headers map[string]string `json:"headers"`
	Params  map[string]string `json:"params"`
}

type ScriptResponse struct {
	Status     int               `json:"status"`
	StatusText string            `json:"statusText"`
	Headers    map[string]string `json:"headers"`
	Cookies    []ScriptCookie    `json:"cookies"`
	Body       string            `json:"body"`
	DurationMs int64             `json:"durationMs"`
}

type ScriptCookie struct {
	Name     string `json:"name"`
	Value    string `json:"value"`
	Domain   string `json:"domain"`
	Path     string `json:"path"`
	Expires  string `json:"expires"`
	HTTPOnly bool   `json:"httpOnly"`
	Secure   bool   `json:"secure"`
	SameSite string `json:"sameSite"`
}

type ScriptEnvContext struct {
	Name      string            `json:"name"`
	Variables map[string]string `json:"variables"`
}

type ScriptResult struct {
	Logs       []ScriptLogEntry `json:"logs"`
	Mutations  ScriptMutations  `json:"mutations"`
	Error      string           `json:"error,omitempty"`
	DurationMs int64            `json:"durationMs"`
}

type ScriptLogEntry struct {
	Level      ScriptLogLevel `json:"level"`
	Message    string         `json:"message"`
	Timestamp  int64          `json:"timestamp"`
	Phase      ScriptPhase    `json:"phase"`
	ScriptName string         `json:"scriptName"`
}

type ScriptMutations struct {
	Request ScriptRequestMutations `json:"request"`
	Env     []ScriptEnvMutation    `json:"env"`
}

type ScriptEnvMutation struct {
	Operation string `json:"operation"`
	Key       string `json:"key"`
	Value     string `json:"value,omitempty"`
}

type ScriptRequestMutations struct {
	Method  *string                   `json:"method,omitempty"`
	URL     *string                   `json:"url,omitempty"`
	Body    *string                   `json:"body,omitempty"`
	Headers []ScriptRequestKVMutation `json:"headers"`
	Params  []ScriptRequestKVMutation `json:"params"`
}

type ScriptRequestKVMutation struct {
	Operation string `json:"operation"`
	Key       string `json:"key"`
	Value     string `json:"value,omitempty"`
}
