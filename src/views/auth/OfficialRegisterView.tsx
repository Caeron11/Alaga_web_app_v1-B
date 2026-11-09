import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FormInput } from "../../components/ui/FormInput";
import { SelectDropdown, type SelectOption } from "../../components/ui/SelectDropdown";
import { BTN_ACTIVE } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useLgu } from "../../context/LguContext";
import { useSettings } from "../../context/SettingsContext";
import { useToast } from "../../context/ToastContext";
import { formatOfficialName, validateOfficialRegistration } from "../../lib/credentials";
import {
  CLINICAL_ROLES,
  CLINICAL_ROLE_LABEL,
  EMPTY_OFFICIAL_FORM,
  type Locale,
  type OfficialErrorCode,
  type OfficialFormField,
  type OfficialRegistrationForm,
  type ProfessionalTitle,
} from "../../../types";

const COPY: Record<Locale, Record<string, string>> = {
  fil: {
    intro: "Para lamang sa beripikadong kawani ng barangay at munisipyo. Kailangan ng station access code mula sa inyong administrasyon.",
    title: "Titulo",
    titleNone: "Wala",
    fullName: "Buong legal na pangalan",
    fullNameHint: "Pangalan at apelyido, ayon sa opisyal na dokumento",
    staffId: "Doctor / BHW ID",
    staffIdHint: "Halimbawa: MD-25-0001 o BHW-2026-0001",
    role: "Klinikal na tungkulin",
    rolePlaceholder: "Pumili ng tungkulin",
    station: "Barangay / Health Center station",
    stationGps: "Natukoy mula sa inyong lokasyon. Maaari itong baguhin.",
    stationDefault: "Default na istasyon. Maaari itong baguhin.",
    mobile: "Contact mobile number ng opisyal",
    mobileHint: "Format: +63 9XX XXX XXXX",
    pin: "4-digit na security PIN",
    confirmPin: "Ulitin ang PIN",
    pinHint: "Gagamitin ito sa bawat pag-login. Iwasan ang 1234 o 0000.",
    accessCode: "Station access code",
    accessHint: "Ibinibigay ng administrasyon ng barangay o munisipyo.",
    submit: "Irehistro ang Opisyal",
    submitting: "Nirerehistro…",
    success: "Matagumpay na nairehistro ang account ng Opisyal",
  },
  en: {
    intro: "For verified barangay and municipal personnel only. You need a station access code from your administration.",
    title: "Title",
    titleNone: "None",
    fullName: "Full legal name",
    fullNameHint: "First and last name, as on your official documents",
    staffId: "Doctor / BHW ID",
    staffIdHint: "Example: MD-25-0001 or BHW-2026-0001",
    role: "Clinical role",
    rolePlaceholder: "Choose a role",
    station: "Barangay / Health Center station",
    stationGps: "Detected from your location. You can change it.",
    stationDefault: "Default station. You can change it.",
    mobile: "Official contact mobile number",
    mobileHint: "Format: +63 9XX XXX XXXX",
    pin: "4-digit security PIN",
    confirmPin: "Confirm PIN",
    pinHint: "You will use this at every log-in. Avoid 1234 or 0000.",
    accessCode: "Station access code",
    accessHint: "Issued by your barangay or municipal administration.",
    submit: "Register Official",
    submitting: "Registering…",
    success: "Official account registered successfully",
  },
};

const ERRORS: Record<Locale, Record<OfficialErrorCode, string>> = {
  fil: {
    required: "Kailangan ang field na ito",
    name_short: "Ilagay ang buong pangalan (pangalan at apelyido)",
    id_format: "Hindi tama ang ID. Halimbawa: MD-25-0001 o BHW-2026-0001",
    mobile_format: "Ilagay ang wastong numero: +63 9XX XXX XXXX",
    pin_format: "Dapat eksaktong 4 na numero ang PIN",
    pin_weak: "Masyadong simple ang PIN. Pumili ng ibang kombinasyon",
    pin_mismatch: "Hindi magkapareho ang dalawang PIN",
    code_format: "Letra, numero at gitling lamang, 6 hanggang 24 na karakter",
    bad_code: "Hindi balido ang access code. Hingin ito sa inyong administrasyon",
    duplicate_id: "Rehistrado na ang ID na ito. Mag-log in na lang",
    unavailable: "Hindi magagamit ang secure na pag-iimbak sa browser na ito. Buksan ang ALAGA gamit ang HTTPS",
  },
  en: {
    required: "This field is required",
    name_short: "Enter your full name (first and last name)",
    id_format: "ID format is not valid. Example: MD-25-0001 or BHW-2026-0001",
    mobile_format: "Enter a valid number: +63 9XX XXX XXXX",
    pin_format: "The PIN must be exactly 4 digits",
    pin_weak: "This PIN is too easy to guess. Choose a different one",
    pin_mismatch: "The two PINs do not match",
    code_format: "Letters, numbers and hyphens only, 6 to 24 characters",
    bad_code: "This access code is not valid. Ask your administration for it",
    duplicate_id: "This ID is already registered. Log in instead",
    unavailable: "Secure storage is not available in this browser. Open ALAGA over HTTPS",
  },
};

const FIELD_ORDER: readonly OfficialFormField[] = ["fullName", "staffId", "clinicalRole", "station", "mobile", "pin", "confirmPin", "accessCode"];
const fieldId = (f: OfficialFormField): string => `off-${f}`;
const digitsOnly = (v: string): string => v.replace(/\D/g, "").slice(0, 4);

type ServerError = { code: OfficialErrorCode; field?: OfficialFormField } | null;

export function OfficialRegisterView() {
  const { registerOfficial } = useAuth();
  const { locale } = useSettings();
  const { lgu } = useLgu();
  const toast = useToast();
  const t = COPY[locale];
  const messages = ERRORS[locale];

  const defaultStation = lgu.barangay ? `Barangay ${lgu.barangay} Health Center` : `${lgu.city} Health Center`;
  const [form, setForm] = useState<OfficialRegistrationForm>({ ...EMPTY_OFFICIAL_FORM, station: defaultStation });
  const [stationEdited, setStationEdited] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<OfficialFormField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [server, setServer] = useState<ServerError>(null);
  const [busy, setBusy] = useState(false);

  // Follow the resolved jurisdiction until the person types their own
  useEffect(() => {
    if (!stationEdited) setForm((f) => ({ ...f, station: defaultStation }));
  }, [defaultStation, stationEdited]);

  const errors = useMemo(() => validateOfficialRegistration(form), [form]);

  const set = <K extends OfficialFormField>(key: K, value: OfficialRegistrationForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "station") setStationEdited(true);
    setServer((s) => (s && (!s.field || s.field === key) ? null : s));
  };

  const touch = (key: OfficialFormField) => () => setTouched((x) => ({ ...x, [key]: true }));

  const errorFor = (key: OfficialFormField): string | undefined => {
    if (server?.field === key) return messages[server.code];
    const code = touched[key] || submitted ? errors[key] : undefined;
    return code ? messages[code] : undefined;
  };

  const titleOptions: SelectOption[] = [
    { value: "", label: t.titleNone },
    { value: "Dr.", label: "Dr." },
    { value: "MD", label: "MD" },
    { value: "RN", label: "RN" },
    { value: "BHW", label: "BHW" },
  ];
  const roleOptions: SelectOption[] = CLINICAL_ROLES.map((r) => ({ value: r, label: CLINICAL_ROLE_LABEL[r] }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const first = FIELD_ORDER.find((f) => errors[f]);
    if (first) {
      document.getElementById(fieldId(first))?.focus();
      return;
    }
    setBusy(true);
    const res = await registerOfficial(form);
    setBusy(false);
    if (!res.ok) {
      setServer({ code: res.code, field: res.field });
      if (res.field) document.getElementById(fieldId(res.field))?.focus();
      return;
    }
    toast.push({ title: t.success, description: formatOfficialName(form.fullName, form.title) });
    window.history.replaceState(null, "", "/admin");
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="text-sm text-slate-300">{t.intro}</p>

      {server && !server.field && (
        <p role="alert" className="rounded-lg bg-rose-950/60 px-3.5 py-2.5 text-sm text-rose-200">
          {messages[server.code]}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <SelectDropdown
          id="off-title"
          label={t.title}
          options={titleOptions}
          value={form.title}
          onChange={(e) => set("title", e.target.value as ProfessionalTitle)}
        />
        <FormInput
          id={fieldId("fullName")}
          label={t.fullName}
          required
          hint={t.fullNameHint}
          autoComplete="name"
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          onBlur={touch("fullName")}
          error={errorFor("fullName")}
        />
      </div>

      <FormInput
        id={fieldId("staffId")}
        label={t.staffId}
        required
        mono
        hint={t.staffIdHint}
        placeholder="MD-25-XXXX"
        autoCapitalize="characters"
        autoComplete="username"
        spellCheck={false}
        value={form.staffId}
        onChange={(e) => set("staffId", e.target.value.toUpperCase())}
        onBlur={touch("staffId")}
        error={errorFor("staffId")}
      />

      <SelectDropdown
        id={fieldId("clinicalRole")}
        label={t.role}
        required
        placeholder={t.rolePlaceholder}
        options={roleOptions}
        value={form.clinicalRole}
        onChange={(e) => set("clinicalRole", e.target.value as OfficialRegistrationForm["clinicalRole"])}
        onBlur={touch("clinicalRole")}
        error={errorFor("clinicalRole")}
      />

      <FormInput
        id={fieldId("station")}
        label={t.station}
        required
        hint={stationEdited ? undefined : lgu.source === "gps" ? t.stationGps : t.stationDefault}
        value={form.station}
        onChange={(e) => set("station", e.target.value)}
        onBlur={touch("station")}
        error={errorFor("station")}
      />

      <FormInput
        id={fieldId("mobile")}
        label={t.mobile}
        required
        mono
        hint={t.mobileHint}
        type="tel"
        inputMode="tel"
        placeholder="+63 9XX XXX XXXX"
        autoComplete="tel"
        value={form.mobile}
        onChange={(e) => set("mobile", e.target.value)}
        onBlur={touch("mobile")}
        error={errorFor("mobile")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput
          id={fieldId("pin")}
          label={t.pin}
          required
          mono
          hint={t.pinHint}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="off"
          value={form.pin}
          onChange={(e) => set("pin", digitsOnly(e.target.value))}
          onBlur={touch("pin")}
          error={errorFor("pin")}
        />
        <FormInput
          id={fieldId("confirmPin")}
          label={t.confirmPin}
          required
          mono
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="off"
          value={form.confirmPin}
          onChange={(e) => set("confirmPin", digitsOnly(e.target.value))}
          onBlur={touch("confirmPin")}
          error={errorFor("confirmPin")}
        />
      </div>

      <FormInput
        id={fieldId("accessCode")}
        label={t.accessCode}
        required
        mono
        hint={t.accessHint}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        value={form.accessCode}
        onChange={(e) => set("accessCode", e.target.value.toUpperCase())}
        onBlur={touch("accessCode")}
        error={errorFor("accessCode")}
      />

      <button type="submit" disabled={busy} className={`${BTN_ACTIVE} w-full`}>
        {busy ? t.submitting : t.submit}
      </button>
    </form>
  );
}
