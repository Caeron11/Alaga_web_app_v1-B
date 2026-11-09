import { useCallback, useEffect, useRef, useState } from "react";
import type { LGU } from "../../types";

export const FALLBACK_LGU: LGU = { label: "PARAÑAQUE LGU", city: "Parañaque", source: "fallback" };
export const SUPPORTED_LGUS: readonly string[] = ["Parañaque", "Quezon City", "Taguig", "Manila", "Makati"];

const STORAGE_KEY = "alaga.lgu";
const GEOCODE_TIMEOUT_MS = 5000;
const NOMINATIM: string = import.meta.env.VITE_GEOCODER_URL || "https://nominatim.openstreetmap.org/reverse";

const normalize = (raw: string): string => raw.replace(/^city of\s+/i, "").trim();

export const toLGU = (city: string, source: LGU["source"], barangay?: string): LGU => ({
  label: `${normalize(city).toUpperCase()} LGU`,
  city: normalize(city),
  barangay,
  source,
});

interface NominatimAddress {
  city?: string;
  municipality?: string;
  town?: string;
  county?: string;
  suburb?: string;
  quarter?: string;
  neighbourhood?: string;
}

async function reverseLookup(lat: number, lon: number, signal: AbortSignal): Promise<LGU | null> {
  const res = await fetch(`${NOMINATIM}?format=jsonv2&zoom=14&lat=${lat}&lon=${lon}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { address?: NominatimAddress };
  const a = data.address;
  const city = a?.city ?? a?.municipality ?? a?.town ?? a?.county;
  if (!a || !city) return null;
  return toLGU(city, "gps", a.suburb ?? a.quarter ?? a.neighbourhood);
}

const readStored = (): LGU | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LGU) : null;
  } catch {
    return null;
  }
};

const writeStored = (lgu: LGU): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lgu));
  } catch {
    /* storage unavailable: keep in state only */
  }
};

export interface UseGeolocationLGU {
  lgu: LGU;
  loading: boolean;
  denied: boolean;
  detect: () => void;
  setManual: (city: string) => void;
}

export function useGeolocationLGU(autoDetect = true): UseGeolocationLGU {
  const [lgu, setLgu] = useState<LGU>(() => readStored() ?? FALLBACK_LGU);
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const apply = useCallback((next: LGU) => {
    setLgu(next);
    writeStored(next);
  }, []);

  const keepManualOrFallback = useCallback(
    () => setLgu((cur) => (cur.source === "manual" ? cur : FALLBACK_LGU)),
    [],
  );

  const detect = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setDenied(true);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        const timer = window.setTimeout(() => ctrl.abort(), GEOCODE_TIMEOUT_MS);
        try {
          const found = await reverseLookup(pos.coords.latitude, pos.coords.longitude, ctrl.signal);
          if (found) apply(found);
          else keepManualOrFallback();
          setDenied(false);
        } catch {
          keepManualOrFallback();
        } finally {
          window.clearTimeout(timer);
          setLoading(false);
        }
      },
      () => {
        setDenied(true);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  }, [apply, keepManualOrFallback]);

  const setManual = useCallback((city: string) => apply(toLGU(city, "manual")), [apply]);

  useEffect(() => {
    if (!autoDetect) return;
    if (readStored()?.source === "manual") return;
    detect();
    return () => abortRef.current?.abort();
  }, [autoDetect, detect]);

  return { lgu, loading, denied, detect, setManual };
}
