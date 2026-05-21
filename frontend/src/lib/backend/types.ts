export type HttpRequestPayload = {
  id: string;

  method: string;

  url: string;

  headers: Record<string, string>;

  body?: string;
};

export type HttpResponsePayload = {
  status: number;

  statusText: string;

  headers: Record<string, string>;

  body: string;

  duration: number;
};
