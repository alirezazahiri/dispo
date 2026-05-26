import { Ban } from "lucide-react";

export function NoneBodyEditor() {
  return (
    <div
      className="
        flex h-full w-full
        flex-col items-center justify-center
        gap-2 px-6 py-10
        text-center text-muted-foreground
      "
    >
      <Ban className="h-6 w-6" />
      <div className="text-sm font-medium">No body will be sent</div>
      <p className="max-w-sm text-xs">
        This request will be dispatched without a body. Switch to another
        mode above to attach text, form fields, or a file.
      </p>
    </div>
  );
}
