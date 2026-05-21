import { Sidebar } from "@/features/sidebar";
import { PropsWithChildren } from "react";
import { Topbar } from "./topbar";

export const AppShell: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="flex h-full flex-col">
        <Topbar />

        <div className="flex min-h-0 flex-1">
          <Sidebar />

          <main
            className="
              flex min-w-0 flex-1 flex-col
              bg-[hsl(var(--workspace))]
            "
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
