import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { HttpMethod } from "../../types";
import { METHODS } from "./constants";
import { MethodBadge } from "@/components/shared/method-badge";

type MethodSelectProps = {
  value: HttpMethod;
  onChange: (method: HttpMethod) => void;
};

export function MethodSelect({ value, onChange }: MethodSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="max-w-[8rem]">
        <SelectValue placeholder="Http Method" />
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
