import type { ReactNode } from "react";

type Props = {
  leading?: ReactNode;
  method?: ReactNode;
  url: ReactNode;
  secondary?: ReactNode;
  primaryAction: ReactNode;
  overflow?: ReactNode;
};

export function RequestToolbarShell({
  leading,
  method,
  url,
  secondary,
  primaryAction,
  overflow,
}: Props) {
  return (
    <div
      className="
        flex h-14 shrink-0 items-center gap-2
        border-b border-border bg-background px-3
        @workspace-compact/workspace:gap-3 @workspace-compact/workspace:px-4
      "
    >
      {leading}

      {method}

      <div className="min-w-0 flex-1">{url}</div>

      {secondary ? (
        <div
          className="
            hidden shrink-0 items-center gap-2
            @workspace-compact/workspace:flex
          "
        >
          {secondary}
        </div>
      ) : null}

      <div className="shrink-0">{primaryAction}</div>

      {overflow ? (
        <div className="shrink-0 @workspace-compact/workspace:hidden">
          {overflow}
        </div>
      ) : null}
    </div>
  );
}
