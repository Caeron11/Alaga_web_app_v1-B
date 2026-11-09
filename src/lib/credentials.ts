import type {
  OfficialFieldErrors,
  OfficialRegistrationForm,
  ProfessionalTitle,
} from "../../types";

/** MD-25-0001, BHW-2026-0001, RN-25-0007 */
export const STAFF_ID_PATTERN = /^[A-Z]{2,4}-(\d{2}|\d{4})-\d{4}$/;
export const PIN_PATTERN = /^\d{4}$/;
export const ACCESS_CODE_PATTERN = /^[A-Z0-9-]{6,24}$/;

/** Accepts 09XXXXXXXXX, 9XXXXXXXXX, 639XXXXXXXXX or +63 9XX XXX XXXX. Returns "+63 9XX XXX XXXX" or null. */
export function formatPhMobile(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  const national = digits.startsWith("63") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits;
  if (!/^9\d{9}$/.test(national)) return null;
  return `+63 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}

export const normalizeName = (n: string): string => n.trim().replace(/\s+/g, " ").toLowerCase();

/** "Dr. Maria Reyes", "Maria Reyes, RN" or just "Maria Reyes". */
export function formatOfficialName(legalName: string, title: ProfessionalTitle): string {
  const name = legalName.trim().replace(/\s+/g, " ");
  if (title === "Dr.") return `Dr. ${name}`;
  if (title === "") return name;
  return `${name}, ${title}`;
}

/** Rejects PINs that are guessed first: 0000, 7777, 1234, 4321, 0123. */
export function isWeakPin(pin: string): boolean {
  if (/^(\d)\1{3}$/.test(pin)) return true;
  return ["0123", "1234", "2345", "3456", "4567", "5678", "6789", "3210", "4321", "5432", "6543", "7654", "8765", "9876"].includes(pin);
}

export function validateOfficialRegistration(f: OfficialRegistrationForm): OfficialFieldErrors {
  const e: OfficialFieldErrors = {};

  const name = f.fullName.trim();
  if (!name) e.fullName = "required";
  else if (name.length < 3 || !/\s/.test(name)) e.fullName = "name_short";

  const id = f.staffId.trim().toUpperCase();
  if (!id) e.staffId = "required";
  else if (!STAFF_ID_PATTERN.test(id)) e.staffId = "id_format";

  if (f.clinicalRole === "") e.clinicalRole = "required";
  if (!f.station.trim()) e.station = "required";

  if (!f.mobile.trim()) e.mobile = "required";
  else if (formatPhMobile(f.mobile) === null) e.mobile = "mobile_format";

  if (!f.pin) e.pin = "required";
  else if (!PIN_PATTERN.test(f.pin)) e.pin = "pin_format";
  else if (isWeakPin(f.pin)) e.pin = "pin_weak";

  if (!f.confirmPin) e.confirmPin = "required";
  else if (!e.pin && f.confirmPin !== f.pin) e.confirmPin = "pin_mismatch";

  const code = f.accessCode.trim().toUpperCase();
  if (!code) e.accessCode = "required";
  else if (!ACCESS_CODE_PATTERN.test(code)) e.accessCode = "code_format";

  return e;
}
