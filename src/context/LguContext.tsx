import { createContext, useContext, type ReactNode } from "react";
import { useGeolocationLGU, type UseGeolocationLGU } from "../hooks/useGeolocationLGU";

const LguContext = createContext<UseGeolocationLGU | null>(null);

/** Single shared GPS lookup so the header badge and the settings drawer stay in sync. */
export function LguProvider({ children }: { children: ReactNode }) {
  const value = useGeolocationLGU(true);
  return <LguContext.Provider value={value}>{children}</LguContext.Provider>;
}

export function useLgu(): UseGeolocationLGU {
  const ctx = useContext(LguContext);
  if (!ctx) throw new Error("useLgu must be used within LguProvider");
  return ctx;
}
