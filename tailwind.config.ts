import type { Config } from "tailwindcss";

/** Colour tokens resolve through CSS variables (see src/index.css), so every existing
 *  `slate-*` / semantic utility re-colours automatically when `.dark` is removed. */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        slate: {
          50: v("slate-50"), 100: v("slate-100"), 200: v("slate-200"), 300: v("slate-300"), 400: v("slate-400"),
          500: v("slate-500"), 600: v("slate-600"), 700: v("slate-700"), 800: v("slate-800"), 900: v("slate-900"), 950: v("slate-950"),
        },
        navy: { 950: v("navy-950"), 900: v("navy-900") },
        hairline: "var(--hairline)",
        emerald: { 300: v("emerald-300"), 400: v("emerald-400") },
        amber: { 300: v("amber-300") },
        orange: { 300: v("orange-300") },
        red: { 300: v("red-300"), 400: v("red-400") },
        rose: { 200: v("rose-200"), 300: v("rose-300"), 400: v("rose-400"), 950: v("rose-950") },
        sky: { 300: v("sky-300"), 400: v("sky-400"), accent: "#38BDF8", hover: "#0EA5E9" },
        cobalt: { DEFAULT: "#2563EB", hover: "#3B82F6" },
        emergency: { DEFAULT: "#DC2626", soft: "#E11D48" },
        ok: "#4CC38A",
      },
      fontFamily: {
        sans: ["Geist", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "IBM Plex Mono", "ui-monospace", "monospace"],
      },
      spacing: { 4.5: "18px", 11: "44px", 13: "52px", 14: "56px" },
      minHeight: { touch: "44px" },
      minWidth: { touch: "44px" },
      borderRadius: { control: "8px", card: "14px", panel: "18px" },
      boxShadow: {
        raised: "inset 0 1px 0 rgba(255,255,255,0.08)",
        fab: "0 8px 20px rgba(127,29,29,0.5)",
      },
      transitionTimingFunction: { alaga: "cubic-bezier(0.22, 1, 0.36, 1)" },
      keyframes: {
        "toast-progress": { from: { transform: "scaleX(1)" }, to: { transform: "scaleX(0)" } },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "live-pulse": { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.35" } },
      },
      animation: {
        "toast-progress": "toast-progress 4s linear forwards",
        "toast-in": "toast-in 240ms cubic-bezier(0.22,1,0.36,1)",
        "live-pulse": "live-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
