import { Hexagon } from "lucide-react";

export function GraphqlBodyEditor() {
  return (
    <div
      className="
        flex h-full w-full
        flex-col items-center justify-center
        gap-2 px-6 py-10
        text-center text-muted-foreground
      "
    >
      <Hexagon className="h-6 w-6" />
      <div className="text-sm font-medium">GraphQL editor coming soon</div>
      <p className="max-w-sm text-xs">
        Dedicated query and variables panels with schema-aware completion
        are on the roadmap. For now, you can hand-craft a GraphQL request
        in <strong>Text</strong> mode using JSON.
      </p>
    </div>
  );
}
