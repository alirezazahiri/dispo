import type { RequestTab } from "../../types";

type Props = {
  tab: RequestTab;
};

export function ResponseEmptyState({ tab }: Props) {
  return (
    <div
      className="
          flex h-full flex-col items-center
          justify-center gap-2 scroll-area
          text-muted-foreground
        "
    >
      <div className="text-sm">No response yet</div>

      {!tab.response?.requestSnapshot && (
        <div className="text-xs">Send a request to see the response</div>
      )}
    </div>
  );
}
