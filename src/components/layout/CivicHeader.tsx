import { AlertTriangle, Bell, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useHealthData } from "../../context/HealthDataContext";
import { useLgu } from "../../context/LguContext";
import { useClockPHT } from "../../hooks/useClockPHT";
import { Avatar } from "../Avatar";
import { BADGE, FOCUS, HAIRLINE } from "../ui";
import { CONTEXT_LABEL, ROLE_LABEL } from "./nav";

interface CivicHeaderProps {
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
}

function LiveClock() {
  const time = useClockPHT();
  return (
    <time className="tabular-nums text-slate-300" aria-label={`Philippine time ${time}`}>
      {time} <span className="text-slate-400">PHT</span>
    </time>
  );
}

function LguBadge({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span className={`${BADGE} border border-slate-700/80 bg-slate-800/80 text-sky-300 ${className}`}>
      <span className="block max-w-[7.5rem] truncate sm:max-w-none">{label}</span>
    </span>
  );
}

export function CivicHeader({ onOpenSettings, onOpenNotifications }: CivicHeaderProps) {
  const { user } = useAuth();
  const { lgu } = useLgu();
  const { activeUnitCount, incidents } = useHealthData();
  if (!user) return null;

  const openCalls = incidents.filter((i) => !i.closed && i.milestone !== "arrived").length;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 h-14 border-b ${HAIRLINE} bg-navy-950 pt-safe`}
    >
      <div className="mx-auto grid h-14 max-w-[1920px] grid-cols-[1fr_auto] items-center gap-2 px-4 lg:grid-cols-[1fr_auto_1fr] lg:px-6">
        {/* Zone 1: identity */}
        <div className="flex min-w-0 items-center gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-sky-400" strokeWidth={1.5} aria-hidden="true" />
          <span className="text-base font-semibold leading-none text-slate-100">ALAGA</span>
          <LguBadge label={lgu.label} className="hidden lg:inline-flex" />
          <span className="hidden truncate text-sm text-slate-400 lg:inline">/ {CONTEXT_LABEL[user.role]}</span>
        </div>

        {/* Zone 2: live telemetry (desktop) */}
        <div className="hidden items-center gap-4 text-sm lg:flex" role="status" aria-live="polite">
          <span className="inline-flex items-center gap-2 text-slate-200">
            <span className="h-2 w-2 rounded-full bg-ok motion-safe:animate-live-pulse" aria-hidden="true" />
            Live CAD feed · {activeUnitCount} {activeUnitCount === 1 ? "unit" : "units"} on duty
          </span>
          <LiveClock />
          {openCalls > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium text-rose-300">
              <AlertTriangle className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              {openCalls} active {openCalls === 1 ? "call" : "calls"}
            </span>
          )}
        </div>

        {/* Zone 3: actions */}
        <div className="flex items-center justify-end gap-2">
          <LguBadge label={lgu.label} className="lg:hidden" />
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label={openCalls > 0 ? `Notifications, ${openCalls} unread` : "Notifications"}
            className={`relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-300 transition-colors duration-150 ease-alaga hover:bg-slate-800 hover:text-white ${FOCUS}`}
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
            {openCalls > 0 && (
              <span className="absolute right-1.5 top-1.5 inline-flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-emergency px-1 text-[11px] font-semibold leading-none text-white tabular-nums">
                {openCalls > 9 ? "9+" : openCalls}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={`Open settings, signed in as ${user.name}, ${ROLE_LABEL[user.role]}`}
            aria-haspopup="dialog"
            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full pr-0 transition-colors duration-150 ease-alaga hover:bg-slate-800 sm:pr-3 ${FOCUS}`}
          >
            <Avatar name={user.name} src={user.avatarUrl} size={32} />
            <span className="hidden whitespace-nowrap text-sm text-slate-300 sm:inline">{ROLE_LABEL[user.role]}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
