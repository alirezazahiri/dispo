import { Badge } from "@/components/ui";
import type { WorkspaceProtocol } from "@/features/workspace/types";
import { getProtocolMeta } from "@/features/workspace/protocols/constants";

const PROTOCOL_COLORS: Record<WorkspaceProtocol, string> = {
  http: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  sse: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  websocket: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  grpc: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

type Props = {
  protocol: WorkspaceProtocol;
  className?: string;
};

export function ProtocolBadge({ protocol, className }: Props) {
  const meta = getProtocolMeta(protocol);

  return (
    <Badge
      variant="outline"
      className={`font-mono text-[11px] uppercase tracking-wide border-0 ${PROTOCOL_COLORS[protocol]} ${className ?? ""}`}
    >
      {meta.shortLabel}
    </Badge>
  );
}
