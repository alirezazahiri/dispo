import { useWorkspaceUpdateTab } from "../../../stores";
import type { RequestBodyMode, RequestTab } from "../../../types";
import { BodyModeSelector } from "./body-mode-selector";
import { FileBodyEditor } from "./file-body-editor";
import { FormBodyEditor } from "./form-body-editor";
import { GraphqlBodyEditor } from "./graphql-body-editor";
import { NoneBodyEditor } from "./none-body-editor";
import { TextBodyEditor } from "./text-body-editor";
import { buildBodyUpdate } from "./utils";

type Props = {
  tab: RequestTab;
};

/**
 * Top-level dispatcher for the request body tab.
 *
 * Renders the body-mode selector pill row and the editor that matches
 * the currently active mode. Each editor owns its own slice of the tab
 * state (text body, form fields, file metadata, …) and is mounted only
 * when its mode is active so unrelated state never re-renders.
 */
export function RequestBodyEditor({ tab }: Props) {
  const updateTab = useWorkspaceUpdateTab();
  const mode: RequestBodyMode = tab.bodyMode ?? "none";

  const handleModeChange = (nextMode: RequestBodyMode) => {
    if (nextMode === mode) return;
    updateTab(tab.id, {
      ...buildBodyUpdate(tab, { bodyMode: nextMode }),
      isDirty: true,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BodyModeSelector value={mode} onChange={handleModeChange} />

      <div className="relative min-h-0 flex-1">
        {mode === "none" ? <NoneBodyEditor /> : null}
        {mode === "text" ? <TextBodyEditor tab={tab} /> : null}
        {mode === "form" ? <FormBodyEditor tab={tab} /> : null}
        {mode === "file" ? <FileBodyEditor tab={tab} /> : null}
        {mode === "graphql" ? <GraphqlBodyEditor /> : null}
      </div>
    </div>
  );
}
