import { ProtocolBadge } from "@/components/shared";
import type { RequestTab } from "../../types";

export function WsTabBadge({ tab }: { tab: RequestTab }) {
  const isLive =
    tab.wsStream.status === "open" || tab.wsStream.status === "connecting";

  return (
    <span className="inline-flex items-center gap-1.5">
      <ProtocolBadge protocol="websocket" />
      {isLive ? (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse"
          title="WebSocket connected"
        />
      ) : null}
    </span>
  );
}
