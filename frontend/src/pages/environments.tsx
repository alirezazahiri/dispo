import { Globe, Plus, Trash2 } from "lucide-react";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components";
import { KeyValueRowsEditor } from "@/components/shared";
import {
  useActiveEnvironment,
  useWorkspaceAddEnvironmentVariable,
  useWorkspaceCreateEnvironment,
  useWorkspaceDeleteEnvironment,
  useWorkspaceEnvironments,
  useWorkspaceSetActiveEnvironment,
  useWorkspaceUpdateEnvironment,
  useWorkspaceUpdateEnvironmentVariable,
  useWorkspaceRemoveEnvironmentVariable,
} from "@/features/workspace/stores";

export function EnvironmentsPage() {
  const environments = useWorkspaceEnvironments();
  const activeEnvironment = useActiveEnvironment();
  const createEnvironment = useWorkspaceCreateEnvironment();
  const setActiveEnvironment = useWorkspaceSetActiveEnvironment();
  const updateEnvironment = useWorkspaceUpdateEnvironment();
  const deleteEnvironment = useWorkspaceDeleteEnvironment();
  const addEnvironmentVariable = useWorkspaceAddEnvironmentVariable();
  const updateEnvironmentVariable = useWorkspaceUpdateEnvironmentVariable();
  const removeEnvironmentVariable = useWorkspaceRemoveEnvironmentVariable();

  return (
    <div className="flex min-h-0 h-full flex-col">
      <div className="border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Globe className="h-4 w-4" />
          Environments
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Define reusable variables and choose the active environment for request template
          resolution.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4 gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] space-y-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Active Environment
            </div>
            <Select
              value={activeEnvironment?.id}
              onValueChange={setActiveEnvironment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                {environments.map((environment) => (
                  <SelectItem key={environment.id} value={environment.id}>
                    {environment.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="button" variant="outline" size="icon" onClick={createEnvironment}>
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              activeEnvironment ? deleteEnvironment(activeEnvironment.id) : undefined
            }
            disabled={!activeEnvironment}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {activeEnvironment ? (
          <div className="min-h-0 flex-1 flex flex-col gap-4">
            <div className="max-w-sm space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Environment Name
              </div>
              <Input
                value={activeEnvironment.name}
                onChange={(event) =>
                  updateEnvironment(activeEnvironment.id, {
                    name: event.target.value,
                  })
                }
                placeholder="Environment name"
              />
            </div>

            <KeyValueRowsEditor
              title="Environment Variables"
              rows={activeEnvironment.variables}
              onAddRow={() => addEnvironmentVariable(activeEnvironment.id)}
              onUpdateRow={(rowId, data) =>
                updateEnvironmentVariable(activeEnvironment.id, rowId, data)
              }
              onRemoveRow={(rowId) =>
                removeEnvironmentVariable(activeEnvironment.id, rowId)
              }
              keyPlaceholder="variable_name"
              valuePlaceholder="variable value"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
