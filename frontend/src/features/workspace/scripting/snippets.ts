export type ScriptSnippet = {
  id: string;
  label: string;
  phase: "pre" | "post";
  code: string;
};

export const SCRIPT_SNIPPETS: ScriptSnippet[] = [
  {
    id: "pre-read-env",
    label: "Read environment variable",
    phase: "pre",
    code: `const token = dispo.environment.get("token");
if (token) {
  dispo.request.setHeader("Authorization", "Bearer " + token);
}
console.log("Pre-request token applied:", Boolean(token));`,
  },
  {
    id: "post-save-header",
    label: "Save response header to env",
    phase: "post",
    code: `const requestId = dispo.response.getHeader("x-request-id");
if (requestId) {
  dispo.environment.set("lastRequestId", requestId);
}
console.log("Saved request id:", requestId);`,
  },
  {
    id: "post-save-json-token",
    label: "Save token from JSON response",
    phase: "post",
    code: `const data = dispo.response.json();
if (data && data.access_token) {
  dispo.environment.set("token", String(data.access_token));
}
console.log("Token updated from response");`,
  },
];
