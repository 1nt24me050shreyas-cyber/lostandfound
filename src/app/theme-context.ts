import { createContext } from "react";
import type { ThemePreference } from "@/app/theme-types";

export type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
