import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  CLINICAL_ROLE_LABEL,
  type OfficialRegistrationForm,
  type RegisterOfficialResult,
  type Role,
  type User,
} from "../../types";
import {
  formatOfficialName,
  formatPhMobile,
  normalizeName,
  PIN_PATTERN,
  STAFF_ID_PATTERN,
  validateOfficialRegistration,
} from "../lib/credentials";
import { loadJSON, removeKey, saveJSON } from "./storage";

const SESSION_KEY = "alaga.session";
const REGISTRY_KEY = "alaga.staff.registry";
const avatarKey = (id: string): string => `alaga.avatar.${id}`;

/* ------------------------------------------------------------------ */
/* Demo credentials. Everything below runs in the browser only.        */
/* Replace with a server-side check before any real deployment.        */
/* ------------------------------------------------------------------ */

/** Station access codes that allow provisioning administrative accounts. */
const STATION_ACCESS_CODES: readonly string[] = ["ALAGA-STN-2026"];

interface SeedStaff {
  staffId: string;
  name: string;
  pin: string;
  role: Exclude<Role, "resident">;
  position: string;
  mobile: string;
  email: string;
}

const SEED_STAFF: readonly SeedStaff[] = [
  { staffId: "MD-25-0001", name: "Al Garitim", pin: "2580", role: "health_worker", position: "Medical Doctor - Orthopedic", mobile: "+63 917 000 0000", email: "algaritim@gmail.com" },
  { staffId: "BO-25-0001", name: "Ramon Dela Cruz", pin: "1470", role: "official", position: "Barangay Captain", mobile: "+63 919 000 0000", email: "" },
];

/** Officials created through the registration form. The PIN is stored salted and hashed, never in plain text. */
interface RegisteredStaff {
  staffId: string;
  legalName: string;
  displayName: string;
  position: string;
  station: string;
  mobile: string;
  salt: string;
  pinHash: string;
}

const toHex = (buf: ArrayBuffer): string =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

const hasSubtle = (): boolean => typeof crypto !== "undefined" && !!crypto.subtle && typeof crypto.getRandomValues === "function";

async function hashPin(salt: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

const newSalt = (): string => toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);

const isRegisteredStaff = (v: unknown): v is RegisteredStaff => {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return ["staffId", "legalName", "displayName", "position", "station", "mobile", "salt", "pinHash"].every((k) => typeof r[k] === "string");
};

const readRegistry = (): RegisteredStaff[] => {
  const raw = loadJSON<unknown>(REGISTRY_KEY, []);
  return Array.isArray(raw) ? raw.filter(isRegisteredStaff) : [];
};

export interface ResidentInput {
  name: string;
  mobile: string;
  address: string;
}
export interface OfficialIdentity {
  staffId: string;
  name: string;
}

export type AuthResult = { ok: true; role: Role } | { ok: false; error: string };

interface AuthValue {
  user: User | null;
  isStaff: boolean;
  /** Mamamayan sign-in. First entry for a mobile number registers the resident. */
  loginResident: (input: ResidentInput) => AuthResult;
  /** Step 1 of 2: checks the ID and name format only. */
  checkOfficialIdentity: (input: OfficialIdentity) => AuthResult;
  /** Step 2 of 2: verifies ID, name and PIN against seeded and registered officials. */
  loginOfficial: (input: OfficialIdentity, pin: string) => Promise<AuthResult>;
  /** Creates an official account, then signs in. Requires a valid station access code. */
  registerOfficial: (form: OfficialRegistrationForm) => Promise<RegisterOfficialResult>;
  logout: () => void;
  updateAvatar: (dataUrl: string | null) => { ok: true } | { ok: false; error: string };
}

const AuthContext = createContext<AuthValue | null>(null);

const seedFor = (identity: OfficialIdentity): SeedStaff | undefined =>
  SEED_STAFF.find((s) => s.staffId === identity.staffId.trim().toUpperCase() && normalizeName(s.name) === normalizeName(identity.name));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadJSON<User | null>(SESSION_KEY, null));
  const [registry, setRegistry] = useState<RegisteredStaff[]>(readRegistry);

  const persist = useCallback((next: User | null) => {
    setUser(next);
    if (next) saveJSON(SESSION_KEY, next);
    else removeKey(SESSION_KEY);
  }, []);

  const loginResident = useCallback<AuthValue["loginResident"]>(
    ({ name, mobile, address }) => {
      const cleanName = name.trim().replace(/\s+/g, " ");
      if (cleanName.length < 2) return { ok: false, error: "Enter your full name" };
      const formatted = formatPhMobile(mobile);
      if (!formatted) return { ok: false, error: "Enter a valid Philippine mobile number, e.g. +63 9XX XXX XXXX" };
      if (!address.trim()) return { ok: false, error: "Enter your purok or street address" };
      const id = `res-${formatted.replace(/\D/g, "")}`;
      persist({
        id,
        name: cleanName,
        email: "",
        mobile: formatted,
        role: "resident",
        address: address.trim(),
        avatarUrl: loadJSON<string | null>(avatarKey(id), null),
      });
      return { ok: true, role: "resident" };
    },
    [persist],
  );

  const checkOfficialIdentity = useCallback<AuthValue["checkOfficialIdentity"]>((identity) => {
    const id = identity.staffId.trim().toUpperCase();
    if (!STAFF_ID_PATTERN.test(id)) return { ok: false, error: "Staff ID looks like MD-25-0001 or BHW-2026-0001" };
    if (identity.name.trim().length < 2) return { ok: false, error: "Enter your full name" };
    return { ok: true, role: "health_worker" };
  }, []);

  const loginOfficial = useCallback<AuthValue["loginOfficial"]>(
    async (identity, pin) => {
      if (!PIN_PATTERN.test(pin)) return { ok: false, error: "Enter your 4-digit PIN" };
      const failure = { ok: false, error: "Staff ID, name or PIN is incorrect" } as const;

      const seed = seedFor(identity);
      if (seed) {
        if (seed.pin !== pin) return failure;
        persist({
          id: seed.staffId,
          staffId: seed.staffId,
          name: seed.name,
          email: seed.email,
          mobile: seed.mobile,
          role: seed.role,
          position: seed.position,
          avatarUrl: loadJSON<string | null>(avatarKey(seed.staffId), null),
        });
        return { ok: true, role: seed.role };
      }

      const id = identity.staffId.trim().toUpperCase();
      const rec = registry.find((r) => r.staffId === id && normalizeName(r.legalName) === normalizeName(identity.name));
      if (!rec || !hasSubtle()) return failure;
      if ((await hashPin(rec.salt, pin)) !== rec.pinHash) return failure;
      persist({
        id: rec.staffId,
        staffId: rec.staffId,
        name: rec.displayName,
        email: "",
        mobile: rec.mobile,
        role: "health_worker",
        position: rec.position,
        station: rec.station,
        avatarUrl: loadJSON<string | null>(avatarKey(rec.staffId), null),
      });
      return { ok: true, role: "health_worker" };
    },
    [registry, persist],
  );

  const registerOfficial = useCallback<AuthValue["registerOfficial"]>(
    async (form) => {
      const errors = validateOfficialRegistration(form);
      const firstInvalid = (Object.keys(errors) as (keyof typeof errors)[])[0];
      if (firstInvalid) return { ok: false, code: errors[firstInvalid] ?? "required", field: firstInvalid };

      const staffId = form.staffId.trim().toUpperCase();
      const code = form.accessCode.trim().toUpperCase();
      if (!STATION_ACCESS_CODES.includes(code)) return { ok: false, code: "bad_code", field: "accessCode" };

      const taken = SEED_STAFF.some((s) => s.staffId === staffId) || registry.some((r) => r.staffId === staffId);
      if (taken) return { ok: false, code: "duplicate_id", field: "staffId" };

      if (!hasSubtle() || form.clinicalRole === "") return { ok: false, code: "unavailable" };

      const mobile = formatPhMobile(form.mobile);
      if (!mobile) return { ok: false, code: "mobile_format", field: "mobile" };

      const salt = newSalt();
      const record: RegisteredStaff = {
        staffId,
        legalName: form.fullName.trim().replace(/\s+/g, " "),
        displayName: formatOfficialName(form.fullName, form.title),
        position: CLINICAL_ROLE_LABEL[form.clinicalRole],
        station: form.station.trim(),
        mobile,
        salt,
        pinHash: await hashPin(salt, form.pin),
      };

      const next = [...registry, record];
      setRegistry(next);
      saveJSON(REGISTRY_KEY, next);

      persist({
        id: record.staffId,
        staffId: record.staffId,
        name: record.displayName,
        email: "",
        mobile: record.mobile,
        role: "health_worker",
        position: record.position,
        station: record.station,
        avatarUrl: null,
      });
      return { ok: true, role: "health_worker" };
    },
    [registry, persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const updateAvatar = useCallback<AuthValue["updateAvatar"]>(
    (dataUrl) => {
      if (!user) return { ok: false, error: "Not signed in" };
      if (dataUrl === null) removeKey(avatarKey(user.id));
      else if (!saveJSON(avatarKey(user.id), dataUrl)) return { ok: false, error: "Could not save the photo. Try a smaller image" };
      persist({ ...user, avatarUrl: dataUrl });
      return { ok: true };
    },
    [user, persist],
  );

  const value = useMemo<AuthValue>(
    () => ({ user, isStaff: user ? user.role !== "resident" : false, loginResident, checkOfficialIdentity, loginOfficial, registerOfficial, logout, updateAvatar }),
    [user, loginResident, checkOfficialIdentity, loginOfficial, registerOfficial, logout, updateAvatar],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
