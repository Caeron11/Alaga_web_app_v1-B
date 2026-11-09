import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale, ThemeMode } from "../../types";
import { loadJSON, saveJSON } from "./storage";

export const FONT_SCALE_MIN = 85;
export const FONT_SCALE_MAX = 125;
export const FONT_SCALE_DEFAULT = 100;
export const FONT_SCALE_STEP = 5;

const KEY = "alaga.settings";

interface Persisted {
  fontScale: number;
  locale: Locale;
  theme: ThemeMode;
  smsDoctorAvailability: boolean;
  smsMedicineRestock: boolean;
}

const DEFAULTS: Persisted = {
  fontScale: FONT_SCALE_DEFAULT,
  locale: "fil",
  theme: "dark",
  smsDoctorAvailability: true,
  smsMedicineRestock: true,
};

const clampScale = (n: number): number => {
  if (!Number.isFinite(n)) return FONT_SCALE_DEFAULT;
  const snapped = Math.round(n / FONT_SCALE_STEP) * FONT_SCALE_STEP;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, snapped));
};

/** Accept only known keys with valid types, so stale or tampered storage can't break the shell. */
function sanitize(raw: Record<string, unknown>): Persisted {
  return {
    fontScale: typeof raw.fontScale === "number" ? clampScale(raw.fontScale) : DEFAULTS.fontScale,
    locale: raw.locale === "en" || raw.locale === "fil" ? raw.locale : DEFAULTS.locale,
    theme: raw.theme === "light" || raw.theme === "dark" ? raw.theme : DEFAULTS.theme,
    smsDoctorAvailability: typeof raw.smsDoctorAvailability === "boolean" ? raw.smsDoctorAvailability : DEFAULTS.smsDoctorAvailability,
    smsMedicineRestock: typeof raw.smsMedicineRestock === "boolean" ? raw.smsMedicineRestock : DEFAULTS.smsMedicineRestock,
  };
}

interface SettingsValue extends Persisted {
  canIncrease: boolean;
  canDecrease: boolean;
  setFontScale: (pct: number) => void;
  increaseFont: () => void;
  decreaseFont: () => void;
  resetFont: () => void;
  setLocale: (l: Locale) => void;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  setSmsDoctorAvailability: (on: boolean) => void;
  setSmsMedicineRestock: (on: boolean) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(() => sanitize(loadJSON<Record<string, unknown>>(KEY, {})));

  // Root font size as a percentage of the browser default, so every rem value scales
  useEffect(() => {
    document.documentElement.style.fontSize = `${state.fontScale}%`;
  }, [state.fontScale]);

  // Theme: the `.dark` class on <html> drives the CSS-variable palette in index.css
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", state.theme === "dark");
    root.style.colorScheme = state.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", state.theme === "dark" ? "#0A0F1D" : "#FFFFFF");
    document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", state.theme);
  }, [state.theme]);

  useEffect(() => {
    document.documentElement.lang = state.locale === "fil" ? "fil" : "en";
  }, [state.locale]);

  useEffect(() => {
    saveJSON(KEY, state);
  }, [state]);

  const patch = useCallback((p: Partial<Persisted>) => setState((s) => ({ ...s, ...p })), []);

  const setFontScale = useCallback((pct: number) => patch({ fontScale: clampScale(pct) }), [patch]);
  const increaseFont = useCallback(() => setState((s) => ({ ...s, fontScale: clampScale(s.fontScale + FONT_SCALE_STEP) })), []);
  const decreaseFont = useCallback(() => setState((s) => ({ ...s, fontScale: clampScale(s.fontScale - FONT_SCALE_STEP) })), []);
  const resetFont = useCallback(() => patch({ fontScale: FONT_SCALE_DEFAULT }), [patch]);
  const toggleTheme = useCallback(() => setState((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" })), []);

  const value = useMemo<SettingsValue>(
    () => ({
      ...state,
      canIncrease: state.fontScale < FONT_SCALE_MAX,
      canDecrease: state.fontScale > FONT_SCALE_MIN,
      setFontScale,
      increaseFont,
      decreaseFont,
      resetFont,
      setLocale: (locale) => patch({ locale }),
      setTheme: (theme) => patch({ theme }),
      toggleTheme,
      setSmsDoctorAvailability: (smsDoctorAvailability) => patch({ smsDoctorAvailability }),
      setSmsMedicineRestock: (smsMedicineRestock) => patch({ smsMedicineRestock }),
    }),
    [state, setFontScale, increaseFont, decreaseFont, resetFont, toggleTheme, patch],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
