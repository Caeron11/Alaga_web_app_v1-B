import { ChevronLeft, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { FormInput } from "../../components/ui/FormInput";
import { BTN_ACTIVE, BTN_GHOST, CARD, FOCUS } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { useToast } from "../../context/ToastContext";
import type { Locale } from "../../../types";
import { OfficialRegisterView } from "./OfficialRegisterView";

type Kind = "citizen" | "official";

const COPY: Record<Locale, Record<string, string>> = {
  fil: {
    subtitle: "Sentralisadong Serbisyong Pangkalusugan ng Barangay",
    back: "Bumalik sa pag-login",
    name: "Buong pangalan ng residente",
    mobile: "Mobile contact number",
    mobileHint: "Format: +63 9XX XXX XXXX",
    address: "Rehistradong purok o address",
    submit: "Magrehistro bilang Residente",
    success: "Matagumpay na nairehistro ang account ng Mamamayan",
  },
  en: {
    subtitle: "Centralized Barangay Health Services",
    back: "Back to log in",
    name: "Resident full name",
    mobile: "Mobile contact number",
    mobileHint: "Format: +63 9XX XXX XXXX",
    address: "Registered purok or street address",
    submit: "Register as Resident",
    success: "Citizen account registered successfully",
  },
};

function CitizenRegisterForm() {
  const { loginResident } = useAuth();
  const { locale } = useSettings();
  const toast = useToast();
  const t = COPY[locale];
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const res = loginResident({ name, mobile, address });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.push({ title: t.success, description: name.trim() });
    window.history.replaceState(null, "", "/citizen");
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg bg-rose-950/60 px-3.5 py-2.5 text-sm text-rose-200">
          {error}
        </p>
      )}
      <FormInput id="cit-name" label={t.name} required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      <FormInput
        id="cit-mobile"
        label={t.mobile}
        required
        mono
        hint={t.mobileHint}
        type="tel"
        inputMode="tel"
        placeholder="+63 9XX XXX XXXX"
        autoComplete="tel"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />
      <FormInput id="cit-address" label={t.address} required autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} />
      <button type="submit" className={`${BTN_ACTIVE} w-full`}>
        {t.submit}
      </button>
    </form>
  );
}

export function RegisterView({ onBack }: { onBack: () => void }) {
  const { locale } = useSettings();
  const t = COPY[locale];
  const [kind, setKind] = useState<Kind>("citizen");

  const tab = (k: Kind, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={kind === k}
      onClick={() => setKind(k)}
      className={`min-h-[44px] flex-1 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ease-alaga ${FOCUS} ${
        kind === k ? "bg-blue-600 font-semibold text-white shadow-sm" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-dvh bg-navy-950 px-4 py-4 pb-28 pt-safe">
      <div className="mx-auto w-full max-w-md space-y-4">
        <button type="button" onClick={onBack} className={`${BTN_GHOST} !px-3`}>
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          {t.back}
        </button>

        <div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-sky-400" strokeWidth={1.5} aria-hidden="true" />
            <h1 className="text-[28px] font-bold leading-none text-slate-100">ALAGA</h1>
          </div>
          <p className="mt-2 text-sm text-slate-300">{t.subtitle}</p>
        </div>

        <div role="tablist" aria-label="Registration type" className="flex gap-2">
          {tab("citizen", "Rehistro ng Mamamayan (Citizen)")}
          {tab("official", "Opisyal / Kawani ng Kalusugan (Health Official)")}
        </div>

        <div className={`${CARD} p-4 sm:p-6`}>{kind === "citizen" ? <CitizenRegisterForm /> : <OfficialRegisterView />}</div>
      </div>
    </main>
  );
}
