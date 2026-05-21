export type ResponseStatus = "idle" | "loading" | "success" | "error";

export type ResponseData = {
  status: ResponseStatus;

  statusCode?: number;

  statusText?: string;

  timeMs?: number;

  size?: number;

  headers?: Record<string, string>;

  cookies?: Record<string, string>;

  body?: unknown;

  rawBody?: string;

  error?: string;
};
