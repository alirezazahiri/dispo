import * as HttpService from "~/wailsjs/go/httpclient/HTTPService";
import type {
  HttpRequestPayload,
  HttpResponsePayload,
  WorkspaceStatePayload,
} from "./types";

export const backendClient = {
  sendHttpRequest: (payload: HttpRequestPayload) =>
    HttpService.SendHttpRequest(payload) as Promise<HttpResponsePayload>,
  loadWorkspaceState: () =>
    (window as any).go.httpclient.HTTPService.LoadWorkspaceState() as Promise<WorkspaceStatePayload>,
  saveWorkspaceState: (state: WorkspaceStatePayload) =>
    (window as any).go.httpclient.HTTPService.SaveWorkspaceState(state) as Promise<void>,
};
