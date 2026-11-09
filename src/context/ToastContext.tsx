import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Toast, ToastKind } from "../../types";

const DEFAULT_DURATION_MS = 4000;
const MAX_VISIBLE = 4;

interface ToastInput {
  kind?: ToastKind;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastValue {
  toasts: Toast[];
  push: (t: ToastInput) => string;
  dismiss: (id: string) => void;
  /** Named triggers used across modules */
  medicineDispensed: (medicine: string, qty: number) => void;
  appointmentBooked: (ticket: string) => void;
  ambulanceDispatched: (unit: string) => void;
  avatarUpdated: () => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());
  const seq = useRef(0);

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t !== undefined) window.clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback<ToastValue["push"]>(
    ({ kind = "success", title, description, durationMs = DEFAULT_DURATION_MS }) => {
      seq.current += 1;
      const id = `toast-${seq.current}`;
      setToasts((prev) => [...prev, { id, kind, title, description, durationMs }].slice(-MAX_VISIBLE));
      timers.current.set(id, window.setTimeout(() => dismiss(id), durationMs));
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => window.clearTimeout(t));
  }, []);

  const value = useMemo<ToastValue>(
    () => ({
      toasts,
      push,
      dismiss,
      medicineDispensed: (medicine, qty) => push({ title: "Medicine dispensed", description: `${qty} × ${medicine}` }),
      appointmentBooked: (ticket) => push({ title: "Appointment booked", description: `Reference ${ticket}` }),
      ambulanceDispatched: (unit) => push({ kind: "info", title: "Ambulance dispatched", description: unit }),
      avatarUpdated: () => push({ title: "Profile picture updated" }),
    }),
    [toasts, push, dismiss],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
