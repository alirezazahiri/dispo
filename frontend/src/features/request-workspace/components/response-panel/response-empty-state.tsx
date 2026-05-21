export function ResponseEmptyState() {
  return (
    <div
      className="
          flex h-full flex-col items-center
          justify-center gap-2
          text-muted-foreground
        "
    >
      <div className="text-sm">No response yet</div>

      <div className="text-xs">Send a request to see the response</div>
    </div>
  );
}
