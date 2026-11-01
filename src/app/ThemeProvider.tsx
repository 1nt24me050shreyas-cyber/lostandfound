import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext } from "@/app/theme-context";
import type { ThemePreference } from "@/app/theme-types";

const STORAGE_KEY = "common-ground-theme";
function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readPreference(): ThemePreference {
  const preference = document.documentElement.dataset.themePreference;
  if (preference === "light" || preference === "dark" || preference === "system") return preference;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch (error) {
    console.warn("Theme preference could not be read from storage.", error);
  }

  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme);
  const resolvedTheme = preference === "system" ? systemTheme : preference;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.themePreference = preference;
    root.style.colorScheme = resolvedTheme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", resolvedTheme === "dark" ? "#121413" : "#f7f5f0");
    try {
      window.localStorage.setItem(STORAGE_KEY, preference);
    } catch (error) {
      console.warn("Theme preference could not be saved to storage.", error);
    }
  }, [preference, resolvedTheme]);

  const setTheme = useCallback((theme: ThemePreference) => setPreference(theme), []);
  const value = useMemo(
    () => ({ preference, resolvedTheme, setTheme }),
    [preference, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
