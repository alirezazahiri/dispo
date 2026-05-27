import { ProtocolBadge } from "@/components/shared";
import type { RequestTab } from "../../types";

export function SseTabBadge({ tab }: { tab: RequestTab }) {
  const isLive =
    tab.sseStream.status === "open" || tab.sseStream.status === "connecting";

  return (
    <span className="inline-flex items-center gap-1.5">
      <ProtocolBadge protocol="sse" />
      {isLive ? (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse"
          title="SSE connected"
        />
      ) : null}
    </span>
  );
}
