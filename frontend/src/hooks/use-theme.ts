import { useTheme as useNextTheme } from "next-themes";

export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return {
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,

    isDark,
    toggleTheme,
  };
}
