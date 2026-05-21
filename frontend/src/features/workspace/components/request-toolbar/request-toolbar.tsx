import { SendHorizonal, Loader2 } from "lucide-react";

import type { RequestTab, HttpMethod, KeyValuePair } from "../../types";

import { useWorkspaceStore } from "../../stores";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { useSendHttpRequest } from "../../hooks";
import { toast } from "sonner";

type Props = {
  tab: RequestTab;
};

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function RequestToolbar({ tab }: Props) {
  const updateTab = useWorkspaceStore((state) => state.updateTab);

  const { mutateAsync: sendHttpRequest, isPending } = useSendHttpRequest();

  const handleMethodChange = (method: HttpMethod) => {
    updateTab(tab.id, {
      method,

      isDirty: true,
    });
  };

  const handleUrlChange = (url: string) => {
    updateTab(tab.id, {
      url,

      title: url.length > 0 ? url : "New Request",

      isDirty: true,
    });
  };

  const handleSendRequest = async () => {
    if (!tab.url) {
      toast.error("Request URL is required");

      return;
    }

    updateTab(tab.id, {
      isSending: true,
    });

    try {
      const response = await sendHttpRequest({
        id: tab.id,

        method: tab.method,

        url: tab.url,

        headers:
          tab.headers
            ?.filter((header) => header.enabled && header.key)
            .reduce<Record<string, string>>((acc, header) => {
              acc[header.key] = header.value;

              return acc;
            }, {}) ?? {},

        body: tab.body,
      });

      updateTab(tab.id, {
        response: {
          status:
            response.status >= 200 && response.status < 300
              ? "success"
              : "error",

          statusCode: response.status,

          statusText: response.statusText,

          timeMs: response.duration,

          size: response.body.length,

          body: response.body,

          headers: response.headers,
        },

        isSending: false,

        isDirty: false,
      });
    } catch (error) {
      console.error(error);

      toast.error("Request failed");

      updateTab(tab.id, {
        isSending: false,
      });
    }
  };

  return (
    <div
      className="
        flex h-14 shrink-0
        items-center gap-3
        border-b border-border
        bg-background px-4
      "
    >
      <MethodSelect value={tab.method} onChange={handleMethodChange} />

      <UrlInput value={tab.url} onChange={handleUrlChange} />

      <Button
        onClick={handleSendRequest}
        disabled={tab.isSending || isPending}
        className="
          min-w-[96px] gap-2
        "
      >
        {tab.isSending || isPending ? (
          <>
            <Loader2
              className="
                h-4 w-4
                animate-spin
              "
            />
            Sending
          </>
        ) : (
          <>
            <SendHorizonal className="h-4 w-4" />
            Send
          </>
        )}
      </Button>
    </div>
  );
}

type MethodSelectProps = {
  value: HttpMethod;
  onChange: (method: HttpMethod) => void;
};

function MethodSelect({ value, onChange }: MethodSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="max-w-[8rem]">
        <SelectValue placeholder="Http Method" />
      </SelectTrigger>
      <SelectContent>
        {METHODS.map((method) => (
          <SelectItem key={method} value={method}>
            {method}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type UrlInputProps = {
  value: string;

  onChange: (value: string) => void;
};

function UrlInput({ value, onChange }: UrlInputProps) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="https://api.example.com/users"
    />
  );
}
