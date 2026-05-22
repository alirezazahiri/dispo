import { useCollectionsStore } from "@/features/collections/stores/collections.store";
import type { SavedRequest } from "@/features/collections/types";
import type { RequestTab } from "../types";
import { useWorkspaceStore } from "./workspace.store";

const FALLBACK_TITLE = "New Request";

/**
 * Centralized tab-title resolution.
 *
 * The single source of truth for a tab linked to a saved request is the saved
 * request's `name` (in the collections store). The tab's own `title` field is
 * kept around only as a cached fallback for:
 *   - unsaved tabs that have never been persisted to a collection, and
 *   - linked tabs whose saved request has been removed (e.g. after deletion).
 *
 * Always go through this resolver when displaying or persisting a tab title;
 * never read `tab.title` directly in UI code.
 */
function findSavedRequestName(
  requestsByCollection: Record<string, Record<string, SavedRequest>>,
  savedRequestId: string,
): string | null {
  for (const requests of Object.values(requestsByCollection)) {
    const saved = requests[savedRequestId];
    if (saved) {
      return saved.name;
    }
  }
  return null;
}

export function resolveTabTitle(
  tab: Pick<RequestTab, "title" | "savedRequestId"> | undefined,
  requestsByCollection: Record<string, Record<string, SavedRequest>>,
): string {
  if (!tab) return FALLBACK_TITLE;

  if (tab.savedRequestId) {
    const savedName = findSavedRequestName(requestsByCollection, tab.savedRequestId);
    if (savedName != null) {
      return savedName;
    }
  }

  return tab.title?.trim() ? tab.title : FALLBACK_TITLE;
}

/** Imperative variant for use outside React render (event handlers, store actions). */
export function getTabTitle(tabId: string): string {
  const tab = useWorkspaceStore.getState().tabsById[tabId];
  const requestsByCollection = useCollectionsStore.getState().requestsByCollection;
  return resolveTabTitle(tab, requestsByCollection);
}

/**
 * React hook variant. Subscribes reactively to both stores and returns the
 * canonical display title for the given tab. Re-renders only when the resolved
 * title actually changes.
 */
export function useTabTitle(tabId: string): string {
  const savedRequestId = useWorkspaceStore(
    (state) => state.tabsById[tabId]?.savedRequestId ?? null,
  );
  const fallbackTitle = useWorkspaceStore(
    (state) => state.tabsById[tabId]?.title ?? "",
  );
  const savedRequestName = useCollectionsStore((state) =>
    savedRequestId ? findSavedRequestName(state.requestsByCollection, savedRequestId) : null,
  );

  if (savedRequestName != null) {
    return savedRequestName;
  }
  return fallbackTitle.trim() ? fallbackTitle : FALLBACK_TITLE;
}
