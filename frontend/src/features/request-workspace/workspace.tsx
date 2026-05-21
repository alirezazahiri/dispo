import { WorkspaceTabs } from "./components";
import { WorkspaceView } from "./components";

export function RequestWorkspace() {
  return (
    <>
      <WorkspaceTabs />

      <WorkspaceView />
    </>
  );
}


function ResponsePanel() {
  return (
    <section
      className="
        flex min-h-0 flex-col
        bg-[hsl(var(--workspace))]
      "
    >
      <div
        className="
          flex h-10 shrink-0 items-center gap-6
          border-b border-border
          bg-background px-4
        "
      >
        <WorkspaceTab active label="Response" />
        <WorkspaceTab label="Headers" />
        <WorkspaceTab label="Cookies" />
      </div>

      <div
        className="
          flex-1 overflow-auto
          bg-[hsl(var(--editor))]
          p-4
        "
      >
        <div
          className="
            flex h-full items-center justify-center
            rounded-lg border border-dashed border-border
            text-sm text-muted-foreground
          "
        >
          Response Viewer
        </div>
      </div>
    </section>
  );
}

type WorkspaceTabProps = {
  label: string;
  active?: boolean;
};

function WorkspaceTab({ label, active }: WorkspaceTabProps) {
  return (
    <button
      className={`
        relative flex h-full items-center
        text-sm transition-colors
        ${
          active
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }
      `}
    >
      {label}

      {active && (
        <div
          className="
            absolute bottom-0 left-0
            h-px w-full
            bg-foreground
          "
        />
      )}
    </button>
  );
}
