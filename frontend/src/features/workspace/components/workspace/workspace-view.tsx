import { useActiveWorkspaceTab } from "../../stores";
import { RequestToolbar } from "../request-toolbar";
import { WorkspacePanels } from "./workspace-panels";

export function WorkspaceView() {
  const activeTab = useActiveWorkspaceTab();

  if (!activeTab) {
    return null;
  }

  return (
    <div className="@container/workspace flex min-h-0 min-w-0 flex-1 flex-col">
      <RequestToolbar tab={activeTab} />

      <WorkspacePanels tab={activeTab} />
    </div>
  );
}
