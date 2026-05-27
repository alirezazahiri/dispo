import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { WorkspaceTabs, WorkspaceView } from "./components/workspace";
import { ensureSseRuntimeStarted } from "./protocols/sse/sse-runtime";
import { useWorkspaceSetCurrentCollection } from "./stores";

export function RequestWorkspace() {
  const params = useParams<{ id: string }>();
  const setCurrentCollection = useWorkspaceSetCurrentCollection();

  useEffect(() => {
    ensureSseRuntimeStarted();
  }, []);

  useEffect(() => {
    if (!params.id) {
      return;
    }
    setCurrentCollection(params.id);
  }, [params.id, setCurrentCollection]);

  return (
    <>
      <WorkspaceTabs />

      <WorkspaceView />
    </>
  );
}
