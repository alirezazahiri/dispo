import type {
  FileBodyData,
  FormBodyField,
  KeyValuePair,
  RequestAuth,
  RequestBodyMode,
  HttpMethod,
} from "@/features/workspace/types";
import type {
  FileBodyContentType,
  FormBodyContentType,
  TextBodyContentType,
} from "@/types";

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

  /**
   * General body mode. Mirrors the same union exposed by `RequestTab` so
   * a saved request can fully restore the body editor state.
   */
  bodyMode: RequestBodyMode;

  /**
   * Textual body — populated for `text` and `form` + url-encoded modes.
   * Empty string for `form` + multipart, `file`, and `none`.
   */
  body: string;

  /**
   * Mime type for text bodies. Ignored for non-text modes but still
   * round-tripped so the user keeps their preference across saves.
   */
  bodyContentType: TextBodyContentType;

  formSubtype: FormBodyContentType;

  formFields: FormBodyField[];

  fileContentType: FileBodyContentType | string;

  fileBody: FileBodyData | null;

  graphqlQuery: string;

  graphqlVariables: string;

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
