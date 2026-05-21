import { useWorkspaceStore } from "@/features/request-workspace/stores/workspace.store";

import { RequestToolbar } from "./request-toolbar";
import { RequestEditor } from "./request-editor";
import { ResponsePanel } from "./response-panel";

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

      <div className="grid min-h-0 flex-1 grid-rows-2">
        <RequestEditor tab={activeTab} />

        <ResponsePanel tab={activeTab} />
      </div>
    </>
  );
}
