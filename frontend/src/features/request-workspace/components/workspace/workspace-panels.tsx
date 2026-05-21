import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from "react-resizable-panels";
import type { RequestTab } from "../../types";
import { RequestEditor } from "../request-editor/request-editor";
import { ResponsePanel } from "../response-panel";

type Props = {
  tab: RequestTab;
};

export function WorkspacePanels({ tab }: Props) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "request-workspace-panels",
    storage: localStorage,
  });
  return (
    <Group
      orientation="vertical"
      className="min-h-0 flex-1"
      draggable
      defaultLayout={defaultLayout}
      onLayoutChange={onLayoutChanged}
    >
      <Panel defaultSize={55} minSize="20%" className="min-h-0">
        <RequestEditor tab={tab} />
      </Panel>

      <ResizeHandle />

      <Panel defaultSize={55} minSize="20%" className="min-h-0">
        <ResponsePanel tab={tab} />
      </Panel>
    </Group>
  );
}

function ResizeHandle() {
  return (
    <Separator
      className="
          group relative flex h-2
          items-center justify-center
          bg-background
          transition-colors
          hover:bg-accent
        "
    >
      <div
        className="
            h-[2px] w-10 rounded-full
            bg-border
            transition-colors
            group-hover:bg-ring
          "
      />
    </Separator>
  );
}
