import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { WorkspaceTabs, WorkspaceView } from "./components/workspace";
import { useWorkspaceSetCurrentCollection } from "./stores";

export function RequestWorkspace() {
  const params = useParams<{ id: string }>();
  const setCurrentCollection = useWorkspaceSetCurrentCollection();

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
