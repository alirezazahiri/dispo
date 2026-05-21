import { Clock3, Database, Wifi } from "lucide-react";

import { Badge } from "@/components/ui";

import type { RequestTab } from "../../types";
import { formatBytes } from "@/lib/utils";

type Props = {
  tab: RequestTab;
};

export function ResponseMetaBar({ tab }: Props) {
  const response = tab.response;

  if (!response) return null;

  return (
    <div
      className="
        flex w-fit items-center
        text-xs gap-2
      "
    >
      <Badge
        variant={
          response.statusCode! >= 200 && response.statusCode! < 300
            ? "success"
            : response.statusCode! >= 400
              ? "destructive"
              : "warning"
        }
        className="shrink-0"
      >
        <Wifi className="h-3 w-3" />

        {!!response.statusCode && response.statusCode}

        {response.statusText && (
          <span className="opacity-70">{response.statusText}</span>
        )}
      </Badge>

      <Badge variant="info" className="shrink-0">
        <Clock3 className="h-3 w-3" />
        {response.timeMs}ms
      </Badge>

      <Badge variant="muted" className="shrink-0">
        <Database className="h-3 w-3" />

        {formatBytes(response.size!)}
      </Badge>
    </div>
  );
}
