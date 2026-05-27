import { useEffect } from "react";
import { useWorkspaceTab } from "../../stores";
import {
  clearSseStream,
  connectSse,
  disconnectSse,
  ensureSseRuntimeStarted,
  isSseTabConnected,
  type SseConnectInput,
} from "./sse-runtime";

export type { SseConnectInput };

export function useSseConnection(tabId: string) {
  useEffect(() => {
    ensureSseRuntimeStarted();
  }, []);

  const tab = useWorkspaceTab(tabId);

  return {
    connect: (input: SseConnectInput) => connectSse(tabId, input),
    disconnect: () => disconnectSse(tabId),
    clearStream: () => clearSseStream(tabId),
    isConnected: tab
      ? tab.sseStream.status === "connecting" || tab.sseStream.status === "open"
      : isSseTabConnected(tabId),
  };
}
