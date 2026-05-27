import type { RequestTab, WorkspaceProtocol } from "../../types";
import { DEFAULT_SSE_STREAM } from "../../types";
import { useWorkspaceUpdateTab } from "../../stores";
import { getProtocolDefinition } from "../../protocols/registry";
import { disposeSseTab } from "../../protocols/sse/sse-runtime";

type Props = {
  tab: RequestTab;
};

export function RequestToolbar({ tab }: Props) {
  const updateTab = useWorkspaceUpdateTab();
  const definition = getProtocolDefinition(tab.protocol);
  const Toolbar = definition.Toolbar;

  const handleProtocolChange = (protocol: WorkspaceProtocol) => {
    if (protocol === tab.protocol) {
      return;
    }

    if (tab.protocol === "sse") {
      disposeSseTab(tab.id);
    }

    const nextDefinition = getProtocolDefinition(protocol);
    updateTab(tab.id, {
      protocol,
      ...nextDefinition.createTabDefaults(),
      sseStream: { ...DEFAULT_SSE_STREAM },
      isDirty: true,
    });
  };

  return <Toolbar tab={tab} onProtocolChange={handleProtocolChange} />;
};
