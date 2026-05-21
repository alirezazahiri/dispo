import { useActiveWorkspaceTab, useWorkspaceTabs } from "../../stores";
import { RequestToolbar } from "../request-toolbar";
import { WorkspacePanels } from "./workspace-panels";

export function WorkspaceView() {
  const activeTab = useActiveWorkspaceTab();

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
