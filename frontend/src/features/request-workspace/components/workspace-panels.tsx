import { Panel, Group, Separator } from "react-resizable-panels";

import type { RequestTab } from "../types";

import { RequestEditor } from "../components/request-editor";
import { ResponsePanel } from "../components/response-panel";

type Props = {
  tab: RequestTab;
};

export function WorkspacePanels({ tab }: Props) {
  return (
    <Group
      orientation="vertical"
      autoSave="request-workspace-panels"
      className="min-h-0 flex-1"
    >
      <Panel defaultSize={55} minSize={55} className="min-h-0">
        <RequestEditor tab={tab} />
      </Panel>

      <ResizeHandle />

      <Panel defaultSize={45} minSize={55} className="min-h-0">
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
