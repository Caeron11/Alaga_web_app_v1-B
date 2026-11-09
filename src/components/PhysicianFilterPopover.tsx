import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { SPECIALTIES, type Availability, type ConsultType, type Physician, type PhysicianFilters, type ShiftType } from "../../types";
import { BTN_ACTIVE, BTN_GHOST, FIELD, HAIRLINE } from "./ui";

export const DEFAULT_PHYSICIAN_FILTERS: PhysicianFilters = {
  specialty: "all",
  shift: "all",
  availability: "all",
  consultType: "all",
};

export const activeFilterCount = (f: PhysicianFilters): number =>
  (Object.values(f) as string[]).filter((v) => v !== "all").length;

export function applyPhysicianFilters(list: Physician[], f: PhysicianFilters, query: string): Physician[] {
  const q = query.trim().toLowerCase();
  return list.filter(
    (p) =>
      (f.specialty === "all" || p.specialty === f.specialty) &&
      (f.shift === "all" || p.shift === f.shift) &&
      (f.availability === "all" || p.availability === f.availability) &&
      (f.consultType === "all" || p.consultType === f.consultType) &&
      (q === "" || p.name.toLowerCase().includes(q) || p.specialty.toLowerCase().includes(q)),
  );
}

const SHIFTS: { id: ShiftType; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "weekend", label: "Weekend duty" },
];
const AVAIL: { id: Availability; label: string }[] = [
  { id: "available", label: "Available now" },
  { id: "full", label: "Full slots" },
  { id: "on_leave", label: "On leave" },
];
const CONSULT: { id: ConsultType; label: string }[] = [
  { id: "face_to_face", label: "Face-to-face" },
  { id: "tele", label: "Tele-consultation" },
];

function Group<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | "all";
  options: { id: T; label: string }[];
  onChange: (v: T | "all") => void;
}) {
  const all = [{ id: "all" as const, label: "All" }, ...options];
  return (
    <fieldset className="mb-4 last:mb-0">
      <legend className="mb-2 text-sm font-medium text-slate-200">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {all.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={`${value === o.id ? BTN_ACTIVE : BTN_GHOST} !px-3`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

interface PopoverProps {
  value: PhysicianFilters;
  onChange: (next: PhysicianFilters) => void;
}

export function PhysicianFilterPopover({ value, onChange }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const count = activeFilterCount(value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className={BTN_GHOST}
      >
        <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        Filters
        {count > 0 && <span className="rounded-full bg-blue-600 px-2 text-xs font-semibold tabular-nums text-white">{count}</span>}
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label="Physician filters"
          className={`absolute right-0 z-20 mt-2 max-h-[70dvh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-card border ${HAIRLINE} bg-slate-900 p-4 shadow-lg`}
        >
          <Group
            label="Specialty"
            value={value.specialty}
            options={SPECIALTIES.map((s) => ({ id: s, label: s }))}
            onChange={(specialty) => onChange({ ...value, specialty })}
          />
          <Group label="Shift" value={value.shift} options={SHIFTS} onChange={(shift) => onChange({ ...value, shift })} />
          <Group label="Availability" value={value.availability} options={AVAIL} onChange={(availability) => onChange({ ...value, availability })} />
          <Group label="Consultation type" value={value.consultType} options={CONSULT} onChange={(consultType) => onChange({ ...value, consultType })} />
          <div className={`mt-4 flex justify-between border-t ${HAIRLINE} pt-3`}>
            <button type="button" onClick={() => onChange(DEFAULT_PHYSICIAN_FILTERS)} disabled={count === 0} className={BTN_GHOST}>
              Clear filters
            </button>
            <button type="button" onClick={() => setOpen(false)} className={BTN_ACTIVE}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Search field + roster filters, wired for the physician views. */
export function PhysicianSearchBar({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  filters: PhysicianFilters;
  onFiltersChange: (f: PhysicianFilters) => void;
}) {
  const { locale } = useSettings();
  const placeholder = locale === "fil" ? "Maghanap ng Doktor o Espesyalidad..." : "Search Doctor or Specialty...";
  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder.replace(/\.+$/, "")}
          className={`${FIELD} pl-9`}
        />
      </div>
      <PhysicianFilterPopover value={filters} onChange={onFiltersChange} />
    </div>
  );
}
