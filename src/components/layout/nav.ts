import { Ambulance, CalendarDays, LayoutDashboard, Pill, type LucideIcon } from "lucide-react";
import type { Locale, Role } from "../../../types";

export type ViewId = "overview" | "ambulance" | "medicine" | "physicians";

export interface NavItem {
  id: ViewId;
  icon: LucideIcon;
  label: Record<Locale, string>;
  short: Record<Locale, string>;
}

const OVERVIEW: NavItem = {
  id: "overview",
  icon: LayoutDashboard,
  label: { en: "Overview", fil: "Pangkalahatan" },
  short: { en: "Overview", fil: "Overview" },
};

export function getNavItems(role: Role): NavItem[] {
  const staff = role !== "resident";
  return [
    OVERVIEW,
    {
      id: "ambulance",
      icon: Ambulance,
      label: staff
        ? { en: "Ambulance dispatch", fil: "Dispatch ng ambulansya" }
        : { en: "Request ambulance", fil: "Humingi ng ambulansya" },
      short: { en: "Ambulance", fil: "Ambulansya" },
    },
    {
      id: "medicine",
      icon: Pill,
      label: staff
        ? { en: "Medicine inventory", fil: "Imbentaryo ng gamot" }
        : { en: "Medicine stock", fil: "Stock ng gamot" },
      short: { en: "Medicine", fil: "Gamot" },
    },
    {
      id: "physicians",
      icon: CalendarDays,
      label: staff
        ? { en: "Physician schedule", fil: "Iskedyul ng doktor" }
        : { en: "Physician duty", fil: "Duty ng doktor" },
      short: { en: "Physicians", fil: "Doktor" },
    },
  ];
}

export const ROLE_LABEL: Record<Role, string> = {
  resident: "Resident",
  health_worker: "Health worker",
  official: "Barangay official",
};

export const CONTEXT_LABEL: Record<Role, string> = {
  resident: "Resident portal",
  health_worker: "Staff console",
  official: "Staff console",
};
