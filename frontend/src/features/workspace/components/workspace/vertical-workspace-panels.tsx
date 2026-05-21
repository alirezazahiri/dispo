// @deprecated: this is not being used, but is kept due to the future architectural changes

import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
} from "react-resizable-panels";

import type { RequestTab } from "../../types";

import { RequestEditor } from "../request-editor/request-editor";
import { ResponsePanel } from "../response-panel";

type Props = {
  tab: RequestTab;
};

export function VerticalWorkspacePanels({ tab }: Props) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "workspace-panels:vertical",
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

      <ResizeHandle vertical />

      <Panel defaultSize={45} minSize="20%" className="min-h-0">
        <ResponsePanel tab={tab} />
      </Panel>
    </Group>
  );
}

type ResizeHandleProps = {
  vertical?: boolean;
};

function ResizeHandle({ vertical }: ResizeHandleProps) {
  return (
    <Separator
      className={`
          group relative flex shrink-0
          items-center justify-center
          bg-background transition-colors
          hover:bg-accent
  
          ${vertical ? "h-2 w-full" : "h-full w-2"}
        `}
    >
      <div
        className={`
            rounded-full bg-border
            transition-colors
            group-hover:bg-ring
  
            ${vertical ? "h-[2px] w-10" : "h-10 w-[2px]"}
          `}
      />
    </Separator>
  );
}
