import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  Globe,
  MoreHorizontal,
  Plus,
  Copy,
  Pencil,
  Trash2,
  ArrowDownToLine,
  ArrowUpToLine,
  PencilLine,
  Eraser,
  Wrench,
  Minus,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ScrollArea,
  Separator,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import { SidebarItem } from "./sidebar-item";
import { useCollectionsData, useCollectionsStore } from "@/features";
import {
  useActiveCollectionId,
  useWorkspaceHandleRenamedSavedRequest,
  useActiveSavedRequestId,
  useWorkspaceHandleDeletedSavedRequest,
  useWorkspaceOpenSavedRequest,
  useWorkspaceRemoveCollectionState,
} from "@/features/workspace/stores";
import type { Folder as FolderType, SavedRequest } from "@/features";
import type { HttpMethod } from "@/features/workspace/types";
import {
  CreateCollectionDialog,
  CreateFolderDialog,
  RenameDialog,
} from "./components";

export const Sidebar = () => {
  const isOpen = useSidebarStore((state) => state.isOpen);
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openSavedRequest = useWorkspaceOpenSavedRequest();
  const removeCollectionState = useWorkspaceRemoveCollectionState();
  const handleRenamedSavedRequest = useWorkspaceHandleRenamedSavedRequest();
  const handleDeletedSavedRequest = useWorkspaceHandleDeletedSavedRequest();
  const activeCollectionId = useActiveCollectionId();
  const activeSavedRequestId = useActiveSavedRequestId();

  const {
    collectionOrder,
    collectionsById,
    foldersByCollection,
    requestsByCollection,
    expandedNodeIds,
  } = useCollectionsData();
  const toggleNodeExpanded = useCollectionsStore((state) => state.toggleNodeExpanded);
  const setNodeExpanded = useCollectionsStore((state) => state.setNodeExpanded);
  const createCollection = useCollectionsStore((state) => state.createCollection);
  const createFolder = useCollectionsStore((state) => state.createFolder);
  const renameCollection = useCollectionsStore((state) => state.renameCollection);
  const renameFolder = useCollectionsStore((state) => state.renameFolder);
  const renameRequest = useCollectionsStore((state) => state.renameRequest);
  const duplicateRequest = useCollectionsStore((state) => state.duplicateRequest);
  const deleteCollection = useCollectionsStore((state) => state.deleteCollection);
  const deleteFolder = useCollectionsStore((state) => state.deleteFolder);
  const deleteRequest = useCollectionsStore((state) => state.deleteRequest);

  const [createCollectionDialogOpen, setCreateCollectionDialogOpen] = useState(false);
  const [createFolderCollectionId, setCreateFolderCollectionId] = useState<string | null>(null);
  const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<{
    collectionId: string;
    folderId: string;
  } | null>(null);
  const [deleteRequestTarget, setDeleteRequestTarget] = useState<{
    collectionId: string;
    requestId: string;
  } | null>(null);
  const [renameCollectionTarget, setRenameCollectionTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameFolderTarget, setRenameFolderTarget] = useState<{
    collectionId: string;
    id: string;
    name: string;
  } | null>(null);
  const [renameRequestTarget, setRenameRequestTarget] = useState<{
    collectionId: string;
    id: string;
    name: string;
  } | null>(null);

  const collectionTrees = useMemo(() => {
    return collectionOrder.map((collectionId) => {
      const collection = collectionsById[collectionId];
      const folders = Object.values(foldersByCollection[collectionId] ?? {});
      const requests = Object.values(requestsByCollection[collectionId] ?? {});
      return { collection, folders, requests };
    });
  }, [collectionOrder, collectionsById, foldersByCollection, requestsByCollection]);

  useEffect(() => {
    if (!activeSavedRequestId) {
      return;
    }
    for (const tree of collectionTrees) {
      const request = tree.requests.find((item) => item.id === activeSavedRequestId);
      if (!request) {
        continue;
      }
      setNodeExpanded(tree.collection.id, true);
      if (request.folderId) {
        setNodeExpanded(request.folderId, true);
      }
    }
  }, [activeSavedRequestId, collectionTrees, setNodeExpanded]);

  const handleCreateCollection = async (name: string) => {
    const collection = await createCollection(name);
    setCreateCollectionDialogOpen(false);
    navigate(`/collections/${collection.id}`);
  };

  return (
    <aside
      className={cn(
        `
          flex h-full shrink-0 flex-col
          border-r border-border
          bg-[hsl(var(--sidebar))]
          transition-[width]
          duration-200 ease-out
          overflow-hidden
        `,
        isOpen ? "w-64" : "w-0",
      )}
    >
      <div className="min-w-64">
        <div className="flex items-center justify-between p-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Collections
          </span>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCreateCollectionDialogOpen(true)}
            className="h-7 w-7 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-2">
          <SidebarItem
            icon={<Globe className="h-4 w-4" />}
            label="Environments"
            to="/environments"
          />
        </div>

        <Separator className="my-3" />

        <ScrollArea className="h-[calc(100vh-170px)] px-2">
          <div className="space-y-1 pb-3">
            {collectionTrees.map(({ collection, folders, requests }) => {
              if (!collection) return null;
              return (
                <CollectionNode
                  key={collection.id}
                  collectionId={collection.id}
                  collectionName={collection.name}
                  isActive={activeCollectionId === collection.id}
                  folders={folders}
                  requests={requests}
                  expanded={Boolean(expandedNodeIds[collection.id])}
                  toggleExpanded={() => toggleNodeExpanded(collection.id)}
                  onOpenCollection={() => navigate(`/collections/${collection.id}`)}
                  activeSavedRequestId={activeSavedRequestId}
                  onCreateFolder={() => setCreateFolderCollectionId(collection.id)}
                  onRenameCollection={() =>
                    setRenameCollectionTarget({
                      id: collection.id,
                      name: collection.name,
                    })
                  }
                  onDeleteCollection={() => setDeleteCollectionId(collection.id)}
                  onRenameFolder={(folder) =>
                    setRenameFolderTarget({
                      collectionId: collection.id,
                      id: folder.id,
                      name: folder.name,
                    })
                  }
                  onRenameRequest={(request) =>
                    setRenameRequestTarget({
                      collectionId: collection.id,
                      id: request.id,
                      name: request.name,
                    })
                  }
                  onDuplicateRequest={async (requestId) => {
                    const duplicated = await duplicateRequest(requestId, collection.id);
                    navigate(`/collections/${collection.id}`);
                    openSavedRequest(duplicated);
                  }}
                  onOpenRequest={(request) => {
                    navigate(`/collections/${request.collectionId}`);
                    openSavedRequest(request);
                  }}
                  onDeleteFolder={(folderId) =>
                    setDeleteFolderTarget({
                      collectionId: collection.id,
                      folderId,
                    })
                  }
                  onDeleteRequest={(requestId) =>
                    setDeleteRequestTarget({
                      collectionId: collection.id,
                      requestId,
                    })
                  }
                  expandedNodeIds={expandedNodeIds}
                  toggleNodeExpanded={toggleNodeExpanded}
                />
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <CreateCollectionDialog
        open={createCollectionDialogOpen}
        onOpenChange={setCreateCollectionDialogOpen}
        onCreate={handleCreateCollection}
      />
      <CreateFolderDialog
        open={Boolean(createFolderCollectionId)}
        onOpenChange={() => setCreateFolderCollectionId(null)}
        onCreate={async (name) => {
          if (!createFolderCollectionId) {
            return;
          }
          await createFolder(createFolderCollectionId, name, null);
          setCreateFolderCollectionId(null);
        }}
      />
      <RenameDialog
        open={Boolean(renameCollectionTarget)}
        onOpenChange={() => setRenameCollectionTarget(null)}
        title="Rename Collection"
        submitLabel="Rename"
        placeholder="Collection name"
        initialValue={renameCollectionTarget?.name}
        onSubmit={async (name) => {
          if (!renameCollectionTarget) {
            return;
          }
          await renameCollection(renameCollectionTarget.id, name);
          setRenameCollectionTarget(null);
        }}
      />
      <RenameDialog
        open={Boolean(renameFolderTarget)}
        onOpenChange={() => setRenameFolderTarget(null)}
        title="Rename Folder"
        submitLabel="Rename"
        placeholder="Folder name"
        initialValue={renameFolderTarget?.name}
        onSubmit={async (name) => {
          if (!renameFolderTarget) {
            return;
          }
          await renameFolder(renameFolderTarget.id, renameFolderTarget.collectionId, name);
          setRenameFolderTarget(null);
        }}
      />
      <RenameDialog
        open={Boolean(renameRequestTarget)}
        onOpenChange={() => setRenameRequestTarget(null)}
        title="Rename Request"
        submitLabel="Rename"
        placeholder="Request name"
        initialValue={renameRequestTarget?.name}
        onSubmit={async (name) => {
          if (!renameRequestTarget) {
            return;
          }
          await renameRequest(renameRequestTarget.id, renameRequestTarget.collectionId, name);
          handleRenamedSavedRequest(renameRequestTarget.id, name);
          setRenameRequestTarget(null);
        }}
      />

      <AlertDialog open={Boolean(deleteCollectionId)} onOpenChange={() => setDeleteCollectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the collection, its folders, and all saved requests.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteCollectionId) return;
                await deleteCollection(deleteCollectionId);
                removeCollectionState(deleteCollectionId);
                if (params.id === deleteCollectionId) {
                  const nextCollectionId = useCollectionsStore.getState().collectionOrder[0];
                  if (nextCollectionId) {
                    navigate(`/collections/${nextCollectionId}`);
                  } else {
                    navigate("/", { replace: true });
                  }
                }
                setDeleteCollectionId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={Boolean(deleteFolderTarget)} onOpenChange={() => setDeleteFolderTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Requests in this folder will stay saved and be moved to the collection root.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteFolderTarget) {
                  return;
                }
                await deleteFolder(deleteFolderTarget.folderId, deleteFolderTarget.collectionId);
                setDeleteFolderTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={Boolean(deleteRequestTarget)} onOpenChange={() => setDeleteRequestTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete request?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the saved request from the collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteRequestTarget) {
                  return;
                }
                await deleteRequest(deleteRequestTarget.requestId, deleteRequestTarget.collectionId);
                handleDeletedSavedRequest(deleteRequestTarget.collectionId, deleteRequestTarget.requestId);
                setDeleteRequestTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};

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

function CollectionNode({
  collectionName,
  isActive,
  folders,
  requests,
  expanded,
  activeSavedRequestId,
  toggleExpanded,
  onOpenCollection,
  onCreateFolder,
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
  const rootFolders = folders
    .filter((folder) => !folder.parentFolderId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const rootRequests = requests
    .filter((request) => !request.folderId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Collapsible open={expanded} onOpenChange={toggleExpanded}>
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
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
          </Button>
        </CollapsibleTrigger>
        <button
          className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left text-sm"
          onClick={onOpenCollection}
        >
          {expanded ? <FolderOpen className="h-4 w-4 shrink-0" /> : <Folder className="h-4 w-4 shrink-0" />}
          <span className="truncate">{collectionName}</span>
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
            <DropdownMenuItem onClick={onRenameCollection}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateFolder}>
              <Folder className="mr-2 h-4 w-4" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDeleteCollection}>
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
            onRenameFolder={onRenameFolder}
            onRenameRequest={onRenameRequest}
            onDuplicateRequest={onDuplicateRequest}
            onOpenRequest={onOpenRequest}
            onDeleteFolder={onDeleteFolder}
            onDeleteRequest={onDeleteRequest}
            activeSavedRequestId={activeSavedRequestId}
          />
        ))}
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
      </CollapsibleContent>
    </Collapsible>
  );
}

type FolderNodeProps = {
  folder: FolderType;
  requests: SavedRequest[];
  expandedNodeIds: Record<string, boolean>;
  toggleNodeExpanded: (id: string) => void;
  onRenameFolder: (folder: FolderType) => void;
  onRenameRequest: (request: SavedRequest) => void;
  onDuplicateRequest: (requestId: string) => Promise<void>;
  onOpenRequest: (request: SavedRequest) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteRequest: (requestId: string) => void;
  activeSavedRequestId: string | null;
};

function FolderNode({
  folder,
  requests,
  expandedNodeIds,
  toggleNodeExpanded,
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
    <Collapsible open={expanded} onOpenChange={() => toggleNodeExpanded(folder.id)}>
      <div
        onContextMenu={(event) => {
          event.preventDefault();
          setActionsOpen(true);
        }}
        className="group flex w-full items-center gap-1 rounded-md px-1 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
          </Button>
        </CollapsibleTrigger>
        <button
          className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left text-sm"
          onClick={() => toggleNodeExpanded(folder.id)}
        >
          {expanded ? <FolderOpen className="h-4 w-4 shrink-0" /> : <Folder className="h-4 w-4 shrink-0" />}
          <span className="truncate">{folder.name}</span>
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
            <DropdownMenuItem onClick={() => onRenameFolder(folder)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDeleteFolder(folder.id)}>
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

type RequestNodeProps = {
  request: SavedRequest;
  onRenameRequest: (request: SavedRequest) => void;
  onDuplicateRequest: (requestId: string) => Promise<void>;
  onOpenRequest: (request: SavedRequest) => void;
  onDeleteRequest: (requestId: string) => void;
  isActive: boolean;
};

function RequestNode({
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
        <span className="truncate">{request.name}</span>
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
          <DropdownMenuItem className="text-destructive" onClick={() => onDeleteRequest(request.id)}>
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
