import { ChevronDown } from "lucide-react";
import { type SelectHTMLAttributes } from "react";
import { CONTROL_CLASS, CONTROL_ERROR_CLASS, FieldShell, describedBy } from "./FormInput";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectDropdownProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "id"> {
  id: string;
  label: string;
  options: readonly SelectOption[];
  /** Shown as a disabled first option while nothing is chosen */
  placeholder?: string;
  error?: string;
  hint?: string;
}

/** Native select (best mobile and screen reader support) with a themed chevron. */
export function SelectDropdown({ id, label, options, placeholder, error, hint, required, value, ...rest }: SelectDropdownProps) {
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <div className="relative">
        <select
          id={id}
          value={value}
          required={required}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={`${CONTROL_CLASS} appearance-none pr-10 ${error ? CONTROL_ERROR_CLASS : ""}`}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  );
}
