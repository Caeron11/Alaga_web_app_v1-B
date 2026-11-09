import type { ReactNode } from "react";
import { AuthProvider } from "./AuthContext";
import { HealthDataProvider } from "./HealthDataContext";
import { LguProvider } from "./LguContext";
import { SettingsProvider } from "./SettingsContext";
import { ToastProvider } from "./ToastContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ToastProvider>
        <AuthProvider>
          <LguProvider>
            <HealthDataProvider>{children}</HealthDataProvider>
          </LguProvider>
        </AuthProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}
