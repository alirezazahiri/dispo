import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";

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
    <div className="flex items-center gap-2 min-w-[180px]">
      <Select value={activeEnvironmentId} onValueChange={onSelect}>
        <SelectTrigger>
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
