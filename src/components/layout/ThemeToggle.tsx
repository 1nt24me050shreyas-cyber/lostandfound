import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { ThemePreference } from "@/app/theme-types";

export function ThemeToggle() {
  const { preference, setTheme } = useTheme();
  const nextTheme: ThemePreference =
    preference === "system" ? "dark" : preference === "dark" ? "light" : "system";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Theme: ${preference}. Activate to switch to ${nextTheme}.`}
    >
      {preference === "dark" ? (
        <Sun size={17} aria-hidden="true" />
      ) : preference === "light" ? (
        <Moon size={17} aria-hidden="true" />
      ) : (
        <Monitor size={17} aria-hidden="true" />
      )}
    </button>
  );
}
