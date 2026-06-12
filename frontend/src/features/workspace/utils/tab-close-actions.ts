export function getTabsToCloseToRight(
  orderedTabIds: string[],
  anchorTabId: string,
): string[] {
  const anchorIndex = orderedTabIds.indexOf(anchorTabId);
  if (anchorIndex === -1) {
    return [];
  }

  return orderedTabIds.slice(anchorIndex + 1);
}

export function getOtherTabsToClose(
  orderedTabIds: string[],
  anchorTabId: string,
): string[] {
  return orderedTabIds.filter((tabId) => tabId !== anchorTabId);
}

export function getAllTabsToClose(orderedTabIds: string[]): string[] {
  return [...orderedTabIds];
}
