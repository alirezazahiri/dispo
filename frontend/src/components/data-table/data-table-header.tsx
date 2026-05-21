"use client";

import type {
  HeaderGroup,
  Table as TanstackTable,
} from "@tanstack/react-table";

import { flexRender } from "@tanstack/react-table";

import { TableHead, TableHeader, TableRow } from "@/components";

import { cn } from "@/lib/utils";

type Props<TData> = {
  table: TanstackTable<TData>;

  sticky?: boolean;

  className?: string;
};

export function DataTableHeader<TData>({
  table,
  sticky = true,
  className,
}: Props<TData>) {
  return (
    <TableHeader
      className={cn(
        sticky &&
          `
            sticky top-0 z-20
            bg-card/95
            backdrop-blur
          `,
        className,
      )}
    >
      {table.getHeaderGroups().map((headerGroup) => (
        <HeaderRow key={headerGroup.id} headerGroup={headerGroup} />
      ))}
    </TableHeader>
  );
}

type HeaderRowProps<TData> = {
  headerGroup: HeaderGroup<TData>;
};

function HeaderRow<TData>({ headerGroup }: HeaderRowProps<TData>) {
  return (
    <TableRow
      className="
        hover:bg-transparent
      "
    >
      {headerGroup.headers.map((header) => (
        <TableHead
          key={header.id}
          colSpan={header.colSpan}
          className="
              h-10 whitespace-nowrap
              border-b border-border
              bg-card
            "
        >
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </TableHead>
      ))}
    </TableRow>
  );
}
