"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components";

type Props = {
  page: number;

  totalPages: number;

  onPrevious: () => void;

  onNext: () => void;
};

export function DataTablePagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div
      className="
        flex items-center justify-between
        border-t border-border
        p-3
      "
    >
      <div
        className="
          text-sm text-muted-foreground
        "
      >
        Page {page} of {totalPages}
      </div>

      <div className="flex gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={onPrevious}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="outline"
          onClick={onNext}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
