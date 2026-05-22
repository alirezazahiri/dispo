import { Download } from "lucide-react";
import { Badge, Button, ScrollArea } from "@/components";

import type { RequestTab } from "../../types";
import { CopyButton } from "@/components/shared";

type Props = {
  tab: RequestTab;
};

export function ResponseRawView({ tab }: Props) {
  const response = tab.response;

  if (!response) {
    return <EmptyState />;
  }

  const rawResponse = buildRawResponse(response);

  const handleDownload = () => {
    const blob = new Blob([rawResponse], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;

    anchor.download = "response.txt";

    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="
        flex h-full min-h-0 flex-col
      "
    >
      <div
        className="
          flex h-11 shrink-0
          items-center justify-between
          border-b border-border
          bg-background px-4
        "
      >
        <div
          className="
            flex items-center gap-2
          "
        >
          <Badge
            variant={response.status === "success" ? "default" : "destructive"}
          >
            {response.statusCode}
          </Badge>

          <span
            className="
              text-sm text-muted-foreground
            "
          >
            {response.statusText}
          </span>
        </div>

        <div
          className="
            flex items-center gap-2
          "
        >
          <CopyButton value={rawResponse} variant="toolbar" />

          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <ScrollArea
        className="
          min-h-0 flex-1
        "
      >
        <pre
          className="
            min-h-full whitespace-pre-wrap
            break-all
            p-4 font-mono text-xs
            leading-6 text-foreground
          "
        >
          {rawResponse}
        </pre>
      </ScrollArea>
    </div>
  );
}

function buildRawResponse(response: NonNullable<RequestTab["response"]>) {
  const statusLine = `HTTP ${response.statusCode} ${response.statusText}`;

  const headers =
    response.headers
      ?.map((header) => `${header.key}: ${header.value}`)
      .join("\n") ?? "";

  return [statusLine, headers, "", response.body].join("\n");
}

function EmptyState() {
  return (
    <div
      className="
        flex h-full items-center
        justify-center
        text-sm text-muted-foreground
      "
    >
      No response available
    </div>
  );
}
