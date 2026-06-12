import * as HttpService from "~/wailsjs/go/httpservice/HTTPService";
import * as SseService from "~/wailsjs/go/sse/Service";
import * as WsService from "~/wailsjs/go/websocket/Service";
import * as CollectionsService from "~/wailsjs/go/collections/Service";
import type {
  CollectionPayload,
  CollectionTreePayload,
  FolderPayload,
  HttpRequestPayload,
  HttpResponsePayload,
  PickFileOptions,
  PickFileResult,
  SavedRequestPayload,
  ScriptContextPayload,
  ScriptResultPayload,
  SseConnectPayload,
  SseConnectResult,
  WsConnectPayload,
  WsConnectResult,
  WsSendPayload,
  WorkspaceStatePayload,
} from "./types";

// The Wails runtime (`window.go`, `window.runtime`) is injected asynchronously
// in dev mode. App startup is responsible for awaiting it before any consumer
// reaches this module (see `AppBootstrap`). From here on we can call the
// generated bindings directly without per-call guards.
export const backendClient = {
  sendHttpRequest: (payload: HttpRequestPayload) =>
    // The Wails-generated `HttpRequestPayload` carries a `convertValues`
    // helper that we don't need at the call site; cast through `any` for
    // the same reason `collections.saveRequest` does.
    HttpService.SendHttpRequest(payload as any) as Promise<HttpResponsePayload>,
  pickFile: (options: PickFileOptions = {}) =>
    HttpService.PickFile(options as any) as Promise<PickFileResult>,
  loadWorkspaceState: () =>
    (window as any).go.httpservice.HTTPService.LoadWorkspaceState() as Promise<WorkspaceStatePayload>,
  saveWorkspaceState: (state: WorkspaceStatePayload) =>
    (window as any).go.httpservice.HTTPService.SaveWorkspaceState(state) as Promise<void>,
  runScript: (context: ScriptContextPayload) =>
    (window as any).go.scripting.Service.RunScript(context) as Promise<ScriptResultPayload>,
  sse: {
    connect: (payload: SseConnectPayload) =>
      SseService.Connect(payload as any) as Promise<SseConnectResult>,
    disconnect: (connectionId: string) => SseService.Disconnect(connectionId),
  },
  websocket: {
    connect: (payload: WsConnectPayload) =>
      WsService.Connect(payload as any) as Promise<WsConnectResult>,
    disconnect: (connectionId: string) => WsService.Disconnect(connectionId),
    sendMessage: (payload: WsSendPayload) => WsService.SendMessage(payload as any),
    readFileBase64: (path: string) => WsService.ReadFileBase64(path) as Promise<string>,
  },
  collections: {
    loadAll: () => CollectionsService.LoadAllCollections() as Promise<CollectionTreePayload[]>,
    createCollection: (name: string, description = "") =>
      CollectionsService.CreateCollection({ name, description }) as Promise<CollectionPayload>,
    renameCollection: (id: string, name: string) =>
      CollectionsService.RenameCollection({ id, name }) as Promise<void>,
    updateCollectionAuth: (
      id: string,
      auth: { type: string; bearerToken: string },
    ) =>
      CollectionsService.UpdateCollectionAuth({ id, auth } as any) as Promise<CollectionPayload>,
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
    reorderRequests: (
      items: Array<{
        id: string;
        newFolderId: string | null;
        newSortOrder: number;
      }>,
    ) =>
      // Cast through any: the Wails-generated type is a class with a
      // `convertValues` method that we don't need at the call site — the
      // runtime bridge accepts the plain JSON shape.
      CollectionsService.ReorderRequests({
        items: items.map((item) => ({
          id: item.id,
          newFolderId: item.newFolderId ?? undefined,
          newSortOrder: item.newSortOrder,
        })),
      } as any) as Promise<void>,
    deleteRequest: (id: string) =>
      CollectionsService.DeleteRequest({ id }) as Promise<void>,
    renameRequest: (id: string, name: string) =>
      CollectionsService.RenameRequest({ id, name }) as Promise<void>,
    duplicateRequest: (id: string) =>
      CollectionsService.DuplicateRequest({ id }) as Promise<SavedRequestPayload>,
  },
};
