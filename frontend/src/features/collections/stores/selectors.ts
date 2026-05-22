import { useCollectionsStore } from "./collections.store";
import type { Folder, SavedRequest } from "../types";

export const useCollectionsReady = () =>
  useCollectionsStore((state) => state.isReady);

export const useCollectionsInitialize = () =>
  useCollectionsStore((state) => state.initialize);

export const useCollectionsData = () =>
  useCollectionsStore((state) => ({
    collectionsById: state.collectionsById,
    collectionOrder: state.collectionOrder,
    foldersByCollection: state.foldersByCollection,
    requestsByCollection: state.requestsByCollection,
    expandedNodeIds: state.expandedNodeIds,
  }));

export function useCollectionFolders(collectionId: string): Folder[] {
  return useCollectionsStore((state) =>
    Object.values(state.foldersByCollection[collectionId] ?? {}).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt,
    ),
  );
}

export function useCollectionRequests(collectionId: string): SavedRequest[] {
  return useCollectionsStore((state) =>
    Object.values(state.requestsByCollection[collectionId] ?? {}).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt,
    ),
  );
}
