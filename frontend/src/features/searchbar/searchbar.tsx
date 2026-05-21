import { Kbd, KbdGroup } from "@/components";
import { Search } from "lucide-react";
import React from "react";

export const SearchBar: React.FC = () => {
  return (
    <div className="flex w-full max-w-md items-center px-6">
      <button
        className="
        flex h-9 w-full items-center gap-2
        rounded-md border border-input
        bg-background px-3
        text-sm text-muted-foreground
        transition-colors
        hover:bg-accent
        hover:text-foreground
      "
      >
        <Search className="h-4 w-4 shrink-0" />

        <span>Search requests...</span>

        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </button>
    </div>
  );
};
