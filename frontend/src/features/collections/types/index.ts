import type {
  KeyValuePair,
  RequestAuth,
  HttpMethod,
} from "@/features/workspace/types";

export type Collection = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

export type Folder = {
  id: string;
  collectionId: string;
  parentFolderId: string | null;
  name: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

export type SavedRequest = {
  id: string;
  collectionId: string;
  folderId: string | null;
  name: string;
  method: HttpMethod;
  url: string;
  body: string;
  preRequestScript: string;
  postResponseScript: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  auth: RequestAuth;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

export type CollectionTree = {
  collection: Collection;
  folders: Folder[];
  savedRequests: SavedRequest[];
};

export type CollectionRootDropData = {
  type: "collection-root";
  collectionId: string;
  folderId: null;
};

export type FolderDropData = {
  type: "folder";
  collectionId: string;
  folderId: string;
};

export type RequestDragData = {
  type: "request";
  requestId: string;
  collectionId: string;
  folderId: string | null;
  name: string;
  method: HttpMethod;
};
