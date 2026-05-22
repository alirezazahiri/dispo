import { PropsWithChildren, useEffect, useState } from "react";

import { useCollectionsStore } from "@/features/collections";
import { useWorkspaceStore } from "@/features/workspace/stores/workspace.store";
import { waitForWailsRuntime } from "@/lib/backend/wails-runtime";

type BootstrapStatus = "pending" | "ready" | "error";

/**
 * Single source of truth for application startup.
 *
 *  1. Waits for the Wails runtime bindings to be injected.
 *  2. Hydrates the collections and workspace stores from the backend.
 *  3. Only then renders the rest of the app.
 *
 * Route components and the sidebar must NOT call `initialize()` themselves —
 * by the time they mount, both stores are guaranteed to be ready.
 */
export function AppBootstrap({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<BootstrapStatus>("pending");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await waitForWailsRuntime();

        await Promise.all([
          useCollectionsStore.getState().initialize(),
          useWorkspaceStore.getState().initialize(),
        ]);

        if (!cancelled) {
          setStatus("ready");
        }
      } catch (err) {
        console.error("Failed to bootstrap the application", err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "ready") {
    return <>{children}</>;
  }

  if (status === "error") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-6 text-sm text-foreground">
        <div className="max-w-md space-y-2 text-center">
          <p className="font-medium">Failed to start the application.</p>
          <p className="text-muted-foreground">
            {error?.message ?? "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return <div className="h-screen w-screen bg-background" aria-hidden />;
}
