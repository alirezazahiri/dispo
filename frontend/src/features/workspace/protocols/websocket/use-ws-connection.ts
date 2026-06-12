import { useEffect } from "react";
import { useWorkspaceTab } from "../../stores";
import {
  clearWsStream,
  connectWs,
  disconnectWs,
  ensureWsRuntimeStarted,
  isWsTabConnected,
  sendWsMessage,
  type WsConnectInput,
  type WsSendInput,
} from "./ws-runtime";

export type { WsConnectInput, WsSendInput };

export function useWsConnection(tabId: string) {
  useEffect(() => {
    ensureWsRuntimeStarted();
  }, []);

  const tab = useWorkspaceTab(tabId);

  return {
    connect: (input: WsConnectInput) => connectWs(tabId, input),
    disconnect: () => disconnectWs(tabId),
    sendMessage: (input: WsSendInput) => sendWsMessage(tabId, input),
    clearStream: () => clearWsStream(tabId),
    isConnected: tab
      ? tab.wsStream.status === "connecting" || tab.wsStream.status === "open"
      : isWsTabConnected(tabId),
  };
}
