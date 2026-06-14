import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "night";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "night" ? "night" : "light";
}

/**
 * Reads the theme set by the no-FOUC script in index.html and lets the UI
 * toggle it. Persists to localStorage and drives `data-theme` on <html>.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(currentTheme);

  useEffect(() => {
    if (theme === "night") {
      document.documentElement.dataset.theme = "night";
    } else {
      delete document.documentElement.dataset.theme;
    }
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* localStorage unavailable — theme still applies for this session */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "night" ? "light" : "night"));
  }, []);

  return { theme, toggleTheme };
}
