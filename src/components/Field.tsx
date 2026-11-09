import type { ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-slate-300">
      <span>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
