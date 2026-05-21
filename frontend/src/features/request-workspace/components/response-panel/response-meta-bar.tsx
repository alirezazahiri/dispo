import type { RequestTab } from "../../types";

type Props = {
  tab: RequestTab;
};

export function ResponseMetaBar({ tab }: Props) {
  const response = tab.response;

  if (response?.status !== "success") {
    return null;
  }

  return (
    <div
      className="
        flex items-center gap-4
        text-xs text-muted-foreground
      "
    >
      <span>
        Status: <span className="text-foreground">{response.statusCode}</span>
      </span>

      <span>
        Time: <span className="text-foreground">{response.timeMs}ms</span>
      </span>

      <span>
        Size: <span className="text-foreground">{response.size}b</span>
      </span>
    </div>
  );
}
