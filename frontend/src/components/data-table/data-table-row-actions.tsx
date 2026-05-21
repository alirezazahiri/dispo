"use client";

import * as React from "react";

import { Copy, MoreHorizontal, Trash2 } from "lucide-react";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components";

type Action<TData> = {
  label: string;

  icon?: React.ReactNode;

  destructive?: boolean;

  onClick: (row: TData) => void;
};

type Props<TData> = {
  row: TData;

  actions: Action<TData>[];
};

export function DataTableRowActions<TData>({ row, actions }: Props<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="
            h-8 w-8
            text-muted-foreground
            hover:bg-accent
            hover:text-foreground
          "
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {actions.map((action, index) => (
          <React.Fragment key={index}>
            <DropdownMenuItem
              onClick={() => action.onClick(row)}
              className={
                action.destructive
                  ? `
                        text-destructive
                        focus:text-destructive
                      `
                  : undefined
              }
            >
              {action.icon}

              <span>{action.label}</span>
            </DropdownMenuItem>

            {index !== actions.length - 1 && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
