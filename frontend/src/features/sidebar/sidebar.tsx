import { useEffect, useMemo, useState } from "react";
import { Globe, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

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
  ScrollArea,
  Separator,
} from "@/components/ui";
import { cn, isPresentAndNotEmpty } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import { SidebarItem } from "./sidebar-item";
import { useCollectionsData, useCollectionsStore } from "@/features";
import {
  CollectionNode,
  RequestMethodIcon,
  type CollectionRootDropData,
  type FolderDropData,
  type RequestDragData,
} from "@/features/collections";
import { CollectionAuthDialog } from "@/features/settings/components/collection-auth-dialog";
import {
  useActiveCollectionId,
  useWorkspaceHandleRenamedSavedRequest,
  useActiveSavedRequestId,
  useWorkspaceHandleDeletedSavedRequest,
  useWorkspaceOpenSavedRequest,
  useWorkspaceRemoveCollectionState,
} from "@/features/workspace/stores";
import {
  CreateCollectionDialog,
  CreateFolderDialog,
  RenameDialog,
} from "./components";

// Active draggables go through @dnd-kit/sortable, which decorates the data
// with a `sortable` field. This helper extracts the request payload regardless
// of which adapter produced the drag.
function extractRequestDragData(
  raw: unknown | null | undefined,
): RequestDragData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const data = raw as Partial<RequestDragData>;
  if (
    data.type === "request" &&
    typeof data.requestId === "string" &&
    typeof data.collectionId === "string"
  ) {
    return data as RequestDragData;
  }
  return null;
}

function extractDropData(
  raw: unknown | null | undefined,
): FolderDropData | CollectionRootDropData | RequestDragData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const data = raw as {
    type?: string;
    collectionId?: unknown;
    folderId?: unknown;
  };
  if (data.type === "request") {
    return extractRequestDragData(raw);
  }
  if (data.type === "folder" && typeof data.collectionId === "string") {
    return {
      type: "folder",
      collectionId: data.collectionId,
      folderId: typeof data.folderId === "string" ? data.folderId : "",
    };
  }
  if (
    data.type === "collection-root" &&
    typeof data.collectionId === "string"
  ) {
    return {
      type: "collection-root",
      collectionId: data.collectionId,
      folderId: null,
    };
  }
  return null;
}

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
  const toggleNodeExpanded = useCollectionsStore(
    (state) => state.toggleNodeExpanded,
  );
  const setNodeExpanded = useCollectionsStore((state) => state.setNodeExpanded);
  const createCollection = useCollectionsStore(
    (state) => state.createCollection,
  );
  const createFolder = useCollectionsStore((state) => state.createFolder);
  const createRequest = useCollectionsStore((state) => state.createRequest);
  const renameCollection = useCollectionsStore(
    (state) => state.renameCollection,
  );
  const updateCollectionAuth = useCollectionsStore(
    (state) => state.updateCollectionAuth,
  );
  const renameFolder = useCollectionsStore((state) => state.renameFolder);
  const renameRequest = useCollectionsStore((state) => state.renameRequest);
  const duplicateRequest = useCollectionsStore(
    (state) => state.duplicateRequest,
  );
  const moveRequest = useCollectionsStore((state) => state.moveRequest);
  const deleteCollection = useCollectionsStore(
    (state) => state.deleteCollection,
  );
  const deleteFolder = useCollectionsStore((state) => state.deleteFolder);
  const deleteRequest = useCollectionsStore((state) => state.deleteRequest);

  const handleCreateRequest = async (
    collectionId: string,
    folderId: string | null,
  ) => {
    const created = await createRequest(collectionId, folderId);
    navigate(`/collections/${collectionId}`);
    openSavedRequest(created);
  };

  const [createCollectionDialogOpen, setCreateCollectionDialogOpen] =
    useState(false);
  const [createFolderCollectionId, setCreateFolderCollectionId] = useState<
    string | null
  >(null);
  const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(
    null,
  );
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
  const [collectionAuthTargetId, setCollectionAuthTargetId] = useState<
    string | null
  >(null);
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
  const [activeDrag, setActiveDrag] = useState<RequestDragData | null>(null);

  // PointerSensor with a small activation distance lets clicks pass through —
  // a drag only starts after the pointer moves 5px while pressed.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Priority of drop targets when multiple are under the pointer:
  //   request (sortable item — "insert at this position", most specific)
  //   > folder header (drop into folder, end of list)
  //   > collection-root (drop into collection root, end of list).
  // Uses pointerWithin first (most precise for mouse), with rectIntersection
  // as a fallback so fast drags between rows still resolve to a target.
  const collisionDetection: CollisionDetection = (args) => {
    const { active, droppableContainers } = args;

    const lookup = (id: string | number) =>
      droppableContainers.find((item) => item.id === id);

    const filterOutActive = (collisions: ReturnType<typeof pointerWithin>) =>
      collisions.filter((collision) => collision.id !== active.id);

    let candidates = filterOutActive(pointerWithin(args));
    if (candidates.length === 0) {
      candidates = filterOutActive(rectIntersection(args));
    }
    if (candidates.length === 0) {
      return [];
    }

    const findFirstOfType = (type: "request" | "folder") =>
      candidates.find((collision) => {
        const data = lookup(collision.id)?.data.current as
          | RequestDragData
          | FolderDropData
          | CollectionRootDropData
          | undefined;
        return data?.type === type;
      });

    const requestHit = findFirstOfType("request");
    if (requestHit) {
      return [requestHit];
    }
    const folderHit = findFirstOfType("folder");
    if (folderHit) {
      return [folderHit];
    }
    return candidates;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = extractRequestDragData(event.active.data.current);
    if (data) {
      setActiveDrag(data);
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Reserved hook so dnd-kit keeps tracking `over` consistently across
    // SortableContext boundaries. Intentionally a no-op for state.
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const dragData = extractRequestDragData(event.active.data.current);
    const dropData = extractDropData(event.over?.data.current);

    if (!dragData || !dropData) {
      return;
    }
    // Hard rule: requests can never leave their owning collection.
    if (dragData.collectionId !== dropData.collectionId) {
      return;
    }
    // Dropping on yourself is a no-op.
    if (event.active.id === event.over?.id) {
      return;
    }

    // Resolve the destination folder. Dropping on a sortable request inherits
    // that request's folder; folder/collection-root drops use their own data.
    const targetFolderId =
      dropData.type === "folder"
        ? dropData.folderId
        : dropData.type === "collection-root"
          ? null
          : dropData.folderId;

    // Build the destination list as it currently looks on screen, sorted.
    const destList = Object.values(
      requestsByCollection[dragData.collectionId] ?? {},
    )

      .filter((request) =>
        isPresentAndNotEmpty(request.folderId)
          ? request.folderId === targetFolderId
          : !isPresentAndNotEmpty(targetFolderId),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((request) => request.id);

    const activeIndex = destList.indexOf(dragData.requestId);

    let newOrder: string[];
    if (dropData.type === "request") {
      const overIndex = destList.indexOf(dropData.requestId);
      if (overIndex < 0) {
        return;
      }
      if (activeIndex >= 0) {
        // Reorder within the same list.
        if (activeIndex === overIndex) {
          return;
        }
        newOrder = arrayMove(destList, activeIndex, overIndex);
      } else {
        // Cross-folder move: insert active at over's current position.
        newOrder = [
          ...destList.slice(0, overIndex),
          dragData.requestId,
          ...destList.slice(overIndex),
        ];
      }
    } else {
      // Dropped on a folder header or collection root: append to end.
      if (activeIndex >= 0) {
        if (activeIndex === destList.length - 1) {
          return;
        }
        newOrder = arrayMove(destList, activeIndex, destList.length - 1);
      } else {
        newOrder = [...destList, dragData.requestId];
      }
    }

    moveRequest(
      dragData.requestId,
      dragData.collectionId,
      targetFolderId,
      newOrder,
    ).catch((error) => {
      console.error("[sidebar] moveRequest failed", {
        error,
        dragData,
        dropData,
        targetFolderId,
        newOrder,
      });
    });
  };

  const handleDragCancel = () => {
    setActiveDrag(null);
  };

  const collectionTrees = useMemo(() => {
    return collectionOrder.map((collectionId) => {
      const collection = collectionsById[collectionId];
      const folders = Object.values(foldersByCollection[collectionId] ?? {});
      const requests = Object.values(requestsByCollection[collectionId] ?? {});
      return { collection, folders, requests };
    });
  }, [
    collectionOrder,
    collectionsById,
    foldersByCollection,
    requestsByCollection,
  ]);

  useEffect(() => {
    if (!activeSavedRequestId) {
      return;
    }
    for (const tree of collectionTrees) {
      const request = tree.requests.find(
        (item) => item.id === activeSavedRequestId,
      );
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

        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
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
                    onOpenCollection={() =>
                      navigate(`/collections/${collection.id}`)
                    }
                    activeSavedRequestId={activeSavedRequestId}
                    onCreateFolder={() =>
                      setCreateFolderCollectionId(collection.id)
                    }
                    onCreateRequest={(folderId) =>
                      handleCreateRequest(collection.id, folderId)
                    }
                    onRenameCollection={() =>
                      setRenameCollectionTarget({
                        id: collection.id,
                        name: collection.name,
                      })
                    }
                    onConfigureAuth={() => setCollectionAuthTargetId(collection.id)}
                    onDeleteCollection={() =>
                      setDeleteCollectionId(collection.id)
                    }
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
                      const duplicated = await duplicateRequest(
                        requestId,
                        collection.id,
                      );
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
          <DragOverlay dropAnimation={{ duration: 180 }}>
            {activeDrag ? (
              <div
                className={`
                  flex w-56 items-center gap-2 rounded-md border border-border
                  bg-popover px-2 py-1.5 text-sm text-foreground shadow-lg
                `}
              >
                <RequestMethodIcon method={activeDrag.method} protocol={activeDrag.protocol} />
                <span className="min-w-0 flex-1 truncate">
                  {activeDrag.name}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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
      <CollectionAuthDialog
        open={Boolean(collectionAuthTargetId)}
        onOpenChange={(open) => {
          if (!open) {
            setCollectionAuthTargetId(null);
          }
        }}
        collection={
          collectionAuthTargetId
            ? collectionsById[collectionAuthTargetId] ?? null
            : null
        }
        onSave={async (auth) => {
          if (!collectionAuthTargetId) {
            return;
          }
          await updateCollectionAuth(collectionAuthTargetId, auth);
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
          await renameFolder(
            renameFolderTarget.id,
            renameFolderTarget.collectionId,
            name,
          );
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
          await renameRequest(
            renameRequestTarget.id,
            renameRequestTarget.collectionId,
            name,
          );
          handleRenamedSavedRequest(renameRequestTarget.id, name);
          setRenameRequestTarget(null);
        }}
      />

      <AlertDialog
        open={Boolean(deleteCollectionId)}
        onOpenChange={() => setDeleteCollectionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the collection, its folders, and all
              saved requests.
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
                  const nextCollectionId =
                    useCollectionsStore.getState().collectionOrder[0];
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
      <AlertDialog
        open={Boolean(deleteFolderTarget)}
        onOpenChange={() => setDeleteFolderTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Requests in this folder will stay saved and be moved to the
              collection root.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteFolderTarget) {
                  return;
                }
                await deleteFolder(
                  deleteFolderTarget.folderId,
                  deleteFolderTarget.collectionId,
                );
                setDeleteFolderTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(deleteRequestTarget)}
        onOpenChange={() => setDeleteRequestTarget(null)}
      >
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
                await deleteRequest(
                  deleteRequestTarget.requestId,
                  deleteRequestTarget.collectionId,
                );
                handleDeletedSavedRequest(
                  deleteRequestTarget.collectionId,
                  deleteRequestTarget.requestId,
                );
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
