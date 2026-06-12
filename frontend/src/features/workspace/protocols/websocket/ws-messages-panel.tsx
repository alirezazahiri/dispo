import { useEffect, useRef } from "react";
import { ArrowDownLeft, ArrowUpRight, Radio, Trash2 } from "lucide-react";
import { Button } from "@/components";
import { TOOLBAR_CONTROL_HEIGHT } from "../../components/request-toolbar/constants";
import type { RequestTab, WsMessageRecord } from "../../types";
import { cn, formatBytes } from "@/lib/utils";
import { formatBinaryPreview } from "./ws-message";

type Props = {
  tab: RequestTab;
};

export function WsMessagesPanel({ tab }: Props) {
  const stream = tab.wsStream;
  const tailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stream.messages.length]);

  if (stream.status === "idle" && stream.messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground px-4 text-center">
        <Radio className="h-8 w-8 opacity-40" />
        <div className="text-sm">No messages yet</div>
        <div className="text-xs max-w-sm">
          Connect to a WebSocket endpoint to send and receive messages in real time.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WsMessagesMeta tab={tab} />

      {stream.error && stream.status !== "open" ? (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {stream.error}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        {stream.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {stream.status === "connecting"
              ? "Connecting…"
              : "Connected — no messages yet"}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {stream.messages.map((message) => (
              <WsMessageRow key={message.id} message={message} />
            ))}
            <div ref={tailRef} />
          </ul>
        )}
      </div>
    </div>
  );
}

function WsMessagesMeta({ tab }: { tab: RequestTab }) {
  const stream = tab.wsStream;
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
        {stream.subprotocol ? ` · ${stream.subprotocol}` : null}
      </span>
      <span>{stream.messageCount} messages</span>
      <span>{formatBytes(stream.bytesReceived)} received</span>
      {durationMs !== null ? <span>{durationMs}ms</span> : null}
      {stream.closeCode ? (
        <span>
          close {stream.closeCode}
          {stream.closeReason ? ` · ${stream.closeReason}` : ""}
        </span>
      ) : null}
    </div>
  );
}

function WsMessageRow({ message }: { message: WsMessageRecord }) {
  const time = new Date(message.receivedAt).toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const DirectionIcon = message.direction === "sent" ? ArrowUpRight : ArrowDownLeft;
  const directionColor =
    message.direction === "sent"
      ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";

  return (
    <li className="px-4 py-3 hover:bg-accent/30">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
        <time dateTime={new Date(message.receivedAt).toISOString()}>{time}</time>
        <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5", directionColor)}>
          <DirectionIcon className="h-3 w-3" />
          {message.direction}
        </span>
        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-amber-700 dark:text-amber-300">
          {message.messageType}
        </span>
        <span>{message.byteLength} bytes</span>
      </div>
      {message.messageType === "binary" ? (
        <div className="space-y-1">
          <pre className="whitespace-pre-wrap break-all font-mono text-xs text-foreground">
            {message.data || <span className="text-muted-foreground italic">(empty)</span>}
          </pre>
          <p className="font-mono text-[11px] text-muted-foreground">
            hex: {formatBinaryPreview(message.data)}
          </p>
        </div>
      ) : (
        <pre className="whitespace-pre-wrap break-words font-mono text-xs text-foreground">
          {message.data || <span className="text-muted-foreground italic">(empty)</span>}
        </pre>
      )}
    </li>
  );
}

type MessagesActionsProps = {
  tab: RequestTab;
  onClear: () => void;
};

export function WsMessagesPanelActions({
  tab,
  onClear,
}: MessagesActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        className={cn("gap-1.5", TOOLBAR_CONTROL_HEIGHT)}
        disabled={
          tab.wsStream.messages.length === 0 && tab.wsStream.status === "idle"
        }
        onClick={onClear}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Clear
      </Button>
    </div>
  );
}
