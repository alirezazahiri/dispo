package scripting

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) RunScript(ctx ScriptContext) (ScriptResult, error) {
	return executeScript(ctx)
}
