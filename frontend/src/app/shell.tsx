import { Sidebar, Topbar , RequestWorkspace } from "@/components/layout/base";

export function AppShell() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="flex h-full flex-col">
        <Topbar />

        <div className="flex min-h-0 flex-1">
          <Sidebar />

          <RequestWorkspace />
        </div>
      </div>
    </div>
  );
}
