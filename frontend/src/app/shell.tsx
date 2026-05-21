import { Sidebar, Topbar } from "@/components/layout/base";
import { PropsWithChildren } from "react";

export const AppShell: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="flex h-full flex-col">
        <Topbar />

        <div className="flex min-h-0 flex-1">
          <Sidebar />

          {children}
        </div>
      </div>
    </div>
  );
};
