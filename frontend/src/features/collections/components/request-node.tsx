import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Eraser,
  Minus,
  MoreHorizontal,
  Pencil,
  PencilLine,
  Trash2,
  Wrench,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { SavedRequest } from "@/features";
import { HttpMethod } from "@/features/workspace/types";

type RequestNodeProps = {
  request: SavedRequest;
  onRenameRequest: (request: SavedRequest) => void;
  onDuplicateRequest: (requestId: string) => Promise<void>;
  onOpenRequest: (request: SavedRequest) => void;
  onDeleteRequest: (requestId: string) => void;
  isActive: boolean;
};

export function RequestNode({
  request,
  onRenameRequest,
  onDuplicateRequest,
  onOpenRequest,
  onDeleteRequest,
  isActive,
}: RequestNodeProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  return (
    <div
      onContextMenu={(event) => {
        event.preventDefault();
        setActionsOpen(true);
      }}
      className={cn(
        "group flex w-full items-center gap-1 rounded-md px-1 py-1 text-muted-foreground hover:bg-accent hover:text-foreground",
        isActive && "bg-accent text-foreground",
      )}
    >
      <button
        className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left text-sm"
        onClick={() => onOpenRequest(request)}
      >
        <RequestMethodIcon method={request.method as HttpMethod} />
        <span className="min-w-0 flex-1 truncate">{request.name}</span>
      </button>
      <DropdownMenu open={actionsOpen} onOpenChange={setActionsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            aria-label="Request actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onRenameRequest(request)}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void onDuplicateRequest(request.id)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDeleteRequest(request.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function RequestMethodIcon({ method }: { method: HttpMethod }) {
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
    case "HEAD":
    case "OPTIONS":
    default:
      return <Minus className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
}
