export namespace api {
	
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
	export class HttpResponsePayload {
	    status: number;
	    statusText: string;
	    headers: Record<string, string>;
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
	        this.body = source["body"];
	        this.duration = source["duration"];
	        this.error = source["error"];
	    }
	}

}

