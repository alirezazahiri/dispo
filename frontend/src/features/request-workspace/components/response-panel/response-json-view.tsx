import type { RequestTab } from "../../types";
import JsonView from "react18-json-view";

type Props = {
  tab: RequestTab;
};

export function ResponseJsonView({ tab }: Props) {
  return (
    <div
      className="
        h-full overflow-auto p-4 scroll-area
      "
    >
      <JsonView src={tab.response?.body ?? {}} theme="github" dark={true} />
    </div>
  );
}
