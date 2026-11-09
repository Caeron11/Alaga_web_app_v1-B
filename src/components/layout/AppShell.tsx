import { useCallback, useEffect, useState, type ReactNode } from "react";
import { loadJSON, saveJSON } from "../../context/storage";
import { CivicHeader } from "./CivicHeader";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomBar } from "./MobileBottomBar";
import { ToastViewport } from "../Toast";
import { SettingsDrawer } from "./SettingsDrawer";
import type { ViewId } from "./nav";

interface AppShellProps {
  view: ViewId;
  onNavigate: (v: ViewId) => void;
  children: ReactNode;
}

const SIDEBAR_KEY = "alaga.sidebar.collapsed";

export function AppShell({ view, onNavigate, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => loadJSON<boolean>(SIDEBAR_KEY, false));
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    saveJSON(SIDEBAR_KEY, collapsed);
  }, [collapsed]);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const toggleSidebar = useCallback(() => setCollapsed((c) => !c), []);
  const openNotifications = useCallback(() => onNavigate("ambulance"), [onNavigate]);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-navy-900 text-slate-100">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-control focus:bg-blue-600 focus:px-4 focus:py-3 focus:text-white"
      >
        Skip to content
      </a>
      <CivicHeader onOpenSettings={openSettings} onOpenNotifications={openNotifications} />
      <DesktopSidebar view={view} onNavigate={onNavigate} collapsed={collapsed} onToggle={toggleSidebar} />
      <main
        id="main"
        tabIndex={-1}
        className={`min-h-dvh pt-14 transition-[padding] duration-300 ease-alaga focus:outline-none ${collapsed ? "lg:pl-[72px]" : "lg:pl-64"}`}
      >
        <div className="mx-auto max-w-[1440px] px-4 py-4 pb-28 sm:px-6 sm:py-6 sm:pb-28 lg:px-8 lg:py-8 lg:pb-8">{children}</div>
      </main>
      <MobileBottomBar view={view} onNavigate={onNavigate} onOpenSettings={openSettings} />
      <SettingsDrawer open={settingsOpen} onClose={closeSettings} />
      <ToastViewport />
    </div>
  );
}
