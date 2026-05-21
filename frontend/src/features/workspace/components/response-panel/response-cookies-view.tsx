import { RequestTab } from "../../types";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components";
import type { ResponseCookie } from "../../types/response";

type Props = {
  tab: RequestTab;
};

type CookieRow = ResponseCookie;

export function ResponseCookiesView({ tab }: Props) {
  const [query, setQuery] = useState("");
  const cookies = tab.response?.cookies ?? [];

  const filteredCookies = useMemo(() => {
    if (!query.trim()) {
      return cookies;
    }

    const normalized = query.toLowerCase();
    return cookies.filter((cookie) =>
      [
        cookie.name,
        cookie.value,
        cookie.domain,
        cookie.path,
        cookie.sameSite,
      ].some((value) => value?.toLowerCase().includes(normalized)),
    );
  }, [cookies, query]);

  const columns = useMemo<ColumnDef<CookieRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
      },
      {
        accessorKey: "value",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Value" />
        ),
      },
      {
        accessorKey: "domain",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Domain" />
        ),
      },
      {
        accessorKey: "path",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Path" />
        ),
      },
      {
        accessorKey: "sameSite",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="SameSite" />
        ),
      },
      {
        accessorKey: "expires",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Expires" />
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center border-b border-border p-3">
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
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cookies..."
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCookies}
        emptyMessage="No cookies found."
        className="rounded-none border-0"
      />
    </div>
  );
}
