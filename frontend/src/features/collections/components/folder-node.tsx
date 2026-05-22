import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  FilePlus,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Folder as FolderType, SavedRequest } from "@/features";
import { RequestNode } from "./request-node";

type FolderNodeProps = {
  folder: FolderType;
  requests: SavedRequest[];
  expandedNodeIds: Record<string, boolean>;
  toggleNodeExpanded: (id: string) => void;
  onCreateRequest: (folderId: string | null) => void;
  onRenameFolder: (folder: FolderType) => void;
  onRenameRequest: (request: SavedRequest) => void;
  onDuplicateRequest: (requestId: string) => Promise<void>;
  onOpenRequest: (request: SavedRequest) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteRequest: (requestId: string) => void;
  activeSavedRequestId: string | null;
};

export function FolderNode({
  folder,
  requests,
  expandedNodeIds,
  toggleNodeExpanded,
  onCreateRequest,
  onRenameFolder,
  onRenameRequest,
  onDuplicateRequest,
  onOpenRequest,
  onDeleteFolder,
  onDeleteRequest,
  activeSavedRequestId,
}: FolderNodeProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const expanded = Boolean(expandedNodeIds[folder.id]);
  const childrenRequests = requests
    .filter((request) => request.folderId === folder.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Collapsible
      open={expanded}
      onOpenChange={() => toggleNodeExpanded(folder.id)}
    >
      <div
        onContextMenu={(event) => {
          event.preventDefault();
          setActionsOpen(true);
        }}
        className="group flex w-full items-center gap-1 rounded-md px-1 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                expanded && "rotate-90",
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <button
          className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left text-sm"
          onClick={() => toggleNodeExpanded(folder.id)}
        >
          {expanded ? (
            <FolderOpen className="h-4 w-4 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 shrink-0" />
          )}
          <span className="min-w-0 flex-1 truncate">{folder.name}</span>
        </button>
        <DropdownMenu open={actionsOpen} onOpenChange={setActionsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Folder actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCreateRequest(folder.id)}>
              <FilePlus className="mr-2 h-4 w-4" />
              New Request
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRenameFolder(folder)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDeleteFolder(folder.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CollapsibleContent className="mt-1 space-y-1 pl-4">
        {childrenRequests.map((request) => (
          <RequestNode
            key={request.id}
            request={request}
            onRenameRequest={onRenameRequest}
            onDuplicateRequest={onDuplicateRequest}
            onOpenRequest={onOpenRequest}
            onDeleteRequest={onDeleteRequest}
            isActive={activeSavedRequestId === request.id}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
