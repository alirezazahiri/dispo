import { useCallback } from "react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import * as ImportService from "~/wailsjs/go/importpkg/Service";
import { backendClient } from "@/lib/backend/client";
import { useCollectionsStore } from "@/features/collections/stores/collections.store";
import { useWorkspaceStore } from "@/features/workspace/stores/workspace.store";
import type { KeyValuePair } from "@/features/workspace/types";

type ImportSource = "httpie" | "postman";

const FILE_FILTERS = {
  httpie: [
    { displayName: "HTTPie export", pattern: "*.json" },
    { displayName: "All files", pattern: "*.*" },
  ],
  postman: [
    { displayName: "Postman collection", pattern: "*.json" },
    { displayName: "All files", pattern: "*.*" },
  ],
} satisfies Record<ImportSource, Array<{ displayName: string; pattern: string }>>;

function mergeSuggestedVariables(
  existing: KeyValuePair[],
  suggested: Array<{ name: string; value: string }>,
): KeyValuePair[] {
  const byKey = new Map(
    existing.map((row) => [row.key.trim(), row] as const),
  );
  const merged = [...existing];

  for (const variable of suggested) {
    const key = variable.name.trim();
    if (!key) {
      continue;
    }

    const current = byKey.get(key);
    if (current) {
      if (!current.value.trim() && variable.value.trim()) {
        current.value = variable.value;
      }
      continue;
    }

    const row: KeyValuePair = {
      id: nanoid(),
      key,
      value: variable.value,
      enabled: true,
    };
    byKey.set(key, row);
    merged.push(row);
  }

  return merged;
}

export function useImportCollection() {
  const refresh = useCollectionsStore((state) => state.refresh);

  return useCallback(async (source: ImportSource) => {
    const picked = await backendClient.pickFile({
      title: "Import collection",
      filters: FILE_FILTERS[source],
    });

    if (picked.cancelled) {
      return;
    }

    try {
      const result = await ImportService.ImportCollection({
        source,
        filePath: picked.path,
      });

      await refresh();

      const collectionNames = result.trees.map((tree) => tree.collection.name);
      if (collectionNames.length === 1) {
        toast.success(`Imported collection "${collectionNames[0]}"`);
      } else if (collectionNames.length > 1) {
        toast.success(`Imported ${collectionNames.length} collections`);
      } else if ((result.suggestedVariables ?? []).length > 0) {
        toast.success("Imported environment variables");
      }

      if (result.warnings?.length) {
        toast.warning(result.warnings.slice(0, 3).join("\n"), {
          description:
            result.warnings.length > 3
              ? `…and ${result.warnings.length - 3} more`
              : undefined,
        });
      }

      const suggested = result.suggestedVariables ?? [];
      if (suggested.length === 0) {
        return;
      }

      const workspace = useWorkspaceStore.getState();
      let environmentId =
        workspace.activeEnvironmentId ?? workspace.environments[0]?.id;

      if (!environmentId) {
        workspace.createEnvironment();
        environmentId = useWorkspaceStore.getState().activeEnvironmentId ?? undefined;
      }

      const targetEnvironment = useWorkspaceStore
        .getState()
        .environments.find((environment) => environment.id === environmentId);

      if (!targetEnvironment) {
        return;
      }

      useWorkspaceStore.getState().setActiveEnvironment(targetEnvironment.id);
      useWorkspaceStore.getState().updateEnvironment(targetEnvironment.id, {
        variables: mergeSuggestedVariables(
          targetEnvironment.variables,
          suggested,
        ),
      });

      toast.info(
        `Merged ${suggested.length} template variable${suggested.length === 1 ? "" : "s"} into "${targetEnvironment.name}"`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Import failed unexpectedly";
      toast.error(message);
    }
  }, [refresh]);
}
