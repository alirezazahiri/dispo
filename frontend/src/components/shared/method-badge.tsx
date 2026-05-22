import { Badge } from "@/components";
import { cn } from "@/lib/utils";
import { HttpMethod } from "@/features/workspace/types";

export const METHOD_COLORS = {
  GET: "bg-blue-500/10 text-blue-500",
  POST: "bg-green-500/10 text-green-500",
  PUT: "bg-yellow-500/10 text-yellow-500",
  PATCH: "bg-purple-500/10 text-purple-500",
  DELETE: "bg-red-500/10 text-red-500",
  OPTIONS: "bg-gray-500/10 text-gray-500",
  HEAD: "bg-gray-500/10 text-gray-500",
};

export const MethodBadge = ({ method }: { method: HttpMethod }) => {
  return (
    <Badge className={cn("text-xs border-none shrink-0", METHOD_COLORS[method])}>
      {method}
    </Badge>
  );
};
