import { HttpMethod, WorkspaceProtocol } from "@/features/workspace/types";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Eraser,
  Minus,
  PencilLine,
  Radio,
  Wrench,
} from "lucide-react";

export function RequestMethodIcon({
  method,
  protocol = "http",
}: {
  method: HttpMethod;
  protocol?: WorkspaceProtocol;
}) {
  if (protocol === "http") {
    switch (method) {
      case "GET":
        return <ArrowDownToLine className="h-4 w-4 shrink-0 text-blue-500" />;
      case "POST":
        return <ArrowUpToLine className="h-4 w-4 shrink-0 text-green-500" />;
      case "PUT":
        return <PencilLine className="h-4 w-4 shrink-0 text-amber-500" />;
      case "PATCH":
        return <Wrench className="h-4 w-4 shrink-0 text-purple-500" />;
      case "DELETE":
        return <Eraser className="h-4 w-4 shrink-0 text-red-500" />;
    }
  }
  if (protocol === "sse") {
    return <Radio className="h-4 w-4 shrink-0 text-violet-500" />;
  }
  return <Minus className="h-4 w-4 shrink-0 text-muted-foreground" />;
}
