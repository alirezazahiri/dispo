import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { backendClient } from "@/lib/backend/client";
import type { Collection, CollectionTree, Folder, SavedRequest } from "../types";

type CollectionsStore = {
  collectionsById: Record<string, Collection>;
  collectionOrder: string[];
  foldersByCollection: Record<string, Record<string, Folder>>;
  requestsByCollection: Record<string, Record<string, SavedRequest>>;
  expandedNodeIds: Record<string, boolean>;
  isReady: boolean;

  initialize: () => Promise<void>;
  refresh: () => Promise<void>;

  createCollection: (name: string, description?: string) => Promise<Collection>;
  renameCollection: (id: string, name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;

  createFolder: (
    collectionId: string,
    name: string,
    parentFolderId?: string | null,
  ) => Promise<Folder>;
  renameFolder: (id: string, collectionId: string, name: string) => Promise<void>;
  deleteFolder: (id: string, collectionId: string) => Promise<void>;

  renameRequest: (id: string, collectionId: string, name: string) => Promise<void>;
  duplicateRequest: (id: string, collectionId: string) => Promise<SavedRequest>;
  upsertRequest: (savedRequest: SavedRequest) => void;
  deleteRequest: (id: string, collectionId: string) => Promise<void>;

  toggleNodeExpanded: (id: string) => void;
  setNodeExpanded: (id: string, expanded: boolean) => void;
};

function normalizeTrees(trees: CollectionTree[]) {
  const collectionsById: Record<string, Collection> = {};
  const collectionOrder: string[] = [];
  const foldersByCollection: Record<string, Record<string, Folder>> = {};
  const requestsByCollection: Record<string, Record<string, SavedRequest>> = {};

  for (const tree of trees) {
    const collection = tree.collection;
    collectionsById[collection.id] = collection;
    collectionOrder.push(collection.id);

    foldersByCollection[collection.id] = tree.folders.reduce<Record<string, Folder>>((acc, folder) => {
      acc[folder.id] = folder;
      return acc;
    }, {});

    requestsByCollection[collection.id] = tree.savedRequests.reduce<Record<string, SavedRequest>>(
      (acc, request) => {
        acc[request.id] = request;
        return acc;
      },
      {},
    );
  }

  return {
    collectionsById,
    collectionOrder,
    foldersByCollection,
    requestsByCollection,
  };
}

export const useCollectionsStore = create<CollectionsStore>()(
  persist(
    (set, get) => ({
      collectionsById: {},
      collectionOrder: [],
      foldersByCollection: {},
      requestsByCollection: {},
      expandedNodeIds: {},
      isReady: false,

      initialize: async () => {
        if (get().isReady) {
          return;
        }
        try {
          await get().refresh();
          set({ isReady: true });
        } catch (error) {
          console.error("Failed to initialize collections store", error);
          toast.error("Failed to load collections");
          throw error;
        }
      },

      refresh: async () => {
        const trees = await backendClient.collections.loadAll();
        set({
          ...normalizeTrees(trees),
        });
      },

      createCollection: async (name, description = "") => {
        const collection = await backendClient.collections.createCollection(name, description);
        set((state) => ({
          collectionsById: {
            ...state.collectionsById,
            [collection.id]: collection,
          },
          collectionOrder: [...state.collectionOrder, collection.id],
          foldersByCollection: {
            ...state.foldersByCollection,
            [collection.id]: {},
          },
          requestsByCollection: {
            ...state.requestsByCollection,
            [collection.id]: {},
          },
          expandedNodeIds: {
            ...state.expandedNodeIds,
            [collection.id]: true,
          },
        }));
        return collection;
      },

      renameCollection: async (id, name) => {
        await backendClient.collections.renameCollection(id, name);
        set((state) => ({
          collectionsById: {
            ...state.collectionsById,
            [id]: {
              ...state.collectionsById[id],
              name,
            },
          },
        }));
      },

      deleteCollection: async (id) => {
        await backendClient.collections.deleteCollection(id);
        set((state) => {
          const nextCollectionsById = { ...state.collectionsById };
          const nextFoldersByCollection = { ...state.foldersByCollection };
          const nextRequestsByCollection = { ...state.requestsByCollection };
          const nextExpandedNodeIds = { ...state.expandedNodeIds };
          delete nextCollectionsById[id];
          for (const folderId of Object.keys(nextFoldersByCollection[id] ?? {})) {
            delete nextExpandedNodeIds[folderId];
          }
          for (const requestId of Object.keys(nextRequestsByCollection[id] ?? {})) {
            delete nextExpandedNodeIds[requestId];
          }
          delete nextExpandedNodeIds[id];
          delete nextFoldersByCollection[id];
          delete nextRequestsByCollection[id];
          return {
            collectionsById: nextCollectionsById,
            foldersByCollection: nextFoldersByCollection,
            requestsByCollection: nextRequestsByCollection,
            expandedNodeIds: nextExpandedNodeIds,
            collectionOrder: state.collectionOrder.filter((collectionId) => collectionId !== id),
          };
        });
      },

      createFolder: async (collectionId, name, parentFolderId = null) => {
        const folder = await backendClient.collections.createFolder(collectionId, name, parentFolderId);
        set((state) => ({
          foldersByCollection: {
            ...state.foldersByCollection,
            [collectionId]: {
              ...(state.foldersByCollection[collectionId] ?? {}),
              [folder.id]: folder,
            },
          },
          expandedNodeIds: {
            ...state.expandedNodeIds,
            [folder.id]: true,
            [collectionId]: true,
          },
        }));
        return folder;
      },

      renameFolder: async (id, collectionId, name) => {
        await backendClient.collections.renameFolder(id, name);
        set((state) => ({
          foldersByCollection: {
            ...state.foldersByCollection,
            [collectionId]: {
              ...(state.foldersByCollection[collectionId] ?? {}),
              [id]: {
                ...state.foldersByCollection[collectionId]?.[id],
                name,
              },
            },
          },
        }));
      },

      deleteFolder: async (id, collectionId) => {
        await backendClient.collections.deleteFolder(id);
        set((state) => {
          const nextFolders = { ...(state.foldersByCollection[collectionId] ?? {}) };
          const removedFolderIDs = new Set<string>([id]);
          let changed = true;
          while (changed) {
            changed = false;
            for (const folder of Object.values(nextFolders)) {
              if (folder.parentFolderId && removedFolderIDs.has(folder.parentFolderId)) {
                removedFolderIDs.add(folder.id);
                changed = true;
              }
            }
          }
          for (const folderId of removedFolderIDs) {
            delete nextFolders[folderId];
          }

          const nextRequests = { ...(state.requestsByCollection[collectionId] ?? {}) };
          for (const request of Object.values(nextRequests)) {
            if (request.folderId && removedFolderIDs.has(request.folderId)) {
              nextRequests[request.id] = {
                ...request,
                folderId: null,
              };
            }
          }

          const nextExpandedNodeIds = { ...state.expandedNodeIds };
          for (const folderId of removedFolderIDs) {
            delete nextExpandedNodeIds[folderId];
          }

          return {
            foldersByCollection: {
              ...state.foldersByCollection,
              [collectionId]: nextFolders,
            },
            requestsByCollection: {
              ...state.requestsByCollection,
              [collectionId]: nextRequests,
            },
            expandedNodeIds: nextExpandedNodeIds,
          };
        });
      },

      renameRequest: async (id, collectionId, name) => {
        await backendClient.collections.renameRequest(id, name);
        const resolvedCollectionId = (() => {
          const direct = get().requestsByCollection[collectionId]?.[id];
          if (direct) {
            return collectionId;
          }
          return (
            Object.entries(get().requestsByCollection).find(([, requests]) => Boolean(requests[id]))?.[0] ??
            collectionId
          );
        })();
        set((state) => ({
          requestsByCollection: {
            ...state.requestsByCollection,
            [resolvedCollectionId]: {
              ...(state.requestsByCollection[resolvedCollectionId] ?? {}),
              [id]: {
                ...state.requestsByCollection[resolvedCollectionId]?.[id],
                name,
              },
            },
          },
        }));
      },

      duplicateRequest: async (id, collectionId) => {
        const duplicated = await backendClient.collections.duplicateRequest(id);
        set((state) => ({
          requestsByCollection: {
            ...state.requestsByCollection,
            [collectionId]: {
              ...(state.requestsByCollection[collectionId] ?? {}),
              [duplicated.id]: duplicated,
            },
          },
          expandedNodeIds: {
            ...state.expandedNodeIds,
            [collectionId]: true,
          },
        }));
        return duplicated;
      },

      upsertRequest: (savedRequest) => {
        set((state) => ({
          requestsByCollection: {
            ...state.requestsByCollection,
            [savedRequest.collectionId]: {
              ...(state.requestsByCollection[savedRequest.collectionId] ?? {}),
              [savedRequest.id]: savedRequest,
            },
          },
        }));
      },

      deleteRequest: async (id, collectionId) => {
        await backendClient.collections.deleteRequest(id);
        set((state) => {
          const nextRequests = { ...(state.requestsByCollection[collectionId] ?? {}) };
          delete nextRequests[id];
          const nextExpandedNodeIds = { ...state.expandedNodeIds };
          delete nextExpandedNodeIds[id];
          return {
            requestsByCollection: {
              ...state.requestsByCollection,
              [collectionId]: nextRequests,
            },
            expandedNodeIds: nextExpandedNodeIds,
          };
        });
      },

      toggleNodeExpanded: (id) => {
        set((state) => ({
          expandedNodeIds: {
            ...state.expandedNodeIds,
            [id]: !state.expandedNodeIds[id],
          },
        }));
      },

      setNodeExpanded: (id, expanded) => {
        set((state) => {
          if (state.expandedNodeIds[id] === expanded) {
            return state;
          }
          return {
            expandedNodeIds: {
              ...state.expandedNodeIds,
              [id]: expanded,
            },
          };
        });
      },
    }),
    {
      name: "collections-sidebar-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ expandedNodeIds: state.expandedNodeIds }),
    },
  ),
);
