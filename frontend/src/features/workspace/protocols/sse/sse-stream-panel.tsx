import { useEffect, useRef } from "react";
import { Radio, Trash2 } from "lucide-react";
import { Button } from "@/components";
import type { RequestTab, SseEventRecord } from "../../types";
import { formatBytes } from "@/lib/utils";

type Props = {
  tab: RequestTab;
};

export function SseStreamPanel({ tab }: Props) {
  const stream = tab.sseStream;
  const scrollRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stream.events.length]);

  if (stream.status === "idle" && stream.events.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground px-4 text-center">
        <Radio className="h-8 w-8 opacity-40" />
        <div className="text-sm">No stream yet</div>
        <div className="text-xs max-w-sm">
          Connect to an SSE endpoint to watch events arrive in real time.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SseStreamMeta tab={tab} />

      {stream.error && stream.status !== "open" ? (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {stream.error}
        </div>
      ) : null}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        {stream.events.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {stream.status === "connecting"
              ? "Waiting for events…"
              : "Connected — no events received yet"}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {stream.events.map((event) => (
              <SseEventRow key={event.id} event={event} />
            ))}
            <div ref={tailRef} />
          </ul>
        )}
      </div>
    </div>
  );
}

function SseStreamMeta({ tab }: { tab: RequestTab }) {
  const stream = tab.sseStream;
  const statusLabel = {
    idle: "Idle",
    connecting: "Connecting",
    open: "Connected",
    closed: "Disconnected",
    error: "Error",
  }[stream.status];

  const statusColor = {
    idle: "text-muted-foreground",
    connecting: "text-amber-600 dark:text-amber-400",
    open: "text-emerald-600 dark:text-emerald-400",
    closed: "text-muted-foreground",
    error: "text-destructive",
  }[stream.status];

  const durationMs =
    stream.connectedAt && (stream.closedAt ?? Date.now())
      ? (stream.closedAt ?? Date.now()) - stream.connectedAt
      : null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-background/80 px-4 py-2 text-xs text-muted-foreground">
      <span className={statusColor}>
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current mr-1.5 align-middle" />
        {statusLabel}
        {stream.statusCode ? ` · HTTP ${stream.statusCode}` : null}
      </span>
      <span>{stream.eventCount} events</span>
      <span>{formatBytes(stream.bytesReceived)}</span>
      {durationMs !== null ? <span>{durationMs}ms</span> : null}
    </div>
  );
}

function SseEventRow({ event }: { event: SseEventRecord }) {
  const time = new Date(event.receivedAt).toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <li className="px-4 py-3 hover:bg-accent/30">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
        <time dateTime={new Date(event.receivedAt).toISOString()}>{time}</time>
        {event.eventType ? (
          <span className="rounded bg-violet-500/15 px-1.5 py-0.5 font-mono text-violet-700 dark:text-violet-300">
            {event.eventType}
          </span>
        ) : null}
        {event.eventId ? (
          <span className="font-mono truncate">id: {event.eventId}</span>
        ) : null}
      </div>
      <pre className="whitespace-pre-wrap break-words font-mono text-xs text-foreground">
        {event.data || <span className="text-muted-foreground italic">(empty)</span>}
      </pre>
    </li>
  );
}

type StreamActionsProps = {
  tab: RequestTab;
  onClear: () => void;
};

export function SseStreamPanelActions({
  tab,
  onClear,
}: StreamActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        disabled={tab.sseStream.events.length === 0 && tab.sseStream.status === "idle"}
        onClick={onClear}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Clear
      </Button>
    </div>
  );
}
