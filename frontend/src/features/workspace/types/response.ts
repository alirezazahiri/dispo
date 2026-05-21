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

  error?: string;
};
