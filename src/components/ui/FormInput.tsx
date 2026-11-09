import { type InputHTMLAttributes, type ReactNode } from "react";

/** Field control shared by FormInput and SelectDropdown. 3:1 border contrast, 44px minimum height. */
export const CONTROL_CLASS =
  "min-h-[44px] w-full rounded-lg border border-slate-500 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 outline-none transition-all duration-150 ease-alaga hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60";
export const CONTROL_ERROR_CLASS = "!border-rose-400 focus:!border-rose-400 focus:!ring-rose-400";

interface FieldShellProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FieldShell({ id, label, required, error, hint, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-200">
        {label}
        {required && (
          <>
            {" "}
            <span className="text-rose-400" aria-hidden="true">*</span>
          </>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-rose-300">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-sm text-slate-400">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export const describedBy = (id: string, error?: string, hint?: string): string | undefined =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id"> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** Monospaced tabular figures for IDs, codes and timestamps */
  mono?: boolean;
}

export function FormInput({ id, label, error, hint, mono, required, ...rest }: FormInputProps) {
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <input
        id={id}
        required={required}
        aria-required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${CONTROL_CLASS} ${mono ? "font-mono tabular-nums" : ""} ${error ? CONTROL_ERROR_CLASS : ""}`}
        {...rest}
      />
    </FieldShell>
  );
}
