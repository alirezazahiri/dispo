import { KeyValuePair } from ".";

export type ResponseStatus = "idle" | "loading" | "success" | "error";

export type ResponseCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
};

export type RequestSnapshot = {
  method: string;
  url: string;
  host: string;
  contentType: string;
  contentLength: number;
  userAgent: string;
  authorization: string;
  headersCount: number;
  queryParamsCount: number;
  body: string;
};

export type ResponseData = {
  status: ResponseStatus;

  statusCode?: number;

  statusText?: string;

  timeMs?: number;

  size?: number;

  headers?: Omit<KeyValuePair, "enabled">[];

  cookies?: ResponseCookie[];

  body?: unknown;

  rawBody?: string;

  requestSnapshot?: RequestSnapshot;

  error?: string;
};
