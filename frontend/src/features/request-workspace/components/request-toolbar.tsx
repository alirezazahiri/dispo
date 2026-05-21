import { SendHorizonal, Loader2 } from "lucide-react";

import type { RequestTab, HttpMethod } from "../types";

import { useWorkspaceStore } from "../stores";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";

type Props = {
  tab: RequestTab;
};

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function RequestToolbar({ tab }: Props) {
  const updateTab = useWorkspaceStore((state) => state.updateTab);

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
    updateTab(tab.id, {
      isSending: true,
    });

    try {
      /**
       * temporary fake request
       */

      await new Promise((resolve) => setTimeout(resolve, 1000));

      updateTab(tab.id, {
        response: {
          status: 200,
          statusText: "OK",
          duration: 124,
          size: 1024,
          data: {
            success: true,
          },
        },

        isSending: false,

        isDirty: false,
      });
    } catch {
      updateTab(tab.id, {
        isSending: false,
      });
    }
  };

  return (
    <div
      className="
        flex h-14 shrink-0 items-center gap-3
        border-b border-border
        bg-background px-4
      "
    >
      <MethodSelect value={tab.method} onChange={handleMethodChange} />

      <UrlInput value={tab.url} onChange={handleUrlChange} />

      <Button
        onClick={handleSendRequest}
        disabled={tab.isSending}
        className="min-w-[96px] gap-2"
      >
        {tab.isSending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
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
