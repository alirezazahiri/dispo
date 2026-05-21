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

export function WorkspacePanels({ tab }: Props) {
  const isVertical = tab.layout === "vertical";

  const { defaultLayout, onLayoutChanged } =
    useDefaultLayout({
      id: `workspace-panels-${tab.layout}`,
      storage: localStorage,
    });

  return (
    <Group
      orientation={tab.layout}
      className="min-h-0 flex-1"
      draggable
      defaultLayout={defaultLayout}
      onLayoutChange={onLayoutChanged}
    >
      <Panel
        defaultSize={55}
        minSize="20%"
        className="min-h-0 min-w-0"
      >
        <RequestEditor tab={tab} />
      </Panel>

      <ResizeHandle vertical={isVertical} />

      <Panel
        defaultSize={45}
        minSize="20%"
        className="min-h-0 min-w-0"
      >
        <ResponsePanel tab={tab} />
      </Panel>
    </Group>
  );
}

type ResizeHandleProps = {
  vertical: boolean;
};

function ResizeHandle({
  vertical,
}: ResizeHandleProps) {
  return (
    <Separator
      className={`
        group relative flex shrink-0
        items-center justify-center
        bg-background
        transition-colors
        hover:bg-accent

        ${
          vertical
            ? "h-2 w-full cursor-row-resize"
            : "h-full w-2 cursor-col-resize"
        }
      `}
    >
      <div
        className={`
          rounded-full
          bg-border
          transition-all
          duration-150
          group-hover:bg-ring

          ${
            vertical
              ? "h-[2px] w-10 group-hover:w-14"
              : "h-10 w-[2px] group-hover:h-14"
          }
        `}
      />
    </Separator>
  );
}