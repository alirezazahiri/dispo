import { Checkbox, Input, Label } from "@/components";
import type { RequestTab, WsConnectionConfig } from "../../types";
import { useWorkspaceUpdateTab } from "../../stores";

type Props = {
  tab: RequestTab;
};

export function WsOptionsEditor({ tab }: Props) {
  const updateTab = useWorkspaceUpdateTab();

  const patchConfig = (patch: Partial<WsConnectionConfig>) => {
    updateTab(tab.id, {
      wsConfig: {
        ...tab.wsConfig,
        ...patch,
      },
      isDirty: true,
    });
  };

  return (
    <div className="p-4 flex flex-col gap-6 max-w-2xl">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Connection</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          WebSocket uses an HTTP upgrade handshake. Custom headers (including auth)
          are sent during the initial request.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ws-subprotocols">Subprotocols</Label>
        <Input
          id="ws-subprotocols"
          value={tab.wsConfig.subprotocols}
          onChange={(event) => patchConfig({ subprotocols: event.target.value })}
          placeholder="e.g. graphql-transport-ws, json (comma-separated)"
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Sent as the <code className="font-mono">Sec-WebSocket-Protocol</code> header
          when connecting.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ws-max-messages">Max buffered messages</Label>
        <Input
          id="ws-max-messages"
          type="number"
          min={10}
          max={10000}
          value={tab.wsConfig.maxBufferedMessages}
          onChange={(event) =>
            patchConfig({
              maxBufferedMessages: Math.max(
                10,
                Number.parseInt(event.target.value, 10) || 500,
              ),
            })
          }
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <div className="space-y-1">
          <Label htmlFor="ws-with-credentials">Send cookies</Label>
          <p className="text-xs text-muted-foreground">
            Include credentials on cross-origin handshake requests.
          </p>
        </div>
        <Checkbox
          aria-label="Send cookies"
          checked={tab.wsConfig.withCredentials}
          onCheckedChange={(checked) => patchConfig({ withCredentials: checked })}
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <div className="space-y-1">
          <Label htmlFor="ws-auto-reconnect">Auto-reconnect</Label>
          <p className="text-xs text-muted-foreground">
            Reconnect when the connection closes unexpectedly.
          </p>
        </div>
        <Checkbox
          aria-label="Auto-reconnect"
          checked={tab.wsConfig.autoReconnect}
          onCheckedChange={(checked) => patchConfig({ autoReconnect: checked })}
        />
      </div>
    </div>
  );
}
