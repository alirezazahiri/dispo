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
  
  export function HorizontalWorkspacePanels({
    tab,
  }: Props) {
    const { defaultLayout, onLayoutChanged } =
      useDefaultLayout({
        id: "workspace-panels-horizontal",
        storage: localStorage,
      });
  
    return (
      <Group
        orientation="horizontal"
        className="min-h-0 flex-1"
        draggable
        defaultLayout={defaultLayout}
        onLayoutChange={onLayoutChanged}
      >
        <Panel defaultSize={60} minSize="25%" className="min-w-0">
          <RequestEditor tab={tab} />
        </Panel>
  
        <ResizeHandle />
  
        <Panel defaultSize={40} minSize="25%" className="min-w-0">
          <ResponsePanel tab={tab} />
        </Panel>
      </Group>
    );
  }
  
  function ResizeHandle() {
    return (
      <Separator
        className="
          group relative flex h-full w-2 shrink-0
          items-center justify-center
          bg-background transition-colors
          hover:bg-accent
        "
      >
        <div
          className="
            h-10 w-[2px] rounded-full
            bg-border transition-colors
            group-hover:bg-ring
          "
        />
      </Separator>
    );
  }