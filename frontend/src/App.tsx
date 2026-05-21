import { AppShell } from "@/app/shell";
import { RequestWorkspace } from "@/features";

export default function App() {
  return (
    <AppShell>
      <RequestWorkspace />
    </AppShell>
  );
}
