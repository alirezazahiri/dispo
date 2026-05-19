// src/components/shared/theme-toggle-button.tsx

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggleButton() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleTheme}
      className="
        h-8 w-8
        text-foreground
        hover:bg-zinc-900
        hover:text-white
        dark:hover:bg-zinc-900
        dark:hover:text-white
      "
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
