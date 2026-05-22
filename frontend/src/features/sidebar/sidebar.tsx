import { useMemo, useState } from "react";
import { ChevronRight, Folder, FolderOpen, Globe, Plus, FileText, Trash2 } from "lucide-react";
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  ScrollArea,
  Separator,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import { SidebarItem } from "./sidebar-item";
import { useCollectionsStore } from "@/features";
import { useWorkspaceOpenSavedRequest } from "@/features/workspace/stores";
import type { Folder as FolderType, SavedRequest } from "@/features";

export const Sidebar = () => {
  const isOpen = useSidebarStore((state) => state.isOpen);
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openSavedRequest = useWorkspaceOpenSavedRequest();

  const collectionOrder = useCollectionsStore((state) => state.collectionOrder);
  const collectionsById = useCollectionsStore((state) => state.collectionsById);
  const foldersByCollection = useCollectionsStore((state) => state.foldersByCollection);
  const requestsByCollection = useCollectionsStore((state) => state.requestsByCollection);
  const expandedNodeIds = useCollectionsStore((state) => state.expandedNodeIds);
  const toggleNodeExpanded = useCollectionsStore((state) => state.toggleNodeExpanded);
  const createCollection = useCollectionsStore((state) => state.createCollection);
  const createFolder = useCollectionsStore((state) => state.createFolder);
  const deleteCollection = useCollectionsStore((state) => state.deleteCollection);
  const deleteFolder = useCollectionsStore((state) => state.deleteFolder);
  const deleteRequest = useCollectionsStore((state) => state.deleteRequest);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(null);

  const collectionTrees = useMemo(() => {
    return collectionOrder.map((collectionId) => {
      const collection = collectionsById[collectionId];
      const folders = Object.values(foldersByCollection[collectionId] ?? {});
      const requests = Object.values(requestsByCollection[collectionId] ?? {});
      return { collection, folders, requests };
    });
  }, [collectionOrder, collectionsById, foldersByCollection, requestsByCollection]);

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    const collection = await createCollection(name);
    setNewCollectionName("");
    setCreateDialogOpen(false);
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
            onClick={() => setCreateDialogOpen(true)}
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
                  isActive={params.id === collection.id}
                  folders={folders}
                  requests={requests}
                  expanded={Boolean(expandedNodeIds[collection.id])}
                  toggleExpanded={() => toggleNodeExpanded(collection.id)}
                  onOpenCollection={() => navigate(`/collections/${collection.id}`)}
                  onCreateFolder={async () => {
                    const name = window.prompt("Folder name");
                    if (!name) return;
                    await createFolder(collection.id, name);
                  }}
                  onDeleteCollection={() => setDeleteCollectionId(collection.id)}
                  onOpenRequest={(request) => {
                    navigate(`/collections/${request.collectionId}`);
                    openSavedRequest(request);
                  }}
                  onDeleteFolder={async (folderId) => deleteFolder(folderId, collection.id)}
                  onDeleteRequest={async (requestId) => deleteRequest(requestId, collection.id)}
                  expandedNodeIds={expandedNodeIds}
                  toggleNodeExpanded={toggleNodeExpanded}
                />
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Collection name"
            value={newCollectionName}
            onChange={(event) => setNewCollectionName(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCollection}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                if (params.id === deleteCollectionId) {
                  const nextCollectionId = useCollectionsStore.getState().collectionOrder[0];
                  if (nextCollectionId) {
                    navigate(`/collections/${nextCollectionId}`);
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
  toggleExpanded: () => void;
  onOpenCollection: () => void;
  onCreateFolder: () => Promise<void>;
  onDeleteCollection: () => void;
  onOpenRequest: (request: SavedRequest) => void;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onDeleteRequest: (requestId: string) => Promise<void>;
  expandedNodeIds: Record<string, boolean>;
  toggleNodeExpanded: (id: string) => void;
};

function CollectionNode({
  collectionName,
  isActive,
  folders,
  requests,
  expanded,
  toggleExpanded,
  onOpenCollection,
  onCreateFolder,
  onDeleteCollection,
  onOpenRequest,
  onDeleteFolder,
  onDeleteRequest,
  expandedNodeIds,
  toggleNodeExpanded,
}: CollectionNodeProps) {
  const rootFolders = folders
    .filter((folder) => !folder.parentFolderId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const rootRequests = requests
    .filter((request) => !request.folderId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Collapsible open={expanded} onOpenChange={toggleExpanded}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              onClick={(event) => {
                event.preventDefault();
                onOpenCollection();
              }}
            >
              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
              {expanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
              <span className="truncate">{collectionName}</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1 pl-4">
            {rootFolders.map((folder) => (
              <FolderNode
                key={folder.id}
                folder={folder}
                allFolders={folders}
                requests={requests}
                expandedNodeIds={expandedNodeIds}
                toggleNodeExpanded={toggleNodeExpanded}
                onOpenRequest={onOpenRequest}
                onDeleteFolder={onDeleteFolder}
                onDeleteRequest={onDeleteRequest}
              />
            ))}
            {rootRequests.map((request) => (
              <RequestNode
                key={request.id}
                request={request}
                onOpenRequest={onOpenRequest}
                onDeleteRequest={onDeleteRequest}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onOpenCollection}>Open Collection</ContextMenuItem>
        <ContextMenuItem onClick={() => void onCreateFolder()}>New Folder</ContextMenuItem>
        <ContextMenuItem className="text-destructive" onClick={onDeleteCollection}>
          Delete Collection
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

type FolderNodeProps = {
  folder: FolderType;
  allFolders: FolderType[];
  requests: SavedRequest[];
  expandedNodeIds: Record<string, boolean>;
  toggleNodeExpanded: (id: string) => void;
  onOpenRequest: (request: SavedRequest) => void;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onDeleteRequest: (requestId: string) => Promise<void>;
};

function FolderNode({
  folder,
  allFolders,
  requests,
  expandedNodeIds,
  toggleNodeExpanded,
  onOpenRequest,
  onDeleteFolder,
  onDeleteRequest,
}: FolderNodeProps) {
  const expanded = Boolean(expandedNodeIds[folder.id]);
  const childrenFolders = allFolders
    .filter((item) => item.parentFolderId === folder.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const childrenRequests = requests
    .filter((request) => request.folderId === folder.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Collapsible open={expanded} onOpenChange={() => toggleNodeExpanded(folder.id)}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
              {expanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
              <span className="truncate">{folder.name}</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1 pl-4">
            {childrenFolders.map((childFolder) => (
              <FolderNode
                key={childFolder.id}
                folder={childFolder}
                allFolders={allFolders}
                requests={requests}
                expandedNodeIds={expandedNodeIds}
                toggleNodeExpanded={toggleNodeExpanded}
                onOpenRequest={onOpenRequest}
                onDeleteFolder={onDeleteFolder}
                onDeleteRequest={onDeleteRequest}
              />
            ))}
            {childrenRequests.map((request) => (
              <RequestNode
                key={request.id}
                request={request}
                onOpenRequest={onOpenRequest}
                onDeleteRequest={onDeleteRequest}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem className="text-destructive" onClick={() => void onDeleteFolder(folder.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Folder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

type RequestNodeProps = {
  request: SavedRequest;
  onOpenRequest: (request: SavedRequest) => void;
  onDeleteRequest: (requestId: string) => Promise<void>;
};

function RequestNode({ request, onOpenRequest, onDeleteRequest }: RequestNodeProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <button
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => onOpenRequest(request)}
        >
          <FileText className="h-4 w-4" />
          <span className="truncate">{request.name}</span>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onOpenRequest(request)}>Open Request</ContextMenuItem>
        <ContextMenuItem className="text-destructive" onClick={() => void onDeleteRequest(request.id)}>
          Delete Request
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
