import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import JsonView from "react18-json-view";

import { ScrollArea } from "@/components";
import type { RequestTab } from "../../types";
import { ResponseEmptyState } from "./response-empty-state";

type Props = {
  tab: RequestTab;
};

type ParsedBody =
  | { kind: "empty" }
  | { kind: "value"; value: unknown }
  | { kind: "invalid"; raw: string; reason: string };

export function ResponseJsonView({ tab }: Props) {
  const rawBody = tab.response?.body;

  const parsed = useMemo<ParsedBody>(() => {
    if (rawBody === undefined || rawBody === null || rawBody === "") {
      return { kind: "empty" };
    }
    // The backend usually returns a string, but the type is `unknown` because
    // post-response scripts could replace it with an already-parsed value.
    if (typeof rawBody !== "string") {
      return { kind: "value", value: rawBody };
    }
    try {
      return { kind: "value", value: JSON.parse(rawBody) };
    } catch (error) {
      return {
        kind: "invalid",
        raw: rawBody,
        reason: error instanceof Error ? error.message : "Invalid JSON",
      };
    }
  }, [rawBody]);

  if (parsed.kind === "empty") {
    return <ResponseEmptyState tab={tab} />;
  }

  if (parsed.kind === "invalid") {
    return <NonJsonFallback body={parsed.raw} reason={parsed.reason} />;
  }

  return (
    <div
      className="
        h-full overflow-auto p-4 scroll-area
      "
    >
      <JsonView
        src={(parsed.value as object | unknown[]) ?? {}}
        theme="github"
        dark={true}
      />
    </div>
  );
}

function NonJsonFallback({ body, reason }: { body: string; reason: string }) {
  return (
    <div
      className="
        flex h-full min-h-0 flex-col
      "
    >
      <div
        className="
          flex shrink-0 items-center gap-2
          border-b border-border bg-muted/40
          px-4 py-2 text-xs text-muted-foreground
        "
      >
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span>
          Response body is not valid JSON
          <span className="ml-1 opacity-70">({reason}). Showing raw body.</span>
        </span>
      </div>

      <ScrollArea
        className="
          min-h-0 flex-1
        "
      >
        <pre
          className="
            min-h-full whitespace-pre-wrap
            break-all
            p-4 font-mono text-xs
            leading-6 text-foreground
          "
        >
          {body}
        </pre>
      </ScrollArea>
    </div>
  );
}
