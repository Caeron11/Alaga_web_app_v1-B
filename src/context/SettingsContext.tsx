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
  smsAlerts: boolean;
}

const DEFAULTS: Persisted = { fontScale: FONT_SCALE_DEFAULT, locale: "fil", theme: "dark", smsAlerts: true };

const clampScale = (n: number): number => {
  if (!Number.isFinite(n)) return FONT_SCALE_DEFAULT;
  const snapped = Math.round(n / FONT_SCALE_STEP) * FONT_SCALE_STEP;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, snapped));
};

interface SettingsValue extends Persisted {
  canIncrease: boolean;
  canDecrease: boolean;
  setFontScale: (pct: number) => void;
  increaseFont: () => void;
  decreaseFont: () => void;
  resetFont: () => void;
  setLocale: (l: Locale) => void;
  setTheme: (t: ThemeMode) => void;
  setSmsAlerts: (on: boolean) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(() => {
    const stored = loadJSON<Partial<Persisted>>(KEY, {});
    return { ...DEFAULTS, ...stored, fontScale: clampScale(stored.fontScale ?? DEFAULTS.fontScale) };
  });

  // Root font size: percentage of the browser default, so rem units scale everywhere
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${state.fontScale}%`;
    return () => {
      root.style.fontSize = "";
    };
  }, [state.fontScale]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", state.theme === "dark");
    root.style.colorScheme = state.theme;
    root.lang = state.locale === "fil" ? "fil" : "en";
  }, [state.theme, state.locale]);

  useEffect(() => {
    saveJSON(KEY, state);
  }, [state]);

  const patch = useCallback((p: Partial<Persisted>) => setState((s) => ({ ...s, ...p })), []);

  const setFontScale = useCallback((pct: number) => patch({ fontScale: clampScale(pct) }), [patch]);
  const increaseFont = useCallback(
    () => setState((s) => ({ ...s, fontScale: clampScale(s.fontScale + FONT_SCALE_STEP) })),
    [],
  );
  const decreaseFont = useCallback(
    () => setState((s) => ({ ...s, fontScale: clampScale(s.fontScale - FONT_SCALE_STEP) })),
    [],
  );
  const resetFont = useCallback(() => patch({ fontScale: FONT_SCALE_DEFAULT }), [patch]);

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
      setSmsAlerts: (smsAlerts) => patch({ smsAlerts }),
    }),
    [state, setFontScale, increaseFont, decreaseFont, resetFont, patch],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
