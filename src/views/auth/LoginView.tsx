import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Field } from "../../components/Field";
import { BTN_ACTIVE, BTN_GHOST, FIELD, FOCUS } from "../../components/ui";
import { PIN_PATTERN, useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import type { Locale, Role } from "../../../types";

type Mode = "citizen" | "admin";

const COPY: Record<Locale, Record<string, string>> = {
  fil: {
    subtitle: "Sentralisadong Serbisyong Pangkalusugan ng Barangay",
    name: "Buong pangalan ng residente",
    mobile: "Mobile contact number",
    address: "Rehistradong purok o address",
    residentCta: "Pumasok sa Resident Portal",
    staffId: "Staff / Doctor ID",
    fullName: "Buong pangalan",
    step1: "Hakbang 1 ng 2: Pagkakakilanlan",
    step2: "Hakbang 2 ng 2: Security PIN",
    next: "Magpatuloy",
    back: "Bumalik",
    pin: "4-digit na security PIN",
    officialCta: "Pumasok sa Portal (Official)",
    noAccount: "Wala pang rehistradong account?",
    register: "Magrehistro rito",
    registerNote: "Punan ang form para magrehistro bilang residente. Awtomatiko kang mairerehistro sa unang pasok.",
    showPin: "Ipakita ang PIN",
    hidePin: "Itago ang PIN",
  },
  en: {
    subtitle: "Centralized Barangay Health Services",
    name: "Resident full name",
    mobile: "Mobile contact number",
    address: "Registered purok or street address",
    residentCta: "Enter Resident Portal",
    staffId: "Staff / Doctor ID",
    fullName: "Full name",
    step1: "Step 1 of 2: Identity",
    step2: "Step 2 of 2: Security PIN",
    next: "Continue",
    back: "Back",
    pin: "4-digit security PIN",
    officialCta: "Enter Portal (Official)",
    noAccount: "No registered account yet?",
    register: "Register here",
    registerNote: "Fill in the form to register as a resident. You are registered automatically on first entry.",
    showPin: "Show PIN",
    hidePin: "Hide PIN",
  },
};

const redirect = (role: Role): void => {
  window.history.replaceState(null, "", role === "resident" ? "/citizen" : "/admin");
};

export function LoginView() {
  const { loginResident, checkOfficialIdentity, loginOfficial } = useAuth();
  const { locale } = useSettings();
  const t = COPY[locale];

  const [mode, setMode] = useState<Mode>("citizen");
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");

  const [step, setStep] = useState<1 | 2>(1);
  const [staffId, setStaffId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  // Clear any stale /citizen or /admin path left over from a previous session
  useEffect(() => {
    window.history.replaceState(null, "", "/");
  }, []);

  useEffect(() => {
    if (mode === "admin" && step === 2) pinRef.current?.focus();
  }, [mode, step]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setRegistering(false);
    setStep(1);
    setPin("");
    setShowPin(false);
  };

  const submitResident = (e: FormEvent) => {
    e.preventDefault();
    const res = loginResident({ name, mobile, address });
    if (!res.ok) return setError(res.error);
    redirect(res.role);
  };

  const submitOfficial = (e: FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      const res = checkOfficialIdentity({ staffId, name: staffName });
      if (!res.ok) return setError(res.error);
      setError(null);
      setStep(2);
      return;
    }
    const res = loginOfficial({ staffId, name: staffName }, pin);
    if (!res.ok) {
      setError(res.error);
      setPin("");
      return;
    }
    redirect(res.role);
  };

  const startRegister = () => {
    switchMode("citizen");
    setRegistering(true);
    window.setTimeout(() => nameRef.current?.focus(), 0);
  };

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => switchMode(m)}
      className={`min-h-[44px] flex-1 rounded-control px-3 text-sm transition-colors duration-150 ease-alaga ${FOCUS} ${
        mode === m ? "bg-blue-600 font-semibold text-white shadow-sm" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-navy-950 p-4 pt-safe">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-sky-400" strokeWidth={1.5} aria-hidden="true" />
            <h1 className="text-[28px] font-bold leading-none text-slate-100">ALAGA</h1>
          </div>
          <p className="mt-2 text-sm text-slate-300">{t.subtitle}</p>
        </div>

        <div role="tablist" aria-label="Role" className="mb-6 flex gap-2">
          {tab("citizen", "Mamamayan (Citizen)")}
          {tab("admin", "Health Official (Admin)")}
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-control bg-rose-950/60 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}

        {mode === "citizen" ? (
          <form onSubmit={submitResident} noValidate className="space-y-4">
            {registering && (
              <p role="status" className="text-sm text-slate-300">
                {t.registerNote}
              </p>
            )}
            <Field label={t.name}>
              <input ref={nameRef} className={FIELD} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
            <Field label={t.mobile}>
              <input
                className={FIELD}
                type="tel"
                inputMode="tel"
                placeholder="+63 9XX XXX XXXX"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                autoComplete="tel"
              />
            </Field>
            <Field label={t.address}>
              <input className={FIELD} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
            </Field>
            <button type="submit" className={`${BTN_ACTIVE} w-full`}>
              {t.residentCta}
            </button>
          </form>
        ) : (
          <form onSubmit={submitOfficial} noValidate className="space-y-4">
            <p className="text-sm tabular-nums text-slate-300" aria-live="polite">
              {step === 1 ? t.step1 : t.step2}
            </p>

            {step === 1 ? (
              <>
                <Field label={t.staffId}>
                  <input
                    className={`${FIELD} font-mono uppercase`}
                    placeholder="MD-25-XXXX"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    autoComplete="username"
                    autoCapitalize="characters"
                  />
                </Field>
                <Field label={t.fullName}>
                  <input className={FIELD} value={staffName} onChange={(e) => setStaffName(e.target.value)} autoComplete="name" />
                </Field>
                <button type="submit" className={`${BTN_ACTIVE} w-full`}>
                  {t.next}
                </button>
              </>
            ) : (
              <>
                <Field label={t.pin}>
                  <div className="relative">
                    <input
                      ref={pinRef}
                      className={`${FIELD} pr-12 font-mono tracking-[0.5em] tabular-nums`}
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      autoComplete="off"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      aria-invalid={pin.length > 0 && !PIN_PATTERN.test(pin)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((s) => !s)}
                      aria-pressed={showPin}
                      aria-label={showPin ? t.hidePin : t.showPin}
                      className={`absolute right-0 top-0 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-control text-slate-300 transition-colors duration-150 ease-alaga hover:text-slate-50 ${FOCUS}`}
                    >
                      {showPin ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />}
                    </button>
                  </div>
                </Field>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setPin("");
                      setError(null);
                    }}
                    className={BTN_GHOST}
                  >
                    {t.back}
                  </button>
                  <button type="submit" disabled={!PIN_PATTERN.test(pin)} className={`${BTN_ACTIVE} flex-1`}>
                    {t.officialCta}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        <p className="mt-8 text-sm text-slate-300">
          {t.noAccount}{" "}
          <button type="button" onClick={startRegister} className={`min-h-[44px] rounded-control font-medium text-sky-300 underline underline-offset-4 ${FOCUS}`}>
            {t.register}
          </button>
        </p>
      </div>
    </main>
  );
}
