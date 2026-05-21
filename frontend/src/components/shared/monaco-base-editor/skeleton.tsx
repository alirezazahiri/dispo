import { Skeleton } from "@/components";

export function MonacoBaseEditorSkeleton() {
  return (
    <div
      className="
        flex h-full w-full overflow-hidden
        bg-[hsl(var(--editor))]
      "
    >
      {/* gutter */}
      <div
        className="
          flex w-12 min-w-12 shrink-0
          flex-col gap-3
          border-r border-border
          px-3 py-4
        "
      >
        {Array.from({ length: 14 }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-4 rounded-sm" />
        ))}
      </div>

      {/* content */}
      <div
        className="
          flex min-w-0 flex-1 flex-col
          gap-3 overflow-hidden
          px-4 py-4
        "
      >
        <Skeleton className="h-3 w-[80%]" />

        <Skeleton className="h-3 w-[45%]" />

        <Skeleton className="h-3 w-[70%]" />

        <Skeleton className="h-3 w-[35%]" />

        <div className="shrink-0 h-3" />

        <Skeleton className="h-3 w-[90%]" />

        <Skeleton className="h-3 w-[60%]" />

        <Skeleton className="h-3 w-[72%]" />

        <div className="shrink-0 h-3" />

        <Skeleton className="h-3 w-[40%]" />

        <Skeleton className="h-3 w-[82%]" />

        <Skeleton className="h-3 w-[50%]" />
      </div>
    </div>
  );
}
