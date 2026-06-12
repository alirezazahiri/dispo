import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { TOOLBAR_CONTROL_HEIGHT } from "./constants";

type EnvironmentSelectProps = {
  environments: Array<{ id: string; name: string }>;
  activeEnvironmentId?: string;
  onSelect: (environmentId: string) => void;
};

export function EnvironmentSelect({
  environments,
  activeEnvironmentId,
  onSelect,
}: EnvironmentSelectProps) {
  return (
    <div className="flex min-w-0 max-w-[200px] items-center gap-2">
      <Select value={activeEnvironmentId} onValueChange={onSelect}>
        <SelectTrigger className={TOOLBAR_CONTROL_HEIGHT}>
          <SelectValue placeholder="Environment" />
        </SelectTrigger>
        <SelectContent>
          {environments.map((environment) => (
            <SelectItem key={environment.id} value={environment.id}>
              {environment.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
