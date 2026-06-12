import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { WorkspaceTabs, WorkspaceView } from "./components/workspace";
import { ensureSseRuntimeStarted } from "./protocols/sse/sse-runtime";
import { ensureWsRuntimeStarted } from "./protocols/websocket/ws-runtime";
import { useWorkspaceSetCurrentCollection } from "./stores";

export function RequestWorkspace() {
  const params = useParams<{ id: string }>();
  const setCurrentCollection = useWorkspaceSetCurrentCollection();

  useEffect(() => {
    ensureSseRuntimeStarted();
    ensureWsRuntimeStarted();
  }, []);

  useEffect(() => {
    if (!params.id) {
      return;
    }
    setCurrentCollection(params.id);
  }, [params.id, setCurrentCollection]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <WorkspaceTabs />

      <WorkspaceView />
    </div>
  );
}
