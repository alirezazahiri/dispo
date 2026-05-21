import { Plus, SendHorizonal, X } from "lucide-react";

import { Button, Separator } from "@/components";

export function RequestWorkspace() {
  return (
    <main
      className="
        flex min-w-0 flex-1 flex-col
        bg-[hsl(var(--workspace))]
      "
    >
      <RequestTabs />

      <Separator />

      <RequestToolbar />

      <Separator />

      <div className="grid min-h-0 flex-1 grid-rows-2">
        <RequestEditor />

        <ResponsePanel />
      </div>
    </main>
  );
}

function RequestTabs() {
  return (
    <div
      className="
        flex h-11 shrink-0 items-center
        border-b border-border
        bg-card px-2
      "
    >
      <div
        className="
          flex h-8 items-center gap-2 rounded-md
          border border-border
          bg-background px-3
          text-sm text-foreground
        "
      >
        <span className="font-medium">GET</span>

        <span className="max-w-[180px] truncate text-muted-foreground">
          api.example.com/users
        </span>

        <button
          className="
            text-muted-foreground
            transition-colors
            hover:text-foreground
          "
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="
          ml-1 h-8 w-8
          text-muted-foreground
          hover:bg-accent
          hover:text-foreground
        "
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function RequestToolbar() {
  return (
    <div
      className="
        flex h-14 shrink-0 items-center gap-3
        bg-background px-4
      "
    >
      <select
        className="
          h-10 rounded-md border border-input
          bg-background px-3
          text-sm text-foreground
          outline-none
          transition-colors
          focus:border-ring
        "
      >
        <option>GET</option>
        <option>POST</option>
        <option>PUT</option>
        <option>DELETE</option>
      </select>

      <input
        placeholder="https://api.example.com/users"
        className="
          h-10 flex-1 rounded-md border border-input
          bg-background px-4
          text-sm text-foreground
          outline-none
          transition-colors
          placeholder:text-muted-foreground
          focus:border-ring
        "
      />

      <Button className="gap-2">
        <SendHorizonal className="h-4 w-4" />
        Send
      </Button>
    </div>
  );
}

function RequestEditor() {
  return (
    <section
      className="
        flex min-h-0 flex-col
        border-b border-border
      "
    >
      <div
        className="
          flex h-10 shrink-0 items-center gap-6
          border-b border-border
          bg-background px-4
        "
      >
        <WorkspaceTab active label="Body" />
        <WorkspaceTab label="Headers" />
        <WorkspaceTab label="Params" />
        <WorkspaceTab label="Auth" />
      </div>

      <div
        className="
          flex-1
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
          Monaco Request Editor
        </div>
      </div>
    </section>
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
