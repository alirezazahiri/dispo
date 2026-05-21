import type { RequestTab } from "../../types";
import { CopyButton } from "@/components/shared";
import type { RequestSnapshot } from "../../types/response";

type Props = {
  tab: RequestTab;
};

type DetailItem = {
  label: string;
  value: string;
};

export function ResponseRequestDetailsView({ tab }: Props) {
  const snapshot = tab.response?.requestSnapshot;
  const details = buildRequestDetails(tab, snapshot);
  const requestBody = snapshot?.body ?? tab.body ?? "";
  const subtitle = snapshot
    ? "Captured snapshot from the last send attempt."
    : "No send snapshot yet. Showing current request draft values.";

  return (
    <div className="h-full min-h-0 overflow-auto">
      <div className="border-b border-border px-4 py-3">
        <div className="text-sm font-medium">Request Details</div>
        <div className="text-xs text-muted-foreground mt-1">
          {subtitle}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid gap-2">
          {details.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[160px_1fr] gap-3 rounded-md border border-border bg-card px-3 py-2"
            >
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {item.label}
              </div>
              <div className="flex min-w-0 items-start gap-2">
                <div className="text-sm font-mono break-all min-w-0 flex-1">{item.value}</div>
                <CopyButton value={item.value} variant="icon" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground flex items-center justify-between gap-2">
            <span>Request Body</span>
            <CopyButton value={requestBody || ""} variant="inline">
              Copy Body
            </CopyButton>
          </div>
          <pre className="max-h-[260px] overflow-auto p-3 text-xs font-mono whitespace-pre-wrap break-words text-foreground">
            {requestBody || "(empty)"}
          </pre>
        </div>
      </div>
    </div>
  );
}

function buildRequestDetails(
  tab: RequestTab,
  snapshot?: RequestSnapshot,
): DetailItem[] {
  if (snapshot) {
    return [
      { label: "Method", value: snapshot.method },
      { label: "URL", value: snapshot.url || "(empty)" },
      { label: "Host", value: snapshot.host },
      { label: "Content-Type", value: snapshot.contentType },
      { label: "Content-Length", value: String(snapshot.contentLength) },
      { label: "User-Agent", value: snapshot.userAgent },
      { label: "Authorization", value: snapshot.authorization },
      { label: "Headers Count", value: String(snapshot.headersCount) },
      { label: "Query Params Count", value: String(snapshot.queryParamsCount) },
    ];
  }

  const enabledHeaders = tab.headers.filter(
    (header) => header.enabled && header.key.trim(),
  );

  const headersMap = enabledHeaders.reduce<Record<string, string>>((acc, header) => {
    const key = header.key.trim().toLowerCase();
    const value = header.value;
    acc[key] = value;
    return acc;
  }, {});

  const body = tab.body || "";

  const authorization =
    tab.auth.type === "bearer" && tab.auth.bearerToken.trim()
      ? `Bearer ${tab.auth.bearerToken}`
      : headersMap.authorization || "Not set";

  const userAgent = headersMap["user-agent"] || "dispo/1.0";
  const contentType = headersMap["content-type"] || "Not set";
  const host = extractHost(tab.url || "");
  const contentLength = String(new TextEncoder().encode(body).length);
  const queryParamsCount = tab.queryParams.filter(
    (param) => param.enabled && param.key.trim(),
  ).length;

  return [
    { label: "Method", value: tab.method },
    { label: "URL", value: tab.url || "(empty)" },
    { label: "Host", value: host },
    { label: "Content-Type", value: contentType },
    { label: "Content-Length", value: contentLength },
    { label: "User-Agent", value: userAgent },
    { label: "Authorization", value: authorization },
    { label: "Headers Count", value: String(enabledHeaders.length) },
    { label: "Query Params Count", value: String(queryParamsCount) },
  ];
}

function extractHost(url: string) {
  if (!url) {
    return "Not set";
  }

  try {
    return new URL(url).host;
  } catch {
    return "Invalid URL";
  }
}
