import type { ReactNode } from "react";
import { HAIRLINE } from "./ui";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[28px] font-medium leading-[1.15] text-slate-100">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-sm text-slate-300">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 border-b ${HAIRLINE} pb-2`}>
      <h2 className="text-base font-medium text-slate-100">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-6 text-sm text-slate-400">{children}</p>;
}
