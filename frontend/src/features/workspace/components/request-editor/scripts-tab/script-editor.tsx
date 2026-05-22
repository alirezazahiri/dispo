import { MonacoBaseEditor } from "@/components/shared";
import { ScriptExamples } from "./script-examples";
import { configureScriptIntelliSense } from "./monaco-intellisense";

type Props = {
  phase: "pre" | "post";
  value: string;
  onChange: (value: string) => void;
};

export function ScriptEditor({ phase, value, onChange }: Props) {
  const scriptTitle = phase === "pre" ? "Pre-request Script" : "Post-response Script";

  const handleInsertSnippet = (snippet: string) => {
    const nextValue = value.trim() ? `${value}\n\n${snippet}` : snippet;
    onChange(nextValue);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2">
        <div className="text-sm font-medium">{scriptTitle}</div>
        <ScriptExamples phase={phase} onInsert={handleInsertSnippet} />
      </div>

      <div className="min-h-0 flex-1">
        <MonacoBaseEditor
          value={value}
          onChange={onChange}
          defaultLanguage="javascript"
          beforeMount={configureScriptIntelliSense}
        />
      </div>

      <div className="border-t border-border bg-background px-4 py-2 text-xs text-muted-foreground">
        APIs: <code>dispo.request</code>, <code>dispo.environment</code>
        {phase === "post" ? ", dispo.response" : ""}, and <code>pm.*</code> aliases.
      </div>
    </div>
  );
}
