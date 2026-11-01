/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--background)",
        surface: "var(--surface)",
        edge: "var(--border)",
        ink: "var(--text)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        lost: "var(--lost)",
        found: "var(--found)",
        danger: "var(--danger)",
        focus: "var(--focus-ring)",
        claimed: "var(--claimed)",
        returned: "var(--returned)",
      },
      fontFamily: {
        sans: ["Public Sans", "sans-serif"],
        serif: ["Source Serif 4", "serif"],
      },
      fontSize: {
        xs: ["var(--font-size-xs)", { lineHeight: "1.5" }],
        sm: ["var(--font-size-sm)", { lineHeight: "1.5" }],
        base: ["var(--font-size-base)", { lineHeight: "1.6" }],
        lg: ["var(--font-size-lg)", { lineHeight: "1.45" }],
        xl: ["var(--font-size-xl)", { lineHeight: "1.3" }],
        display: ["var(--font-size-display)", { lineHeight: "1.08" }],
      },
    },
  },
  plugins: [],
};
