import type { RequestTab } from "../../types";
import JsonView from "react18-json-view";

type Props = {
  tab: RequestTab;
};

export function ResponseJsonView({ tab }: Props) {
  if (!tab.response?.body) {
    return null;
  }

  return (
    <div
      className="
        h-full overflow-auto p-4 scroll-area
      "
    >
      <JsonView
        src={JSON.parse(tab.response?.body as any) ?? {}}
        theme="github"
        dark={true}
      />
    </div>
  );
}
