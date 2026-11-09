import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Role, User } from "../../types";
import { loadJSON, removeKey, saveJSON } from "./storage";

const SESSION_KEY = "alaga.session";
const avatarKey = (id: string): string => `alaga.avatar.${id}`;

/* Demo staff directory. Replace with a server-side check before real use. */
interface StaffRecord {
  staffId: string;
  name: string;
  pin: string;
  role: Exclude<Role, "resident">;
  position: string;
  mobile: string;
  email: string;
}

const STAFF: readonly StaffRecord[] = [
  { staffId: "MD-25-0001", name: "Al Garitim", pin: "2580", role: "health_worker", position: "Medical Doctor - Orthopedic", mobile: "+63 917 000 0000", email: "algaritim@gmail.com" },
  { staffId: "BO-25-0001", name: "Ramon Dela Cruz", pin: "1470", role: "official", position: "Barangay Captain", mobile: "+63 919 000 0000", email: "" },
];

export const STAFF_ID_PATTERN = /^[A-Z]{2,3}-\d{2}-\d{4}$/;
export const PIN_PATTERN = /^\d{4}$/;

const normalizeName = (n: string): string => n.trim().replace(/\s+/g, " ").toLowerCase();

/** Accepts 09XXXXXXXXX, 9XXXXXXXXX, 639XXXXXXXXX or +63 9XX XXX XXXX. Returns "+63 9XX XXX XXXX" or null. */
export function formatPhMobile(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  const national = digits.startsWith("63") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits;
  if (!/^9\d{9}$/.test(national)) return null;
  return `+63 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}

const findStaff = (identity: { staffId: string; name: string }): StaffRecord | undefined =>
  STAFF.find((s) => s.staffId === identity.staffId.trim().toUpperCase() && normalizeName(s.name) === normalizeName(identity.name));

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
  /** Step 1 of 2: checks the ID and name format only; the PIN is checked in step 2. */
  checkOfficialIdentity: (input: OfficialIdentity) => AuthResult;
  loginOfficial: (input: OfficialIdentity, pin: string) => AuthResult;
  logout: () => void;
  updateAvatar: (dataUrl: string | null) => { ok: true } | { ok: false; error: string };
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadJSON<User | null>(SESSION_KEY, null));

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
    if (!STAFF_ID_PATTERN.test(id)) return { ok: false, error: "Staff ID looks like MD-25-0001" };
    if (identity.name.trim().length < 2) return { ok: false, error: "Enter your full name" };
    return { ok: true, role: "health_worker" };
  }, []);

  const loginOfficial = useCallback<AuthValue["loginOfficial"]>(
    (identity, pin) => {
      if (!PIN_PATTERN.test(pin)) return { ok: false, error: "Enter your 4-digit PIN" };
      const staff = findStaff(identity);
      if (!staff || staff.pin !== pin) return { ok: false, error: "Staff ID, name or PIN is incorrect" };
      persist({
        id: staff.staffId,
        staffId: staff.staffId,
        name: staff.name,
        email: staff.email,
        mobile: staff.mobile,
        role: staff.role,
        position: staff.position,
        avatarUrl: loadJSON<string | null>(avatarKey(staff.staffId), null),
      });
      return { ok: true, role: staff.role };
    },
    [persist],
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
    () => ({ user, isStaff: user ? user.role !== "resident" : false, loginResident, checkOfficialIdentity, loginOfficial, logout, updateAvatar }),
    [user, loginResident, checkOfficialIdentity, loginOfficial, logout, updateAvatar],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
