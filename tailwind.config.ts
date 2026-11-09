import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: { 950: "#0A0F1D", 900: "#0F172A" },
        cobalt: { DEFAULT: "#2563EB", hover: "#3B82F6" },
        sky: { accent: "#38BDF8", hover: "#0EA5E9" },
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
