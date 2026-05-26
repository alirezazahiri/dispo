export namespace api {
	
	export class CollectionPayload {
	    id: string;
	    name: string;
	    description: string;
	    sortOrder: number;
	    createdAt: number;
	    updatedAt: number;
	
	    static createFrom(source: any = {}) {
	        return new CollectionPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.sortOrder = source["sortOrder"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class RequestAuthPayload {
	    type: string;
	    bearerToken: string;
	
	    static createFrom(source: any = {}) {
	        return new RequestAuthPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.bearerToken = source["bearerToken"];
	    }
	}
	export class KeyValuePayload {
	    id: string;
	    key: string;
	    value: string;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new KeyValuePayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.key = source["key"];
	        this.value = source["value"];
	        this.enabled = source["enabled"];
	    }
	}
	export class SavedRequestPayload {
	    id: string;
	    collectionId: string;
	    folderId?: string;
	    name: string;
	    method: string;
	    url: string;
	    body: string;
	    preRequestScript: string;
	    postResponseScript: string;
	    headers: KeyValuePayload[];
	    queryParams: KeyValuePayload[];
	    auth: RequestAuthPayload;
	    sortOrder: number;
	    createdAt: number;
	    updatedAt: number;
	
	    static createFrom(source: any = {}) {
	        return new SavedRequestPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.collectionId = source["collectionId"];
	        this.folderId = source["folderId"];
	        this.name = source["name"];
	        this.method = source["method"];
	        this.url = source["url"];
	        this.body = source["body"];
	        this.preRequestScript = source["preRequestScript"];
	        this.postResponseScript = source["postResponseScript"];
	        this.headers = this.convertValues(source["headers"], KeyValuePayload);
	        this.queryParams = this.convertValues(source["queryParams"], KeyValuePayload);
	        this.auth = this.convertValues(source["auth"], RequestAuthPayload);
	        this.sortOrder = source["sortOrder"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FolderPayload {
	    id: string;
	    collectionId: string;
	    parentFolderId?: string;
	    name: string;
	    sortOrder: number;
	    createdAt: number;
	    updatedAt: number;
	
	    static createFrom(source: any = {}) {
	        return new FolderPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.collectionId = source["collectionId"];
	        this.parentFolderId = source["parentFolderId"];
	        this.name = source["name"];
	        this.sortOrder = source["sortOrder"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class CollectionTreePayload {
	    collection: CollectionPayload;
	    folders: FolderPayload[];
	    savedRequests: SavedRequestPayload[];
	
	    static createFrom(source: any = {}) {
	        return new CollectionTreePayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.collection = this.convertValues(source["collection"], CollectionPayload);
	        this.folders = this.convertValues(source["folders"], FolderPayload);
	        this.savedRequests = this.convertValues(source["savedRequests"], SavedRequestPayload);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CreateCollectionInput {
	    name: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateCollectionInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	    }
	}
	export class CreateFolderInput {
	    collectionId: string;
	    parentFolderId?: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateFolderInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.collectionId = source["collectionId"];
	        this.parentFolderId = source["parentFolderId"];
	        this.name = source["name"];
	    }
	}
	export class DeleteEntityInput {
	    id: string;
	
	    static createFrom(source: any = {}) {
	        return new DeleteEntityInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	    }
	}
	export class EnvironmentPayload {
	    id: string;
	    name: string;
	    variables: KeyValuePayload[];
	
	    static createFrom(source: any = {}) {
	        return new EnvironmentPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.variables = this.convertValues(source["variables"], KeyValuePayload);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class HttpRequestPayload {
	    id: string;
	    method: string;
	    url: string;
	    headers: Record<string, string>;
	    body?: string;
	
	    static createFrom(source: any = {}) {
	        return new HttpRequestPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.method = source["method"];
	        this.url = source["url"];
	        this.headers = source["headers"];
	        this.body = source["body"];
	    }
	}
	export class ResponseCookiePayload {
	    name: string;
	    value: string;
	    domain: string;
	    path: string;
	    expires: string;
	    httpOnly: boolean;
	    secure: boolean;
	    sameSite: string;
	
	    static createFrom(source: any = {}) {
	        return new ResponseCookiePayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.value = source["value"];
	        this.domain = source["domain"];
	        this.path = source["path"];
	        this.expires = source["expires"];
	        this.httpOnly = source["httpOnly"];
	        this.secure = source["secure"];
	        this.sameSite = source["sameSite"];
	    }
	}
	export class HttpResponsePayload {
	    status: number;
	    statusText: string;
	    headers: Record<string, string>;
	    cookies: ResponseCookiePayload[];
	    body: string;
	    duration: number;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new HttpResponsePayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.statusText = source["statusText"];
	        this.headers = source["headers"];
	        this.cookies = this.convertValues(source["cookies"], ResponseCookiePayload);
	        this.body = source["body"];
	        this.duration = source["duration"];
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class MoveFolderInput {
	    id: string;
	    newParentFolderId?: string;
	    newSortOrder: number;
	
	    static createFrom(source: any = {}) {
	        return new MoveFolderInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.newParentFolderId = source["newParentFolderId"];
	        this.newSortOrder = source["newSortOrder"];
	    }
	}
	export class MoveSavedRequestInput {
	    id: string;
	    newFolderId?: string;
	    newSortOrder: number;
	
	    static createFrom(source: any = {}) {
	        return new MoveSavedRequestInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.newFolderId = source["newFolderId"];
	        this.newSortOrder = source["newSortOrder"];
	    }
	}
	export class RenameCollectionInput {
	    id: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new RenameCollectionInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	    }
	}
	export class RenameFolderInput {
	    id: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new RenameFolderInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	    }
	}
	export class RenameRequestInput {
	    id: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new RenameRequestInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	    }
	}
	export class ReorderSavedRequestItem {
	    id: string;
	    newFolderId?: string;
	    newSortOrder: number;
	
	    static createFrom(source: any = {}) {
	        return new ReorderSavedRequestItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.newFolderId = source["newFolderId"];
	        this.newSortOrder = source["newSortOrder"];
	    }
	}
	export class ReorderSavedRequestsInput {
	    items: ReorderSavedRequestItem[];
	
	    static createFrom(source: any = {}) {
	        return new ReorderSavedRequestsInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], ReorderSavedRequestItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class RequestTabPayload {
	    id: string;
	    collectionId: string;
	    savedRequestId?: string;
	    layout: string;
	    protocol: string;
	    title: string;
	    method: string;
	    url: string;
	    body: string;
	    preRequestScript: string;
	    postResponseScript: string;
	    headers: KeyValuePayload[];
	    queryParams: KeyValuePayload[];
	    auth: RequestAuthPayload;
	    response?: Record<string, any>;
	    createdAt: number;
	    updatedAt: number;
	
	    static createFrom(source: any = {}) {
	        return new RequestTabPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.collectionId = source["collectionId"];
	        this.savedRequestId = source["savedRequestId"];
	        this.layout = source["layout"];
	        this.protocol = source["protocol"];
	        this.title = source["title"];
	        this.method = source["method"];
	        this.url = source["url"];
	        this.body = source["body"];
	        this.preRequestScript = source["preRequestScript"];
	        this.postResponseScript = source["postResponseScript"];
	        this.headers = this.convertValues(source["headers"], KeyValuePayload);
	        this.queryParams = this.convertValues(source["queryParams"], KeyValuePayload);
	        this.auth = this.convertValues(source["auth"], RequestAuthPayload);
	        this.response = source["response"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class WorkspaceStatePayload {
	    tabs: RequestTabPayload[];
	    tabOrderByCollection: Record<string, Array<string>>;
	    activeTabIdByCollection: Record<string, string>;
	    currentCollectionId: string;
	    environments: EnvironmentPayload[];
	    activeEnvironmentId: string;
	
	    static createFrom(source: any = {}) {
	        return new WorkspaceStatePayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tabs = this.convertValues(source["tabs"], RequestTabPayload);
	        this.tabOrderByCollection = source["tabOrderByCollection"];
	        this.activeTabIdByCollection = source["activeTabIdByCollection"];
	        this.currentCollectionId = source["currentCollectionId"];
	        this.environments = this.convertValues(source["environments"], EnvironmentPayload);
	        this.activeEnvironmentId = source["activeEnvironmentId"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace scripting {
	
	export class ScriptEnvContext {
	    name: string;
	    variables: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new ScriptEnvContext(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.variables = source["variables"];
	    }
	}
	export class ScriptCookie {
	    name: string;
	    value: string;
	    domain: string;
	    path: string;
	    expires: string;
	    httpOnly: boolean;
	    secure: boolean;
	    sameSite: string;
	
	    static createFrom(source: any = {}) {
	        return new ScriptCookie(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.value = source["value"];
	        this.domain = source["domain"];
	        this.path = source["path"];
	        this.expires = source["expires"];
	        this.httpOnly = source["httpOnly"];
	        this.secure = source["secure"];
	        this.sameSite = source["sameSite"];
	    }
	}
	export class ScriptResponse {
	    status: number;
	    statusText: string;
	    headers: Record<string, string>;
	    cookies: ScriptCookie[];
	    body: string;
	    durationMs: number;
	
	    static createFrom(source: any = {}) {
	        return new ScriptResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.statusText = source["statusText"];
	        this.headers = source["headers"];
	        this.cookies = this.convertValues(source["cookies"], ScriptCookie);
	        this.body = source["body"];
	        this.durationMs = source["durationMs"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ScriptRequest {
	    method: string;
	    url: string;
	    body: string;
	    headers: Record<string, string>;
	    params: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new ScriptRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.method = source["method"];
	        this.url = source["url"];
	        this.body = source["body"];
	        this.headers = source["headers"];
	        this.params = source["params"];
	    }
	}
	export class ScriptContext {
	    phase: string;
	    source: string;
	    timeoutMs: number;
	    request: ScriptRequest;
	    response?: ScriptResponse;
	    env: ScriptEnvContext;
	
	    static createFrom(source: any = {}) {
	        return new ScriptContext(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.phase = source["phase"];
	        this.source = source["source"];
	        this.timeoutMs = source["timeoutMs"];
	        this.request = this.convertValues(source["request"], ScriptRequest);
	        this.response = this.convertValues(source["response"], ScriptResponse);
	        this.env = this.convertValues(source["env"], ScriptEnvContext);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class ScriptEnvMutation {
	    operation: string;
	    key: string;
	    value?: string;
	
	    static createFrom(source: any = {}) {
	        return new ScriptEnvMutation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.operation = source["operation"];
	        this.key = source["key"];
	        this.value = source["value"];
	    }
	}
	export class ScriptLogEntry {
	    level: string;
	    message: string;
	    timestamp: number;
	    phase: string;
	    scriptName: string;
	
	    static createFrom(source: any = {}) {
	        return new ScriptLogEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.level = source["level"];
	        this.message = source["message"];
	        this.timestamp = source["timestamp"];
	        this.phase = source["phase"];
	        this.scriptName = source["scriptName"];
	    }
	}
	export class ScriptRequestKVMutation {
	    operation: string;
	    key: string;
	    value?: string;
	
	    static createFrom(source: any = {}) {
	        return new ScriptRequestKVMutation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.operation = source["operation"];
	        this.key = source["key"];
	        this.value = source["value"];
	    }
	}
	export class ScriptRequestMutations {
	    method?: string;
	    url?: string;
	    body?: string;
	    headers: ScriptRequestKVMutation[];
	    params: ScriptRequestKVMutation[];
	
	    static createFrom(source: any = {}) {
	        return new ScriptRequestMutations(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.method = source["method"];
	        this.url = source["url"];
	        this.body = source["body"];
	        this.headers = this.convertValues(source["headers"], ScriptRequestKVMutation);
	        this.params = this.convertValues(source["params"], ScriptRequestKVMutation);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ScriptMutations {
	    request: ScriptRequestMutations;
	    env: ScriptEnvMutation[];
	
	    static createFrom(source: any = {}) {
	        return new ScriptMutations(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.request = this.convertValues(source["request"], ScriptRequestMutations);
	        this.env = this.convertValues(source["env"], ScriptEnvMutation);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	export class ScriptResult {
	    logs: ScriptLogEntry[];
	    mutations: ScriptMutations;
	    error?: string;
	    durationMs: number;
	
	    static createFrom(source: any = {}) {
	        return new ScriptResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.logs = this.convertValues(source["logs"], ScriptLogEntry);
	        this.mutations = this.convertValues(source["mutations"], ScriptMutations);
	        this.error = source["error"];
	        this.durationMs = source["durationMs"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

