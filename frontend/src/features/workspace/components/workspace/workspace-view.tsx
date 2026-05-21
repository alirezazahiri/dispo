import { useEffect } from "react";
import { useActiveWorkspaceTab } from "../../stores";
import { RequestToolbar } from "../request-toolbar";
import { WorkspacePanels } from "./workspace-panels";
import { useWorkspaceInitialize, useWorkspaceReady } from "../../stores";

export function WorkspaceView() {
  const initialize = useWorkspaceInitialize();
  const isReady = useWorkspaceReady();
  const activeTab = useActiveWorkspaceTab();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (!isReady) {
    return null;
  }

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
