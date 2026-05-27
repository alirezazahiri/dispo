import { Check } from "lucide-react";
import {
  Badge,
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectPrimitiveItem,
  SelectPrimitiveItemText,
  SelectPrimitiveItemIndicator,
} from "@/components";
import { cn } from "@/lib/utils";
import type { WorkspaceProtocol } from "../../types";
import { getProtocolMeta, PROTOCOL_META } from "../../protocols/constants";

type ProtocolSelectProps = {
  value: WorkspaceProtocol;
  onChange: (protocol: WorkspaceProtocol) => void;
};

export function ProtocolSelect({ value, onChange }: ProtocolSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as WorkspaceProtocol)}
    >
      <SelectTrigger className="w-[7.5rem] shrink-0">
        <SelectValue placeholder="Protocol">
          {getProtocolMeta(value).shortLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        {PROTOCOL_META.map((protocol) => (
          <SelectPrimitiveItem
            key={protocol.id}
            value={protocol.id}
            disabled={protocol.availability === "coming_soon"}
            className={cn(
              "relative flex w-full cursor-default select-none flex-col rounded-sm py-2 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            )}
          >
            <span className="absolute left-2 top-2.5 flex h-3.5 w-3.5 items-center justify-center">
              <SelectPrimitiveItemIndicator>
                <Check className="h-4 w-4" />
              </SelectPrimitiveItemIndicator>
            </span>

            <SelectPrimitiveItemText asChild>
              <div className="flex items-center gap-2 font-medium">
                {protocol.shortLabel}
                {protocol.availability === "coming_soon" ? (
                  <Badge variant="muted" className="text-[10px] px-1 py-0">
                    Soon
                  </Badge>
                ) : null}
              </div>
            </SelectPrimitiveItemText>

            <span className="text-[11px] text-muted-foreground leading-tight pl-0">
              {protocol.description}
            </span>
          </SelectPrimitiveItem>
        ))}
      </SelectContent>
    </Select>
  );
}
