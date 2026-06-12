import { Loader2, Plug, PlugZap, Radio, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components";
import { cn } from "@/lib/utils";
import type { RequestTab } from "../../types";
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
import { RequestToolbarShell } from "../../components/request-toolbar/request-toolbar-shell";
import {
  RequestToolbarOverflowMenu,
  WsClearOverflowItem,
} from "../../components/request-toolbar/request-toolbar-overflow-menu";
import { ToolbarResponsiveButton } from "../../components/request-toolbar/toolbar-responsive-button";
import {
  TOOLBAR_CONTROL_HEIGHT,
  TOOLBAR_ICON_BUTTON,
} from "../../components/request-toolbar/constants";
import type { WorkspaceProtocol } from "../../types";
import {
  createVariableMap,
  reconcilePathParamRows,
} from "../../components/request-toolbar/utils";
import { nanoid } from "nanoid";
import { resolveRequestUrl } from "../../utils/resolve-request-url";
import { useWsConnection } from "./use-ws-connection";
import { WsMessagesPanelActions } from "./ws-messages-panel";

type Props = {
  tab: RequestTab;
  onProtocolChange: (protocol: WorkspaceProtocol) => void;
};

function parseSubprotocols(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function WsRequestToolbar({ tab, onProtocolChange }: Props) {
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

  const { connect, disconnect, clearStream, isConnected } = useWsConnection(tab.id);

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
            : "New WebSocket"
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
      toast.error("WebSocket URL is required");
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
        subprotocols: parseSubprotocols(tab.wsConfig.subprotocols),
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

  const isBusy = tab.isSending || tab.wsStream.status === "connecting";
  const showSave = tab.isDirty || !tab.savedRequestId;
  const canClearMessages =
    tab.wsStream.messages.length > 0 || tab.wsStream.status !== "idle";

  return (
    <RequestToolbarShell
      leading={
        <>
          <ProtocolSelect value={tab.protocol} onChange={onProtocolChange} />

          <div
            className={cn(
              TOOLBAR_ICON_BUTTON,
              "flex items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10",
              "text-amber-700 dark:text-amber-300",
              "@workspace-compact/workspace:w-[5.5rem] @workspace-compact/workspace:gap-1.5",
              "@workspace-compact/workspace:font-mono @workspace-compact/workspace:text-xs",
              "@workspace-compact/workspace:font-semibold @workspace-compact/workspace:uppercase",
              "@workspace-compact/workspace:tracking-wide",
            )}
          >
            <Radio className="h-3.5 w-3.5" />
            <span className="hidden @workspace-compact/workspace:inline">WS</span>
          </div>
        </>
      }
      url={
        <UrlInput
          value={tab.url}
          onChange={handleUrlChange}
          templateValues={templateValues}
          pathParamValues={pathParamValues}
        />
      }
      secondary={
        <>
          <EnvironmentSelect
            environments={environments}
            activeEnvironmentId={activeEnvironment?.id}
            onSelect={setActiveEnvironment}
          />

          <WsMessagesPanelActions tab={tab} onClear={handleClear} />

          {showSave ? (
            <Button
              variant="outline"
              onClick={() => void handleSave()}
              className={cn("gap-2 shadow-none hover:shadow-none", TOOLBAR_CONTROL_HEIGHT)}
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          ) : null}
        </>
      }
      primaryAction={
        isConnected ? (
          <ToolbarResponsiveButton
            variant="outline"
            onClick={handleDisconnect}
            disabled={isBusy}
            ariaLabel="Disconnect WebSocket"
            tooltip="Disconnect"
            icon={<PlugZap className="h-4 w-4" />}
            label="Disconnect"
            wideClassName="@workspace-compact/workspace:min-w-[110px]"
          />
        ) : (
          <ToolbarResponsiveButton
            onClick={() => void handleConnect()}
            disabled={isBusy}
            ariaLabel="Connect WebSocket"
            tooltip="Connect"
            icon={<Plug className="h-4 w-4" />}
            label="Connect"
            isLoading={isBusy}
            loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
            loadingLabel="Connecting"
            wideClassName="@workspace-compact/workspace:min-w-[110px]"
          />
        )
      }
      overflow={
        <RequestToolbarOverflowMenu
          environments={environments}
          activeEnvironmentId={activeEnvironment?.id}
          onSelectEnvironment={setActiveEnvironment}
          showSave={showSave}
          onSave={() => void handleSave()}
          extraItems={
            <WsClearOverflowItem
              disabled={!canClearMessages}
              onClear={handleClear}
            />
          }
        />
      }
    />
  );
}
