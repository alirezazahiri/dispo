import { MonacoBaseEditor } from "@/components/shared";
import type { TextBodyContentType } from "@/types";
import { useWorkspaceUpdateTab } from "../../../stores";
import type { RequestTab } from "../../../types";
import { TEXT_CONTENT_TYPE_TO_LANGUAGE } from "./constants";
import { TextEditorOptionsFab } from "./text-editor-options-fab";

type Props = {
  tab: RequestTab;
};

export function TextBodyEditor({ tab }: Props) {
  const updateTab = useWorkspaceUpdateTab();

  const handleBodyChange = (value: string) => {
    updateTab(tab.id, {
      body: value,
      isDirty: true,
    });
  };

  const currentContentType: TextBodyContentType =
    tab.bodyContentType ?? "application/json";

  return (
    <div className="relative h-full w-full">
      <MonacoBaseEditor
        value={tab.body}
        onChange={handleBodyChange}
        defaultLanguage={TEXT_CONTENT_TYPE_TO_LANGUAGE[currentContentType]}
        language={TEXT_CONTENT_TYPE_TO_LANGUAGE[currentContentType]}
      />
      <TextEditorOptionsFab tab={tab} currentContentType={currentContentType} />
    </div>
  );
}
