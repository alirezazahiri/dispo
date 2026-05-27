import { Loader2, Plug, PlugZap, Radio, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components";
import type { RequestTab } from "../../types";
import { DEFAULT_SSE_STREAM } from "../../types";
import {
  useActiveEnvironment,
  useWorkspaceEnvironments,
  useWorkspaceSaveTabToCollection,
  useWorkspaceSetActiveEnvironment,
  useWorkspaceUpdateTab,
} from "../../stores";
import { useCollectionsStore } from "@/features/collections";
import { UrlInput } from "../../components/request-toolbar/url-input";
import { ProtocolSelect } from "../../components/request-toolbar/protocol-select";
import { EnvironmentSelect } from "../../components/request-toolbar/enironment-select";
import type { WorkspaceProtocol } from "../../types";
import {
  createVariableMap,
  reconcilePathParamRows,
} from "../../components/request-toolbar/utils";
import { nanoid } from "nanoid";
import { resolveRequestUrl } from "../../utils/resolve-request-url";
import { useSseConnection } from "./use-sse-connection";
import { SseStreamPanelActions } from "./sse-stream-panel";

type Props = {
  tab: RequestTab;
  onProtocolChange: (protocol: WorkspaceProtocol) => void;
};

export function SseRequestToolbar({ tab, onProtocolChange }: Props) {
  const updateTab = useWorkspaceUpdateTab();
  const environments = useWorkspaceEnvironments();
  const activeEnvironment = useActiveEnvironment();
  const setActiveEnvironment = useWorkspaceSetActiveEnvironment();
  const saveTabToCollection = useWorkspaceSaveTabToCollection();
  const upsertRequest = useCollectionsStore((state) => state.upsertRequest);
  const collection = useCollectionsStore(
    (state) => state.collectionsById[tab.collectionId],
  );
  const templateValues = createVariableMap(activeEnvironment?.variables ?? []);

  const pathParamValues = (tab.pathParams ?? []).reduce<Record<string, string>>(
    (acc, row) => {
      const key = row.key.trim();
      if (!key || !row.enabled) {
        return acc;
      }
      acc[key] = row.value;
      return acc;
    },
    {},
  );

  const { connect, disconnect, clearStream, isConnected } = useSseConnection(tab.id);

  const handleUrlChange = (url: string) => {
    const previousRows = tab.pathParams ?? [];
    const nextPathParams = reconcilePathParamRows(
      url,
      tab.url,
      previousRows,
      () => nanoid(),
    );
    const pathParamsChanged = nextPathParams !== previousRows;

    updateTab(tab.id, {
      url,
      title:
        tab.savedRequestId == null
          ? url.length > 0
            ? url
            : "New SSE"
          : tab.title,
      isDirty: true,
      ...(pathParamsChanged ? { pathParams: nextPathParams } : null),
    });
  };

  const handleSave = async () => {
    const saved = await saveTabToCollection(tab.id);
    if (saved) {
      upsertRequest(saved);
      updateTab(tab.id, { title: saved.name, isDirty: false });
    }
  };

  const handleConnect = async () => {
    if (!tab.url.trim()) {
      toast.error("Stream URL is required");
      return;
    }

    const resolved = resolveRequestUrl({
      tab,
      environmentVariables: activeEnvironment?.variables ?? [],
      collectionAuth: collection?.auth,
    });

    if (resolved.unresolvedVariables.size) {
      toast.warning(
        `Unresolved variables: ${Array.from(resolved.unresolvedVariables).join(", ")}`,
      );
    }

    if (resolved.unresolvedPathParams.size) {
      toast.warning(
        `Unresolved path params: ${Array.from(resolved.unresolvedPathParams).join(", ")}`,
      );
    }

    updateTab(tab.id, { isSending: true });
    try {
      await connect({
        url: resolved.url,
        headers: resolved.headers,
      });
    } finally {
      updateTab(tab.id, { isSending: false, isDirty: false });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleClear = () => {
    clearStream();
  };

  const isBusy = tab.isSending || tab.sseStream.status === "connecting";

  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <ProtocolSelect value={tab.protocol} onChange={onProtocolChange} />

      <div
        className="
          flex h-9 w-[5.5rem] shrink-0 items-center justify-center gap-1.5
          rounded-md border border-violet-500/30 bg-violet-500/10
          font-mono text-xs font-semibold uppercase tracking-wide
          text-violet-700 dark:text-violet-300
        "
      >
        <Radio className="h-3.5 w-3.5" />
        SSE
      </div>

      <UrlInput
        value={tab.url}
        onChange={handleUrlChange}
        templateValues={templateValues}
        pathParamValues={pathParamValues}
      />

      <EnvironmentSelect
        environments={environments}
        activeEnvironmentId={activeEnvironment?.id}
        onSelect={setActiveEnvironment}
      />

      <SseStreamPanelActions
        tab={tab}
        onClear={handleClear}
      />

      {(tab.isDirty || !tab.savedRequestId) && (
        <Button variant="outline" onClick={() => void handleSave()} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      )}

      {isConnected ? (
        <Button
          variant="outline"
          onClick={handleDisconnect}
          disabled={isBusy}
          className="min-w-[110px] gap-2"
        >
          <PlugZap className="h-4 w-4" />
          Disconnect
        </Button>
      ) : (
        <Button
          onClick={() => void handleConnect()}
          disabled={isBusy}
          className="min-w-[110px] gap-2"
        >
          {isBusy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting
            </>
          ) : (
            <>
              <Plug className="h-4 w-4" />
              Connect
            </>
          )}
        </Button>
      )}
    </div>
  );
}
