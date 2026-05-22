import type { Monaco } from "@monaco-editor/react";

let isConfigured = false;

const scriptApiDeclarations = `
declare type DispoScriptLogLevel = "log" | "info" | "warn" | "error";

declare interface DispoScriptCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
}

declare interface DispoScriptRequestApi {
  getMethod(): string;
  setMethod(method: string): void;
  getUrl(): string;
  setUrl(url: string): void;
  getBody(): string;
  setBody(body: string): void;
  getHeader(key: string): string;
  setHeader(key: string, value: string): void;
  removeHeader(key: string): void;
  headers(): Record<string, string>;
  getParam(key: string): string;
  setParam(key: string, value: string): void;
  removeParam(key: string): void;
  params(): Record<string, string>;
}

declare interface DispoScriptEnvironmentApi {
  name: string;
  get(key: string): string;
  has(key: string): boolean;
  set(key: string, value: string): void;
  unset(key: string): void;
  all(): Record<string, string>;
}

declare interface DispoScriptResponseApi {
  status: number;
  statusText: string;
  durationMs: number;
  size: number;
  headers: Record<string, string>;
  cookies: DispoScriptCookie[];
  text(): string;
  json<T = unknown>(): T;
  getHeader(key: string): string;
}

declare interface DispoScriptUtilsApi {
  uuid(): string;
  btoa(input: string): string;
  atob(input: string): string;
}

declare interface DispoScriptApi {
  request: DispoScriptRequestApi;
  environment: DispoScriptEnvironmentApi;
  response: DispoScriptResponseApi;
  utils: DispoScriptUtilsApi;
}

declare const dispo: DispoScriptApi;

declare interface PMEnvironmentApi {
  get(key: string): string;
  set(key: string, value: string): void;
  unset(key: string): void;
}

declare interface PMHeadersApi {
  add(payload: { key: string; value: string }): void;
  remove(key: string): void;
}

declare interface PMRequestApi {
  method: string;
  url: string;
  body: string;
  headers: PMHeadersApi;
}

declare interface PMResponseApi {
  code: number;
  text(): string;
  json<T = unknown>(): T;
}

declare interface PMApi {
  environment: PMEnvironmentApi;
  request: PMRequestApi;
  response: PMResponseApi;
}

declare const pm: PMApi;
`;

export function configureScriptIntelliSense(monaco: Monaco) {
  if (isConfigured) {
    return;
  }

  const javascriptDefaults = (monaco.languages.typescript as any).javascriptDefaults;
  if (!javascriptDefaults) {
    return;
  }

  javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  javascriptDefaults.addExtraLib(
    scriptApiDeclarations,
    "file:///dispo-script-api.d.ts",
  );

  isConfigured = true;
}
