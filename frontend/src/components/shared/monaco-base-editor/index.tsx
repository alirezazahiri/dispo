import Editor from "@monaco-editor/react";
import { useTheme } from "@/hooks/use-theme";
import { MonacoBaseEditorSkeleton } from "./skeleton";

type Props = {
  value: string;
  defaultLanguage?: string;
  language?: string;
  onChange: (value: string) => void;
};

export function MonacoBaseEditor({
  value,
  onChange,
  defaultLanguage,
  language,
}: Props) {
  const { resolvedTheme } = useTheme();

  return (
    <Editor
      defaultLanguage={defaultLanguage}
      language={language}
      loading={<MonacoBaseEditorSkeleton />}
      theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
      value={value}
      onChange={(value) => onChange(value ?? "")}
      options={{
        minimap: {
          enabled: false,
        },

        fontSize: 13,
        lineHeight: 20,
        fontLigatures: false,

        fontFamily: "'JetBrains Mono', monospace",

        disableLayerHinting: true,
        disableMonospaceOptimizations: true,

        automaticLayout: true,

        smoothScrolling: true,

        padding: {
          top: 10,
        },

        scrollBeyondLastLine: false,

        wordWrap: "on",

        renderLineHighlight: "gutter",

        overviewRulerBorder: false,

        hideCursorInOverviewRuler: true,

        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
      }}
    />
  );
}
