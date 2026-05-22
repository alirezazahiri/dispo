import { create } from "zustand";

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

export const useCollectionsStore = create<CollectionsStore>()((set, get) => ({
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
    } catch (error) {
      console.error("Failed to initialize collections store", error);
    }
    set({ isReady: true });
  },

  refresh: async () => {
    try {
      const trees = await backendClient.collections.loadAll();
      set({
        ...normalizeTrees(trees),
      });
    } catch (error) {
      console.error("Failed to refresh collections", error);
      set({
        collectionsById: {},
        collectionOrder: [],
        foldersByCollection: {},
        requestsByCollection: {},
      });
    }
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
      delete nextCollectionsById[id];
      delete nextFoldersByCollection[id];
      delete nextRequestsByCollection[id];
      return {
        collectionsById: nextCollectionsById,
        foldersByCollection: nextFoldersByCollection,
        requestsByCollection: nextRequestsByCollection,
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
      delete nextFolders[id];
      return {
        foldersByCollection: {
          ...state.foldersByCollection,
          [collectionId]: nextFolders,
        },
      };
    });
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
      return {
        requestsByCollection: {
          ...state.requestsByCollection,
          [collectionId]: nextRequests,
        },
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
    set((state) => ({
      expandedNodeIds: {
        ...state.expandedNodeIds,
        [id]: expanded,
      },
    }));
  },
}));
