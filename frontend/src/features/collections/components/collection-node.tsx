import { useEffect, useMemo, useRef, useState } from "react";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
import { FolderNode } from "./folder-node";
import { RequestNode } from "./request-node";
import type { RequestDragData, CollectionRootDropData } from "../types";

type CollectionNodeProps = {
  collectionId: string;
  collectionName: string;
  isActive: boolean;
  folders: FolderType[];
  requests: SavedRequest[];
  expanded: boolean;
  activeSavedRequestId: string | null;
  toggleExpanded: () => void;
  onOpenCollection: () => void;
  onCreateFolder: () => void;
  onCreateRequest: (folderId: string | null) => void;
  onRenameCollection: () => void;
  onDeleteCollection: () => void;
  onRenameFolder: (folder: FolderType) => void;
  onRenameRequest: (request: SavedRequest) => void;
  onDuplicateRequest: (requestId: string) => Promise<void>;
  onOpenRequest: (request: SavedRequest) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteRequest: (requestId: string) => void;
  expandedNodeIds: Record<string, boolean>;
  toggleNodeExpanded: (id: string) => void;
};

export function CollectionNode({
  collectionId,
  collectionName,
  isActive,
  folders,
  requests,
  expanded,
  activeSavedRequestId,
  toggleExpanded,
  onOpenCollection,
  onCreateFolder,
  onCreateRequest,
  onRenameCollection,
  onDeleteCollection,
  onRenameFolder,
  onRenameRequest,
  onDuplicateRequest,
  onOpenRequest,
  onDeleteFolder,
  onDeleteRequest,
  expandedNodeIds,
  toggleNodeExpanded,
}: CollectionNodeProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const rootFolders = useMemo(
    () =>
      folders
        .filter((folder) => !folder.parentFolderId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [folders],
  );
  const rootRequests = useMemo(
    () =>
      requests
        .filter((request) => !request.folderId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [requests],
  );
  const rootRequestIds = useMemo(
    () => rootRequests.map((request) => request.id),
    [rootRequests],
  );

  const dropData: CollectionRootDropData = {
    type: "collection-root",
    collectionId,
    folderId: null,
  };
  const {
    isOver,
    active,
    setNodeRef: setDroppableRef,
  } = useDroppable({
    id: `collection-root:${collectionId}`,
    data: dropData,
  });
  const { isOver: isOverRootZone, setNodeRef: setRootZoneRef } = useDroppable({
    id: `collection-root-zone:${collectionId}`,
    data: dropData,
  });

  const activeData = active?.data.current as RequestDragData | undefined;
  const isDraggingFromThisCollection =
    activeData?.type === "request" && activeData.collectionId === collectionId;
  const isDraggingFromOtherCollection =
    activeData?.type === "request" && activeData.collectionId !== collectionId;
  const isValidDropTarget =
    isDraggingFromThisCollection && !!activeData!.folderId;
  const isHighlighted = isOver && isValidDropTarget;
  const isRejected = isOver && isDraggingFromOtherCollection;
  const showRootDropZone = isValidDropTarget;

  const expandTimerRef = useRef<number | null>(null);
  useEffect(() => {
    const shouldArmTimer = isOver && isDraggingFromThisCollection && !expanded;
    if (shouldArmTimer) {
      expandTimerRef.current = window.setTimeout(() => {
        toggleExpanded();
      }, 600);
    }
    return () => {
      if (expandTimerRef.current !== null) {
        window.clearTimeout(expandTimerRef.current);
        expandTimerRef.current = null;
      }
    };
  }, [isOver, isDraggingFromThisCollection, expanded, toggleExpanded]);

  useDndMonitor({
    onDragEnd: () => {
      if (expandTimerRef.current !== null) {
        window.clearTimeout(expandTimerRef.current);
        expandTimerRef.current = null;
      }
    },
    onDragCancel: () => {
      if (expandTimerRef.current !== null) {
        window.clearTimeout(expandTimerRef.current);
        expandTimerRef.current = null;
      }
    },
  });

  return (
    <Collapsible open={expanded} onOpenChange={toggleExpanded}>
      <div
        ref={setDroppableRef}
        className={cn(
          "rounded-md transition-colors",
          isHighlighted && "ring-1 ring-primary/60",
          isRejected && "ring-1 ring-destructive/60",
        )}
      >
        <div
          onContextMenu={(event) => {
            event.preventDefault();
            setActionsOpen(true);
          }}
          className={cn(
            "group flex w-full items-center gap-1 rounded-md px-1 py-1.5",
            isActive
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
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
            onClick={onOpenCollection}
          >
            {expanded ? (
              <FolderOpen className="h-4 w-4 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate">{collectionName}</span>
          </button>
          <DropdownMenu open={actionsOpen} onOpenChange={setActionsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Collection actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCreateRequest(null)}>
                <FilePlus className="mr-2 h-4 w-4" />
                New Request
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateFolder}>
                <Folder className="mr-2 h-4 w-4" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRenameCollection}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={onDeleteCollection}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CollapsibleContent className="mt-1 space-y-1 pl-4">
          {rootFolders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              requests={requests}
              expandedNodeIds={expandedNodeIds}
              toggleNodeExpanded={toggleNodeExpanded}
              onCreateRequest={onCreateRequest}
              onRenameFolder={onRenameFolder}
              onRenameRequest={onRenameRequest}
              onDuplicateRequest={onDuplicateRequest}
              onOpenRequest={onOpenRequest}
              onDeleteFolder={onDeleteFolder}
              onDeleteRequest={onDeleteRequest}
              activeSavedRequestId={activeSavedRequestId}
            />
          ))}
          <SortableContext
            items={rootRequestIds}
            strategy={verticalListSortingStrategy}
          >
            {rootRequests.map((request) => (
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
          </SortableContext>
          {showRootDropZone && (
            <div
              ref={setRootZoneRef}
              className={cn(
                "mt-1 flex items-center justify-center rounded-md border border-dashed border-muted-foreground/40 px-2 py-2 text-xs text-muted-foreground transition-colors",
                isOverRootZone &&
                  "border-primary/60 bg-primary/10 text-foreground",
              )}
            >
              Drop here to move to {collectionName}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
