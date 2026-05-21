import { Loader2 } from "lucide-react";

type Props = {
  label?: string;
};

export function ResponseLoading({
  label = "Waiting for response...",
}: Props) {
  return (
    <div
      className="
        flex h-full flex-col items-center
        justify-center gap-4
        text-muted-foreground
      "
    >
      <Loader2
        className="
          h-6 w-6 animate-spin
        "
      />

      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">
          {label}
        </p>

        <p className="text-xs">
          Request in progress
        </p>
      </div>
    </div>
  );
}