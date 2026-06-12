import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { cn } from "@/lib/utils";
import { HttpMethod } from "../../types";
import { METHODS, TOOLBAR_CONTROL_HEIGHT } from "./constants";
import { METHOD_COLORS, MethodBadge } from "@/components/shared/method-badge";

type MethodSelectProps = {
  value: HttpMethod;
  onChange: (method: HttpMethod) => void;
};

export function MethodSelect({ value, onChange }: MethodSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          TOOLBAR_CONTROL_HEIGHT,
          "w-[4.25rem] shrink-0 px-2 text-[11px] font-semibold uppercase",
          "[&_svg:last-child]:h-3.5 [&_svg:last-child]:w-3.5",
          METHOD_COLORS[value],
          "@workspace-compact/workspace:w-auto @workspace-compact/workspace:max-w-[8rem]",
          "@workspace-compact/workspace:px-3",
          "@workspace-compact/workspace:bg-background @workspace-compact/workspace:text-foreground",
          "@workspace-compact/workspace:text-sm @workspace-compact/workspace:font-normal",
          "@workspace-compact/workspace:normal-case",
          "@workspace-compact/workspace:[&_svg:last-child]:h-4 @workspace-compact/workspace:[&_svg:last-child]:w-4",
        )}
      >
        <SelectValue placeholder="Method" />
      </SelectTrigger>
      <SelectContent>
        {METHODS.map((method) => (
          <SelectItem key={method.method} value={method.method}>
            <MethodBadge method={method.method} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
