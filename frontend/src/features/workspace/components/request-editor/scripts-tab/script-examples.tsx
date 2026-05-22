import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { SCRIPT_SNIPPETS } from "@/features/workspace/scripting";

type Props = {
  phase: "pre" | "post";
  onInsert: (snippet: string) => void;
};

export function ScriptExamples({ phase, onInsert }: Props) {
  const [selectedSnippetId, setSelectedSnippetId] = useState<string>("");

  const snippets = useMemo(
    () => SCRIPT_SNIPPETS.filter((snippet) => snippet.phase === phase),
    [phase],
  );

  const handleSelect = (snippetId: string) => {
    setSelectedSnippetId(snippetId);
    const selectedSnippet = snippets.find((snippet) => snippet.id === snippetId);
    if (!selectedSnippet) {
      return;
    }

    onInsert(selectedSnippet.code);
    setSelectedSnippetId("");
  };

  return (
    <Select value={selectedSnippetId} onValueChange={handleSelect}>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Insert example snippet" />
      </SelectTrigger>
      <SelectContent>
        {snippets.map((snippet) => (
          <SelectItem key={snippet.id} value={snippet.id}>
            {snippet.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
