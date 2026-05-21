import { WorkspaceTabs, WorkspaceView } from "./components/workspace";

export function RequestWorkspace() {
  return (
    <>
      <WorkspaceTabs />

      <WorkspaceView />
    </>
  );
}
