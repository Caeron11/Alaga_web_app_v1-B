import { LocateFixed, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLgu } from "../../context/LguContext";
import {
  FONT_SCALE_DEFAULT,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  useSettings,
} from "../../context/SettingsContext";
import { useToast } from "../../context/ToastContext";
import { SUPPORTED_LGUS } from "../../hooks/useGeolocationLGU";
import type { Locale } from "../../../types";
import { BTN_ACTIVE, BTN_GHOST, FIELD, FOCUS, HAIRLINE } from "../ui";
import { AvatarUpload } from "./AvatarUpload";
import { ROLE_LABEL } from "./nav";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const FOCUSABLE = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),[href]';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`border-t ${HAIRLINE} py-6 first:border-t-0 first:pt-0`}>
      <h3 className="mb-3 text-sm font-medium text-slate-200">{title}</h3>
      {children}
    </section>
  );
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { user, updateProfile, logout } = useAuth();
  const settings = useSettings();
  const { lgu, loading, denied, detect, setManual } = useLgu();
  const toast = useToast();

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState({ name: "", email: "", mobile: "" });

  useEffect(() => {
    if (open && user) setDraft({ name: user.name, email: user.email, mobile: user.mobile });
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus();
    };
  }, [open, onClose]);

  const dirty = !!user && (draft.name !== user.name || draft.email !== user.email || draft.mobile !== user.mobile);
  const valid = draft.name.trim().length > 0 && /^\S+@\S+\.\S+$/.test(draft.email.trim());

  const saveProfile = useCallback(() => {
    if (!valid) return;
    updateProfile({ name: draft.name.trim(), email: draft.email.trim(), mobile: draft.mobile.trim() });
    toast.push({ title: "Profile saved" });
  }, [valid, updateProfile, draft, toast]);

  if (!user) return null;

  const locales: { id: Locale; label: string }[] = [
    { id: "fil", label: "Filipino" },
    { id: "en", label: "English" },
  ];
  const cityOptions = SUPPORTED_LGUS.includes(lgu.city) ? SUPPORTED_LGUS : [lgu.city, ...SUPPORTED_LGUS];
  const scale = settings.fontScale;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ease-alaga ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l ${HAIRLINE} bg-navy-900 transition-[transform,visibility] duration-300 ease-alaga sm:w-96 ${open ? "visible translate-x-0" : "invisible translate-x-full"}`}
      >
        <div className={`flex h-14 shrink-0 items-center justify-between border-b ${HAIRLINE} px-4`}>
          <h2 className="text-base font-medium text-slate-100">Settings</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close settings" className={`${BTN_GHOST} !px-0`}>
            <X className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <Section title="Profile">
            <AvatarUpload />
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-slate-300">
                Name
                <input className={`${FIELD} mt-1`} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoComplete="name" />
              </label>
              <label className="block text-sm text-slate-300">
                Email
                <input className={`${FIELD} mt-1`} type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} autoComplete="email" />
              </label>
              <label className="block text-sm text-slate-300">
                Mobile number
                <input className={`${FIELD} mt-1`} type="tel" value={draft.mobile} onChange={(e) => setDraft({ ...draft, mobile: e.target.value })} autoComplete="tel" />
              </label>
              <dl className="flex items-baseline justify-between text-sm">
                <dt className="text-slate-400">Role</dt>
                <dd className="text-slate-200">{user.position ?? ROLE_LABEL[user.role]}</dd>
              </dl>
              <button type="button" onClick={saveProfile} disabled={!dirty || !valid} className={BTN_ACTIVE}>
                Save changes
              </button>
            </div>
          </Section>

          <Section title="Language">
            <div role="radiogroup" aria-label="Language" className="grid grid-cols-2 gap-2">
              {locales.map((l) => {
                const on = settings.locale === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => settings.setLocale(l.id)}
                    className={on ? BTN_ACTIVE : BTN_GHOST}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Text size">
            <div className="flex items-center gap-2">
              <button type="button" onClick={settings.decreaseFont} disabled={!settings.canDecrease} aria-label="Decrease text size" className={BTN_GHOST}>
                <Minus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
              <input
                type="range"
                min={FONT_SCALE_MIN}
                max={FONT_SCALE_MAX}
                step={FONT_SCALE_STEP}
                value={scale}
                onChange={(e) => settings.setFontScale(Number(e.target.value))}
                aria-label="Text size percentage"
                aria-valuetext={`${scale} percent`}
                className={`h-11 min-w-0 flex-1 accent-blue-500 ${FOCUS}`}
              />
              <button type="button" onClick={settings.increaseFont} disabled={!settings.canIncrease} aria-label="Increase text size" className={BTN_GHOST}>
                <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            <p className="mt-1 text-sm tabular-nums text-slate-300" aria-live="polite">
              {scale}%
            </p>
            <button type="button" onClick={settings.resetFont} disabled={scale === FONT_SCALE_DEFAULT} className={`${BTN_GHOST} mt-3`}>
              <RotateCcw className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              Reset Font Size ({FONT_SCALE_DEFAULT}%)
            </button>
          </Section>

          <Section title="Notifications">
            <div className="flex items-center justify-between gap-4">
              <span id="sms-label" className="text-sm text-slate-300">
                SMS alerts for schedules and medicine restocks
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.smsAlerts}
                aria-labelledby="sms-label"
                onClick={() => settings.setSmsAlerts(!settings.smsAlerts)}
                className={`relative inline-flex h-11 w-14 shrink-0 items-center justify-center ${FOCUS} rounded-full`}
              >
                <span className={`block h-6 w-11 rounded-full transition-colors duration-150 ease-alaga ${settings.smsAlerts ? "bg-blue-600" : "bg-slate-600"}`} />
                <span
                  aria-hidden="true"
                  className={`absolute left-[10px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white transition-transform duration-150 ease-alaga ${settings.smsAlerts ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>
          </Section>

          <Section title="Location">
            <label className="block text-sm text-slate-300">
              Local government unit
              <select className={`${FIELD} mt-1`} value={lgu.city} onChange={(e) => setManual(e.target.value)}>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={detect} disabled={loading} className={`${BTN_GHOST} mt-3`}>
              <LocateFixed className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              {loading ? "Detecting…" : "Use my location"}
            </button>
            <p className="mt-2 text-sm text-slate-400" role="status">
              {denied
                ? "Location is off. Pick your LGU above"
                : lgu.source === "gps"
                  ? `Detected from GPS${lgu.barangay ? ` · ${lgu.barangay}` : ""}`
                  : lgu.source === "manual"
                    ? "Set manually"
                    : "Default LGU in use"}
            </p>
          </Section>
        </div>

        <div className={`shrink-0 border-t ${HAIRLINE} p-4 pb-safe`}>
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className={`${BTN_GHOST} w-full`}
          >
            Log out
          </button>
        </div>
      </div>
    </>
  );
}
