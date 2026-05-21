import * as React from "react";
import { Copy, Search } from "lucide-react";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Input, Button } from "@/components";

type HeaderRow = {
  key: string;

  value: string;
};

type Props = {
  headers: HeaderRow[];
};

export function ResponseHeadersView({ headers }: Props) {
  const [query, setQuery] = React.useState("");

  const filteredHeaders = React.useMemo(() => {
    if (!query.trim()) {
      return headers;
    }

    const normalized = query.toLowerCase();

    return headers.filter(
      (header) =>
        header.key.toLowerCase().includes(normalized) ||
        header.value.toLowerCase().includes(normalized),
    );
  }, [headers, query]);

  const columns = React.useMemo<ColumnDef<HeaderRow>[]>(
    () => [
      {
        accessorKey: "key",

        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Header" />
        ),

        cell: ({ row }) => (
          <div
            className="
                font-mono text-xs
                text-foreground
              "
          >
            {row.original.key}
          </div>
        ),
      },

      {
        accessorKey: "value",

        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Value" />
        ),

        cell: ({ row }) => (
          <div
            className="
                flex items-start gap-2
              "
          >
            <div
              className="
                  min-w-0 flex-1
                  break-all
                  font-mono text-xs
                  text-muted-foreground
                "
            >
              {row.original.value}
            </div>

            <Button
              size="icon"
              variant="ghost"
              className="
                  h-7 w-7 shrink-0
                "
              onClick={() => navigator.clipboard.writeText(row.original.value)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div
      className="
        flex h-full min-h-0
        flex-col
      "
    >
      <div
        className="
          flex shrink-0 items-center
          border-b border-border
          p-3
        "
      >
        <div className="relative w-full max-w-sm">
          <Search
            className="
              absolute left-3 top-1/2
              h-4 w-4
              -translate-y-1/2
              text-muted-foreground
            "
          />

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headers..."
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredHeaders}
        emptyMessage="No headers found."
        className="
          rounded-none border-0
        "
      />
    </div>
  );
}
