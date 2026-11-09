import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Role, User } from "../../types";
import { loadJSON, removeKey, saveJSON } from "./storage";

const SESSION_KEY = "alaga.session";

type Account = User & { password: string };

const ACCOUNTS: readonly Account[] = [
  {
    id: "u-md-001",
    name: "Al Garitim",
    email: "algaritim@gmail.com",
    mobile: "+63 917 000 0000",
    role: "health_worker",
    position: "Medical Doctor - Orthopedic",
    avatarUrl: null,
    password: "alaga-demo",
  },
  {
    id: "u-res-001",
    name: "Maria Santos",
    email: "maria.santos@example.com",
    mobile: "+63 918 000 0000",
    role: "resident",
    avatarUrl: null,
    password: "alaga-demo",
  },
  {
    id: "u-off-001",
    name: "Kap. Ramon Dela Cruz",
    email: "kapitan@example.com",
    mobile: "+63 919 000 0000",
    role: "official",
    position: "Barangay Captain",
    avatarUrl: null,
    password: "alaga-demo",
  },
];

const strip = ({ password: _p, ...user }: Account): User => user;

export interface SignupInput {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

export type AuthResult = { ok: true } | { ok: false; error: string };

interface AuthValue {
  user: User | null;
  isStaff: boolean;
  login: (email: string, password: string) => AuthResult;
  signup: (input: SignupInput) => AuthResult;
  logout: () => void;
  updateAvatar: (dataUrl: string | null) => AuthResult;
  updateProfile: (patch: Partial<Pick<User, "name" | "email" | "mobile">>) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

const isStaffRole = (role: Role): boolean => role !== "resident";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadJSON<User | null>(SESSION_KEY, null));
  const [extra, setExtra] = useState<Account[]>([]);

  const persist = useCallback((next: User | null) => {
    setUser(next);
    if (next) saveJSON(SESSION_KEY, next);
    else removeKey(SESSION_KEY);
  }, []);

  const login = useCallback<AuthValue["login"]>(
    (email, password) => {
      const key = email.trim().toLowerCase();
      const found = [...ACCOUNTS, ...extra].find((a) => a.email.toLowerCase() === key);
      if (!found || found.password !== password) return { ok: false, error: "Email or password is incorrect" };
      const stored = loadJSON<User | null>(`alaga.profile.${found.id}`, null);
      persist({ ...strip(found), ...(stored ?? {}) });
      return { ok: true };
    },
    [extra, persist],
  );

  const signup = useCallback<AuthValue["signup"]>(
    (input) => {
      const email = input.email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email address" };
      if (input.password.length < 8) return { ok: false, error: "Password needs at least 8 characters" };
      if ([...ACCOUNTS, ...extra].some((a) => a.email.toLowerCase() === email))
        return { ok: false, error: "An account with this email already exists" };
      const account: Account = {
        id: `u-res-${Date.now().toString(36)}`,
        name: input.name.trim(),
        email,
        mobile: input.mobile.trim(),
        role: "resident",
        avatarUrl: null,
        password: input.password,
      };
      setExtra((prev) => [...prev, account]);
      persist(strip(account));
      return { ok: true };
    },
    [extra, persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const updateAvatar = useCallback<AuthValue["updateAvatar"]>(
    (dataUrl) => {
      if (!user) return { ok: false, error: "Not signed in" };
      const next = { ...user, avatarUrl: dataUrl };
      if (!saveJSON(`alaga.profile.${user.id}`, next)) {
        return { ok: false, error: "Could not save the photo. Try a smaller image" };
      }
      persist(next);
      return { ok: true };
    },
    [user, persist],
  );

  const updateProfile = useCallback<AuthValue["updateProfile"]>(
    (patch) => {
      if (!user) return;
      const next = { ...user, ...patch };
      saveJSON(`alaga.profile.${user.id}`, next);
      persist(next);
    },
    [user, persist],
  );

  const value = useMemo<AuthValue>(
    () => ({ user, isStaff: user ? isStaffRole(user.role) : false, login, signup, logout, updateAvatar, updateProfile }),
    [user, login, signup, logout, updateAvatar, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
