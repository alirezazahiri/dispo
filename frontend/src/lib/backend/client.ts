import * as HttpService from "~/wailsjs/go/httpclient/HTTPService";
import type {
  HttpRequestPayload,
  HttpResponsePayload,
  ScriptContextPayload,
  ScriptResultPayload,
  WorkspaceStatePayload,
} from "./types";

export const backendClient = {
  sendHttpRequest: (payload: HttpRequestPayload) =>
    HttpService.SendHttpRequest(payload) as Promise<HttpResponsePayload>,
  loadWorkspaceState: () =>
    (window as any).go.httpclient.HTTPService.LoadWorkspaceState() as Promise<WorkspaceStatePayload>,
  saveWorkspaceState: (state: WorkspaceStatePayload) =>
    (window as any).go.httpclient.HTTPService.SaveWorkspaceState(state) as Promise<void>,
  runScript: (context: ScriptContextPayload) =>
    (window as any).go.scripting.Service.RunScript(context) as Promise<ScriptResultPayload>,
};
