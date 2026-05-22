import type { RequestTab } from "../../types";
import type { ScriptExecution } from "../../scripting";

type Props = {
  tab: RequestTab;
};

export function ResponseConsoleView({ tab }: Props) {
  const pre = tab.response?.scripts?.pre;
  const post = tab.response?.scripts?.post;

  if (!pre && !post) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No script output yet.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="space-y-4">
        <ConsoleSection title="Pre-request" execution={pre} />
        <ConsoleSection title="Post-response" execution={post} />
      </div>
    </div>
  );
}

type SectionProps = {
  title: string;
  execution: ScriptExecution | undefined;
};

function ConsoleSection({ title, execution }: SectionProps) {
  return (
    <section className="rounded-md border border-border bg-background">
      <div className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </div>

      {!execution ? (
        <div className="px-3 py-4 text-sm text-muted-foreground">Script did not run.</div>
      ) : (
        <div className="space-y-3 px-3 py-3">
          <div className="text-xs text-muted-foreground">
            {execution.skipped ? "Skipped" : `Duration: ${execution.durationMs}ms`}
          </div>

          {execution.error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-2 text-xs text-destructive break-words">
              {execution.error}
            </div>
          )}

          {execution.logs.length === 0 ? (
            <div className="text-xs text-muted-foreground">No logs.</div>
          ) : (
            <div className="space-y-1">
              {execution.logs.map((log, index) => (
                <div
                  key={`${log.timestamp}-${index}`}
                  className="rounded bg-[hsl(var(--editor))] px-2 py-1 text-xs font-mono"
                >
                  <span className="mr-2 text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="mr-2 uppercase text-muted-foreground">{log.level}</span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
