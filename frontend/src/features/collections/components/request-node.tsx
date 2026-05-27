import { useMemo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { RequestMethodIcon } from "./request-method-icon";
import type { RequestDragData } from "../types";

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

  const dragData = useMemo<RequestDragData>(
    () => ({
      type: "request",
      requestId: request.id,
      collectionId: request.collectionId,
      folderId: request.folderId,
      name: request.name,
      method: request.method as HttpMethod,
      protocol: request.protocol,
    }),
    [
      request.id,
      request.collectionId,
      request.folderId,
      request.name,
      request.method,
      request.protocol,
    ],
  );
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
    isOver,
    active,
  } = useSortable({
    id: request.id,
    data: dragData,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const activeData = active?.data.current as RequestDragData | undefined;
  const isValidDropTarget =
    isOver &&
    activeData?.type === "request" &&
    activeData.requestId !== request.id &&
    activeData.collectionId === request.collectionId;

  return (
    <div
      ref={setSortableRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={(event) => {
        event.preventDefault();
        setActionsOpen(true);
      }}
      className={cn(
        "group flex w-full cursor-grab touch-none items-center gap-1 rounded-md px-1 py-1 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing",
        isActive && "bg-accent text-foreground",
        isDragging && "opacity-40",
        isValidDropTarget && "ring-1 ring-primary/60",
      )}
    >
      <button
        className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left text-sm"
        onClick={() => onOpenRequest(request)}
      >
        <RequestMethodIcon method={request.method as HttpMethod} protocol={request.protocol} />
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
