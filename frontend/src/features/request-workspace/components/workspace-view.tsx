import { useWorkspaceStore } from "../stores";
import { RequestToolbar } from "./request-toolbar";
import { WorkspacePanels } from "./workspace-panels";

export function WorkspaceView() {
  const tabs = useWorkspaceStore((state) => state.tabs);

  const activeTabId = useWorkspaceStore((state) => state.activeTabId);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  if (!activeTab) {
    return null;
  }

  return (
    <>
      <RequestToolbar tab={activeTab} />

      <WorkspacePanels tab={activeTab} />
    </>
  );
}
