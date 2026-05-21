import React from "react";
import { RequestWorkspace } from "@/features";
import { BaseLayout } from "@/components/layout";

export const App: React.FC = () => {
  return (
    <BaseLayout.AppShell>
      <RequestWorkspace />
    </BaseLayout.AppShell>
  );
};
