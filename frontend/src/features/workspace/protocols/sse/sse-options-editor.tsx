import { Checkbox, Input, Label } from "@/components";
import type { RequestTab, SseConnectionConfig } from "../../types";
import { useWorkspaceUpdateTab } from "../../stores";

type Props = {
  tab: RequestTab;
};

export function SseOptionsEditor({ tab }: Props) {
  const updateTab = useWorkspaceUpdateTab();

  const patchConfig = (patch: Partial<SseConnectionConfig>) => {
    updateTab(tab.id, {
      sseConfig: {
        ...tab.sseConfig,
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
          SSE uses an HTTP GET with <code className="font-mono">Accept: text/event-stream</code>.
          Custom headers (including auth) are sent on the initial handshake.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sse-last-event-id">Last-Event-ID</Label>
        <Input
          id="sse-last-event-id"
          value={tab.sseConfig.lastEventId}
          onChange={(event) => patchConfig({ lastEventId: event.target.value })}
          placeholder="Resume after this server event id"
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Sent as the <code className="font-mono">Last-Event-ID</code> header when connecting.
          Updates automatically from incoming <code className="font-mono">id:</code> fields when
          auto-reconnect is enabled.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sse-event-filter">Event type filter</Label>
        <Input
          id="sse-event-filter"
          value={tab.sseConfig.eventTypeFilter}
          onChange={(event) => patchConfig({ eventTypeFilter: event.target.value })}
          placeholder="e.g. message (empty = all events)"
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Only events whose <code className="font-mono">event:</code> field matches are shown in
          the stream log.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sse-max-events">Max buffered events</Label>
        <Input
          id="sse-max-events"
          type="number"
          min={10}
          max={10000}
          value={tab.sseConfig.maxBufferedEvents}
          onChange={(event) =>
            patchConfig({
              maxBufferedEvents: Math.max(
                10,
                Number.parseInt(event.target.value, 10) || 500,
              ),
            })
          }
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <div className="space-y-1">
          <Label htmlFor="sse-with-credentials">Send cookies</Label>
          <p className="text-xs text-muted-foreground">
            Include credentials on cross-origin requests.
          </p>
        </div>
        <Checkbox
          aria-label="Send cookies"
          checked={tab.sseConfig.withCredentials}
          onCheckedChange={(checked) => patchConfig({ withCredentials: checked })}
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <div className="space-y-1">
          <Label htmlFor="sse-auto-reconnect">Auto-reconnect</Label>
          <p className="text-xs text-muted-foreground">
            Reconnect when the stream closes unexpectedly, using the latest event id.
          </p>
        </div>
        <Checkbox
          aria-label="Auto-reconnect"
          checked={tab.sseConfig.autoReconnect}
          onCheckedChange={(checked) => patchConfig({ autoReconnect: checked })}
        />
      </div>
    </div>
  );
}
