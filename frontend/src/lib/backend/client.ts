import * as HttpService from "~/wailsjs/go/httpclient/HTTPService";
import * as CollectionsService from "~/wailsjs/go/collections/Service";
import type {
  CollectionPayload,
  CollectionTreePayload,
  FolderPayload,
  HttpRequestPayload,
  HttpResponsePayload,
  SavedRequestPayload,
  ScriptContextPayload,
  ScriptResultPayload,
  WorkspaceStatePayload,
} from "./types";

// The Wails runtime (`window.go`, `window.runtime`) is injected asynchronously
// in dev mode. App startup is responsible for awaiting it before any consumer
// reaches this module (see `AppBootstrap`). From here on we can call the
// generated bindings directly without per-call guards.
export const backendClient = {
  sendHttpRequest: (payload: HttpRequestPayload) =>
    HttpService.SendHttpRequest(payload) as Promise<HttpResponsePayload>,
  loadWorkspaceState: () =>
    (window as any).go.httpclient.HTTPService.LoadWorkspaceState() as Promise<WorkspaceStatePayload>,
  saveWorkspaceState: (state: WorkspaceStatePayload) =>
    (window as any).go.httpclient.HTTPService.SaveWorkspaceState(state) as Promise<void>,
  runScript: (context: ScriptContextPayload) =>
    (window as any).go.scripting.Service.RunScript(context) as Promise<ScriptResultPayload>,
  collections: {
    loadAll: () => CollectionsService.LoadAllCollections() as Promise<CollectionTreePayload[]>,
    createCollection: (name: string, description = "") =>
      CollectionsService.CreateCollection({ name, description }) as Promise<CollectionPayload>,
    renameCollection: (id: string, name: string) =>
      CollectionsService.RenameCollection({ id, name }) as Promise<void>,
    deleteCollection: (id: string) =>
      CollectionsService.DeleteCollection({ id }) as Promise<void>,
    createFolder: (collectionId: string, name: string, parentFolderId: string | null = null) =>
      CollectionsService.CreateFolder({
        collectionId,
        parentFolderId: parentFolderId ?? undefined,
        name,
      }) as Promise<FolderPayload>,
    renameFolder: (id: string, name: string) =>
      CollectionsService.RenameFolder({ id, name }) as Promise<void>,
    moveFolder: (id: string, newParentFolderId: string | null, newSortOrder: number) =>
      CollectionsService.MoveFolder({
        id,
        newParentFolderId: newParentFolderId ?? undefined,
        newSortOrder,
      }) as Promise<void>,
    deleteFolder: (id: string) =>
      CollectionsService.DeleteFolder({ id }) as Promise<void>,
    saveRequest: (payload: SavedRequestPayload) =>
      CollectionsService.SaveRequest(payload as any) as Promise<SavedRequestPayload>,
    moveRequest: (id: string, newFolderId: string | null, newSortOrder: number) =>
      CollectionsService.MoveRequest({
        id,
        newFolderId: newFolderId ?? undefined,
        newSortOrder,
      }) as Promise<void>,
    deleteRequest: (id: string) =>
      CollectionsService.DeleteRequest({ id }) as Promise<void>,
    renameRequest: (id: string, name: string) =>
      CollectionsService.RenameRequest({ id, name }) as Promise<void>,
    duplicateRequest: (id: string) =>
      CollectionsService.DuplicateRequest({ id }) as Promise<SavedRequestPayload>,
  },
};
