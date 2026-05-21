"use client";

import { Search } from "lucide-react";

import { Input } from "@/components";

type Props = {
  value: string;

  onChange: (value: string) => void;

  placeholder?: string;
};

export function DataTableToolbar({
  value,
  onChange,
  placeholder = "Search...",
}: Props) {
  return (
    <div
      className="
        flex items-center gap-2
        border-b border-border
        p-3
      "
    >
      <div className="relative w-full max-w-sm">
        <Search
          className="
            absolute left-3 top-1/2
            h-4 w-4 -translate-y-1/2
            text-muted-foreground
          "
        />

        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
    </div>
  );
}
