import { ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Field } from "../components/Field";
import { BTN_ACTIVE, FIELD, FOCUS, HAIRLINE } from "../components/ui";

type Mode = "login" | "signup";

export function LoginView() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && (!name.trim() || !mobile.trim())) {
      setError("Enter your name and mobile number");
      return;
    }
    const res = mode === "login" ? login(email, password) : signup({ name, email, mobile, password });
    if (!res.ok) setError(res.error);
  };

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => {
        setMode(m);
        setError(null);
      }}
      className={`min-h-[44px] flex-1 border-b-2 text-sm transition-colors duration-150 ease-alaga ${FOCUS} ${
        mode === m ? "border-blue-500 font-medium text-white" : "border-transparent text-slate-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-navy-950 p-4 pt-safe">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-sky-400" strokeWidth={1.5} aria-hidden="true" />
          <h1 className="text-[28px] font-medium leading-none text-slate-100">ALAGA</h1>
        </div>

        <div role="tablist" aria-label="Account" className={`mb-6 flex border-b ${HAIRLINE}`}>
          {tab("login", "Log in")}
          {tab("signup", "Sign up")}
        </div>

        <form onSubmit={submit} noValidate className="space-y-4">
          {error && (
            <p role="alert" className="rounded-control bg-rose-950/60 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}
          {mode === "signup" && (
            <>
              <Field label="Full name">
                <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </Field>
              <Field label="Mobile number">
                <input className={FIELD} type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} autoComplete="tel" />
              </Field>
            </>
          )}
          <Field label="Email">
            <input className={FIELD} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Password">
            <input
              className={FIELD}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </Field>
          <button type="submit" className={`${BTN_ACTIVE} w-full`}>
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
