import { KeyValuePair } from ".";

export type ResponseStatus = "idle" | "loading" | "success" | "error";

export type ResponseData = {
  status: ResponseStatus;

  statusCode?: number;

  statusText?: string;

  timeMs?: number;

  size?: number;

  headers?: Omit<KeyValuePair, "enabled">[];

  cookies?: Record<string, string>;

  body?: unknown;

  rawBody?: string;

  error?: string;
};
