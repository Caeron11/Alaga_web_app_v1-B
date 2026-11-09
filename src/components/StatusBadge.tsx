import type { Availability, Priority, StockStatus, Triage, UnitStatus } from "../../types";
import { BADGE } from "./ui";

type Tone = "ok" | "amber" | "red" | "sky" | "slate" | "emergency";

const TONE: Record<Tone, string> = {
  ok: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  amber: "border-amber-300/30 bg-amber-300/10 text-amber-300",
  red: "border-red-400/30 bg-red-400/10 text-red-300",
  sky: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  slate: "border-slate-600 bg-slate-800/80 text-slate-300",
  emergency: "border-rose-400/40 bg-rose-600/20 text-rose-200",
};

function Badge({ tone, children }: { tone: Tone; children: string }) {
  return <span className={`${BADGE} border ${TONE[tone]}`}>{children}</span>;
}

const STOCK: Record<StockStatus, [Tone, string]> = {
  in_stock: ["ok", "In stock"],
  low_stock: ["amber", "Low stock"],
  near_expiry: ["amber", "Near expiry"],
  out_of_stock: ["red", "Out of stock"],
  expired: ["red", "Expired"],
};
export const StockBadge = ({ status }: { status: StockStatus }) => <Badge tone={STOCK[status][0]}>{STOCK[status][1]}</Badge>;

const UNIT: Record<UnitStatus, [Tone, string]> = {
  standby: ["ok", "Standby"],
  en_route: ["sky", "En route"],
  at_hospital: ["amber", "At hospital"],
  off_duty: ["slate", "Off duty"],
};
export const UnitBadge = ({ status }: { status: UnitStatus }) => <Badge tone={UNIT[status][0]}>{UNIT[status][1]}</Badge>;

const TRIAGE: Record<Triage, [Tone, string]> = {
  red: ["emergency", "Red: critical"],
  yellow: ["amber", "Yellow: urgent"],
  green: ["ok", "Green: non-emergency"],
};
export const TriageBadge = ({ triage }: { triage: Triage }) => <Badge tone={TRIAGE[triage][0]}>{TRIAGE[triage][1]}</Badge>;

const AVAIL: Record<Availability, [Tone, string]> = {
  available: ["ok", "Available"],
  full: ["amber", "Full slots"],
  on_leave: ["slate", "On leave"],
};
export const AvailabilityBadge = ({ status }: { status: Availability }) => <Badge tone={AVAIL[status][0]}>{AVAIL[status][1]}</Badge>;

const PRIORITY: Record<Priority, [Tone, string]> = {
  routine: ["slate", "Routine"],
  urgent: ["amber", "Urgent"],
  emergency: ["emergency", "Emergency"],
};
export const PriorityBadge = ({ priority }: { priority: Priority }) => <Badge tone={PRIORITY[priority][0]}>{PRIORITY[priority][1]}</Badge>;

export const SimpleBadge = ({ tone, children }: { tone: Tone; children: string }) => <Badge tone={tone}>{children}</Badge>;
