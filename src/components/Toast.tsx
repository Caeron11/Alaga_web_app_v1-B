import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from "lucide-react";
import { useToast } from "../context/ToastContext";
import type { ToastKind } from "../../types";
import { FOCUS, HAIRLINE } from "./ui";

const ICON: Record<ToastKind, LucideIcon> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const TONE: Record<ToastKind, { icon: string; bar: string }> = {
  success: { icon: "text-ok", bar: "bg-ok" },
  info: { icon: "text-sky-400", bar: "bg-sky-400" },
  warning: { icon: "text-amber-300", bar: "bg-amber-300" },
  error: { icon: "text-rose-300", bar: "bg-rose-400" },
};

/** Top-center on mobile, top-right from lg. Mount once inside AppShell. */
export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed left-1/2 top-16 z-[70] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 lg:left-auto lg:right-6 lg:translate-x-0"
    >
      {toasts.map((t) => {
        const Icon = ICON[t.kind];
        const tone = TONE[t.kind];
        return (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`pointer-events-auto relative overflow-hidden rounded-card border ${HAIRLINE} bg-slate-900 shadow-lg animate-toast-in`}
          >
            <div className="flex items-start gap-3 py-3 pl-4 pr-1">
              <Icon className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${tone.icon}`} strokeWidth={1.5} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-100">{t.title}</p>
                {t.description && <p className="text-sm text-slate-300">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label={`Dismiss: ${t.title}`}
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-300 transition-colors duration-150 ease-alaga hover:bg-slate-800 hover:text-white ${FOCUS}`}
              >
                <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            <div
              aria-hidden="true"
              style={{ animationDuration: `${t.durationMs}ms` }}
              className={`h-0.5 origin-left animate-toast-progress ${tone.bar}`}
            />
          </div>
        );
      })}
    </div>
  );
}
