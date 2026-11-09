import { LocateFixed, LogOut, Minus, Moon, Plus, RotateCcw, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { AvatarUpload } from "../../components/layout/AvatarUpload";
import { ROLE_LABEL } from "../../components/layout/nav";
import { BTN_GHOST, FIELD, FOCUS, HAIRLINE } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useLgu } from "../../context/LguContext";
import {
  FONT_SCALE_DEFAULT,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  useSettings,
} from "../../context/SettingsContext";
import { SUPPORTED_LGUS } from "../../hooks/useGeolocationLGU";
import type { Locale, ThemeMode } from "../../../types";

const COPY: Record<Locale, Record<string, string>> = {
  fil: {
    profile: "Impormasyon ng profile",
    role: "Tungkulin",
    id: "ID",
    name: "Pangalan",
    contact: "Contact number",
    address: "Purok o address",
    station: "Istasyon",
    appearance: "Itsura at tema",
    light: "Light Mode",
    dark: "Dark Mode",
    typography: "Laki ng text at accessibility",
    resetFont: "Reset Font Size",
    language: "Wika",
    notifications: "Mga abiso sa SMS",
    smsDoctor: "Pagkakaroon ng doktor at bakanteng slot",
    smsMedicine: "Pag-restock ng gamot",
    location: "Lokasyon",
    lgu: "Local government unit",
    detect: "Gamitin ang aking lokasyon",
    detecting: "Hinahanap…",
    session: "Session",
    logout: "Log Out of Account",
  },
  en: {
    profile: "Profile information",
    role: "Role",
    id: "ID",
    name: "Name",
    contact: "Contact number",
    address: "Purok or street address",
    station: "Station",
    appearance: "Appearance and theme",
    light: "Light Mode",
    dark: "Dark Mode",
    typography: "Typography and accessibility",
    resetFont: "Reset Font Size",
    language: "Language",
    notifications: "SMS notifications",
    smsDoctor: "Doctor availability and open slots",
    smsMedicine: "Medicine replenishment",
    location: "Location",
    lgu: "Local government unit",
    detect: "Use my location",
    detecting: "Detecting…",
    session: "Session",
    logout: "Log Out of Account",
  },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`border-t ${HAIRLINE} py-6 first:border-t-0 first:pt-0`}>
      <h2 className="mb-3 text-sm font-medium text-slate-200">{title}</h2>
      {children}
    </section>
  );
}

function Switch({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span id={id} className="text-sm text-slate-300">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-full ${FOCUS}`}
      >
        <span className={`block h-6 w-11 rounded-full transition-colors duration-150 ease-alaga ${checked ? "bg-blue-600" : "bg-slate-600"}`} />
        <span
          aria-hidden="true"
          className={`absolute left-[10px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-150 ease-alaga ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

const choice = (on: boolean): string =>
  `inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-control border px-3 text-sm transition-colors duration-150 ease-alaga ${FOCUS} ${
    on
      ? "border-blue-500 bg-slate-900 font-semibold text-slate-100 shadow-sm ring-1 ring-blue-500"
      : "border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-900 hover:text-slate-50"
  }`;

export function SettingsView() {
  const { user, logout } = useAuth();
  const s = useSettings();
  const { lgu, loading, denied, detect, setManual } = useLgu();
  if (!user) return null;

  const t = COPY[s.locale];
  const cityOptions = SUPPORTED_LGUS.includes(lgu.city) ? SUPPORTED_LGUS : [lgu.city, ...SUPPORTED_LGUS];
  const themes: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: "light", label: t.light, icon: Sun },
    { id: "dark", label: t.dark, icon: Moon },
  ];
  const locales: { id: Locale; label: string }[] = [
    { id: "fil", label: "Filipino (FIL)" },
    { id: "en", label: "English (ENG)" },
  ];

  const row = (label: string, value: string) => (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <dt className="text-slate-400">{label}</dt>
      <dd className="min-w-0 text-right text-slate-100">{value}</dd>
    </div>
  );

  return (
    <div>
      <Section title={t.profile}>
        <AvatarUpload />
        <dl className="mt-4">
          {row(t.role, user.position ? `${ROLE_LABEL[user.role]} · ${user.position}` : ROLE_LABEL[user.role])}
          {user.staffId && row(t.id, user.staffId)}
          {row(t.name, user.name)}
          {row(t.contact, user.mobile)}
          {user.address && row(t.address, user.address)}
          {user.station && row(t.station, user.station)}
        </dl>
      </Section>

      <Section title={t.appearance}>
        <div role="radiogroup" aria-label={t.appearance} className="flex gap-2">
          {themes.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="radio" aria-checked={s.theme === id} onClick={() => s.setTheme(id)} className={choice(s.theme === id)}>
              <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t.typography}>
        <div className="flex items-center gap-2">
          <button type="button" onClick={s.decreaseFont} disabled={!s.canDecrease} aria-label="Decrease text size" className={BTN_GHOST}>
            <Minus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <input
            type="range"
            min={FONT_SCALE_MIN}
            max={FONT_SCALE_MAX}
            step={FONT_SCALE_STEP}
            value={s.fontScale}
            onChange={(e) => s.setFontScale(Number(e.target.value))}
            aria-label="Text size percentage"
            aria-valuetext={`${s.fontScale} percent`}
            className={`h-11 min-w-0 flex-1 accent-blue-600 ${FOCUS}`}
          />
          <button type="button" onClick={s.increaseFont} disabled={!s.canIncrease} aria-label="Increase text size" className={BTN_GHOST}>
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1 text-sm tabular-nums text-slate-300" aria-live="polite">
          {s.fontScale}%
        </p>
        <button type="button" onClick={s.resetFont} disabled={s.fontScale === FONT_SCALE_DEFAULT} className={`${BTN_GHOST} mt-3`}>
          <RotateCcw className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          {t.resetFont} ({FONT_SCALE_DEFAULT}%)
        </button>
      </Section>

      <Section title={t.language}>
        <div role="radiogroup" aria-label={t.language} className="flex gap-2">
          {locales.map((l) => (
            <button key={l.id} type="button" role="radio" aria-checked={s.locale === l.id} onClick={() => s.setLocale(l.id)} className={choice(s.locale === l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t.notifications}>
        <div className="space-y-2">
          <Switch id="sms-doctor" label={t.smsDoctor} checked={s.smsDoctorAvailability} onChange={s.setSmsDoctorAvailability} />
          <Switch id="sms-medicine" label={t.smsMedicine} checked={s.smsMedicineRestock} onChange={s.setSmsMedicineRestock} />
        </div>
      </Section>

      <Section title={t.location}>
        <label className="block text-sm text-slate-300">
          {t.lgu}
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
          {loading ? t.detecting : t.detect}
        </button>
        <p className="mt-2 text-sm text-slate-400" role="status">
          {denied ? "Location is off. Pick your LGU above" : lgu.source === "gps" ? `Detected from GPS${lgu.barangay ? ` · ${lgu.barangay}` : ""}` : lgu.source === "manual" ? "Set manually" : "Default LGU in use"}
        </p>
      </Section>

      <Section title={t.session}>
        <button
          type="button"
          onClick={logout}
          className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-control border border-red-400/50 bg-red-400/10 px-4 text-sm font-semibold text-red-300 transition-colors duration-150 ease-alaga hover:bg-red-400/20 ${FOCUS}`}
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          {t.logout}
        </button>
      </Section>
    </div>
  );
}
