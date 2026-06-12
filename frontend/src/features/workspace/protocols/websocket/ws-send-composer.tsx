import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { FileUp, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button, Label } from "@/components";
import { backendClient } from "@/lib/backend/client";
import type { RequestTab, WsMessageType } from "../../types";
import { useWsConnection } from "./use-ws-connection";

type Props = {
  tab: RequestTab;
};

export function WsSendComposer({ tab }: Props) {
  const { sendMessage, isConnected } = useWsConnection(tab.id);
  const [messageType, setMessageType] = useState<WsMessageType>("text");
  const [textPayload, setTextPayload] = useState("");
  const [binaryPayload, setBinaryPayload] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!isConnected) {
      toast.error("Connect before sending a message");
      return;
    }

    const data = messageType === "text" ? textPayload : binaryPayload.trim();
    if (!data) {
      toast.error("Message payload is required");
      return;
    }

    if (messageType === "binary") {
      try {
        atob(data);
      } catch {
        toast.error("Binary payload must be valid base64");
        return;
      }
    }

    setIsSending(true);
    try {
      await sendMessage({ messageType, data });
      if (messageType === "text") {
        setTextPayload("");
      } else {
        setBinaryPayload("");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await backendClient.pickFile({
        title: "Select binary payload",
      });
      if (result.cancelled || !result.path) {
        return;
      }

      const base64 = await backendClient.websocket.readFileBase64(result.path);
      setBinaryPayload(base64);
      setMessageType("binary");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to read selected file",
      );
    }
  };

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Send as</Label>
          <div className="inline-flex rounded-md border border-border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={messageType === "text" ? "secondary" : "ghost"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setMessageType("text")}
            >
              Text
            </Button>
            <Button
              type="button"
              size="sm"
              variant={messageType === "binary" ? "secondary" : "ghost"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setMessageType("binary")}
            >
              Binary
            </Button>
          </div>
        </div>

        {messageType === "binary" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => void handlePickFile()}
          >
            <FileUp className="h-3.5 w-3.5" />
            Pick file
          </Button>
        ) : null}
      </div>

      {messageType === "text" ? (
        <textarea
          value={textPayload}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            setTextPayload(event.target.value)
          }
          placeholder='{"type":"ping"}'
          className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isConnected || isSending}
          onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              void handleSend();
            }
          }}
        />
      ) : (
        <textarea
          value={binaryPayload}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            setBinaryPayload(event.target.value)
          }
          placeholder="Base64-encoded binary payload"
          className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isConnected || isSending}
        />
      )}

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          {messageType === "text"
            ? "Ctrl+Enter to send"
            : "Paste base64 or pick a file"}
        </p>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={!isConnected || isSending}
          onClick={() => void handleSend()}
        >
          {isSending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Send
        </Button>
      </div>
    </div>
  );
}
