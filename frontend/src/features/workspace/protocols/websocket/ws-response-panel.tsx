import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components";
import type { RequestTab } from "../../types";
import { formatRawMessageLog } from "./ws-message";
import { WsMessagesPanel } from "./ws-messages-panel";
import { WsSendComposer } from "./ws-send-composer";

type Props = {
  tab: RequestTab;
};

export function WsResponsePanel({ tab }: Props) {
  const headerRows = tab.wsStream.responseHeaders.map((header, index) => ({
    id: `${header.key}-${index}`,
    key: header.key,
    value: header.value,
    enabled: true,
  }));

  const rawBody = tab.wsStream.messages
    .map((message) =>
      formatRawMessageLog(
        message.direction,
        message.messageType,
        message.data,
        message.byteLength,
      ),
    )
    .join("\n\n");

  return (
    <section className="flex h-full min-h-0 flex-col bg-[hsl(var(--editor))]">
      <Tabs defaultValue="messages" className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2">
          <TabsList className="h-8 bg-transparent p-0">
            <TabsTrigger
              value="messages"
              className="h-8 rounded-md px-3 data-[state=active]:bg-accent data-[state=active]:shadow-none"
            >
              Messages
            </TabsTrigger>
            <TabsTrigger
              value="headers"
              className="h-8 rounded-md px-3 data-[state=active]:bg-accent data-[state=active]:shadow-none"
            >
              Headers
            </TabsTrigger>
            <TabsTrigger
              value="raw"
              className="h-8 rounded-md px-3 data-[state=active]:bg-accent data-[state=active]:shadow-none"
            >
              Raw
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="messages" className="mt-0 min-h-0 flex-1 flex flex-col">
          <div className="min-h-0 flex-1">
            <WsMessagesPanel tab={tab} />
          </div>
          <WsSendComposer tab={tab} />
        </TabsContent>

        <TabsContent value="headers" className="mt-0 min-h-0 flex-1 overflow-auto">
          {headerRows.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Header</th>
                  <th className="px-4 py-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {headerRows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="px-4 py-2 font-mono text-foreground">{row.key}</td>
                    <td className="px-4 py-2 font-mono break-all text-muted-foreground">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Connect to see handshake headers
            </div>
          )}
        </TabsContent>

        <TabsContent value="raw" className="mt-0 min-h-0 flex-1 overflow-auto">
          {rawBody ? (
            <pre className="p-4 font-mono text-xs whitespace-pre-wrap break-words">
              {rawBody}
            </pre>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No messages captured yet
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
