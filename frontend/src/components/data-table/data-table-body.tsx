"use client";

import type { Row, Table as TanstackTable } from "@tanstack/react-table";

import { flexRender } from "@tanstack/react-table";

import { TableBody, TableCell, TableRow } from "@/components";

import { cn } from "@/lib/utils";

import { DataTableEmpty } from "./data-table-empty";
import { DataTableLoading } from "./data-table-loading";

type Props<TData> = {
  table: TanstackTable<TData>;

  columnsLength: number;

  loading?: boolean;

  emptyMessage?: string;

  rowClassName?: string;

  cellClassName?: string;
};

export function DataTableBody<TData>({
  table,
  columnsLength,
  loading,
  emptyMessage = "No results.",
  rowClassName,
  cellClassName,
}: Props<TData>) {
  if (loading) {
    return (
      <TableBody>
        <DataTableLoading columnCount={columnsLength} />
      </TableBody>
    );
  }

  const rows = table.getRowModel().rows;

  if (!rows.length) {
    return (
      <TableBody>
        <DataTableEmpty colSpan={columnsLength} message={emptyMessage} />
      </TableBody>
    );
  }

  return (
    <TableBody>
      {rows.map((row) => (
        <BodyRow
          key={row.id}
          row={row}
          rowClassName={rowClassName}
          cellClassName={cellClassName}
        />
      ))}
    </TableBody>
  );
}

type BodyRowProps<TData> = {
  row: Row<TData>;

  rowClassName?: string;

  cellClassName?: string;
};

function BodyRow<TData>({
  row,
  rowClassName,
  cellClassName,
}: BodyRowProps<TData>) {
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      className={cn(
        `
          transition-colors
        `,
        rowClassName,
      )}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={cn(
            `
                align-top
              `,
            cellClassName,
          )}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}
