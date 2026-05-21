"use client";

import * as React from "react";

import {
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { Table } from "@/components";

import { cn } from "@/lib/utils";

import { DataTableHeader } from "./data-table-header";
import { DataTableBody } from "./data-table-body";

type Props<TData> = {
  columns: ColumnDef<TData, unknown>[];

  data: TData[];

  loading?: boolean;

  emptyMessage?: string;

  className?: string;

  tableClassName?: string;

  stickyHeader?: boolean;
};

export function DataTable<TData>({
  columns,
  data,
  loading,
  emptyMessage = "No results.",
  className,
  tableClassName,
  stickyHeader = true,
}: Props<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,

    state: {
      sorting,
    },

    onSortingChange: setSorting,

    getCoreRowModel: getCoreRowModel(),

    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div
      className={cn(
        `
          min-h-0 flex-1 overflow-auto
          rounded-md border border-border
          bg-card
        `,
        className,
      )}
    >
      <Table className={tableClassName}>
        <DataTableHeader table={table} />

        <DataTableBody
          table={table}
          columnsLength={columns.length}
          loading={loading}
          emptyMessage={emptyMessage}
        />
      </Table>
    </div>
  );
}
