"use client";

import type { Column } from "@tanstack/react-table";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components";

type Props<TData, TValue> = {
  column: Column<TData, TValue>;

  title: string;
};

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: Props<TData, TValue>) {
  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="
        -ml-3 h-8 gap-1
        px-2 font-medium
        hover:bg-transparent
      "
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      <span>{title}</span>

      {sorted === "asc" ? (
        <ArrowUp className="h-4 w-4" />
      ) : sorted === "desc" ? (
        <ArrowDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}
