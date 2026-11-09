export type Role = "resident" | "health_worker" | "official";
export type Locale = "fil" | "en";
export type ThemeMode = "dark" | "light";

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: Role;
  /** Staff or doctor ID, e.g. MD-25-0001 (officials only) */
  staffId?: string;
  /** Registered purok or street (residents only) */
  address?: string;
  /** Health center station or jurisdiction (officials only) */
  station?: string;
  position?: string;
  avatarUrl: string | null;
}

export interface LGU {
  /** Display name, e.g. "PARAÑAQUE LGU" */
  label: string;
  city: string;
  barangay?: string;
  source: "gps" | "manual" | "fallback";
}

/* ---------- Toasts ---------- */
export type ToastKind = "success" | "info" | "warning" | "error";
export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  durationMs: number;
}

/* ---------- Medicine ---------- */
export type StockStatus = "in_stock" | "low_stock" | "near_expiry" | "out_of_stock" | "expired";
export type ExpiryBand = "d30" | "d60" | "d90" | "ok" | "expired";

export type MedicineCategory =
  | "Analgesic"
  | "Antibiotic"
  | "Antihistamine"
  | "Cardiovascular"
  | "Diabetes"
  | "Gastrointestinal"
  | "Pediatric";
export type Prescription = "otc" | "rx";

export const MEDICINE_CATEGORIES: readonly MedicineCategory[] = [
  "Analgesic", "Antibiotic", "Antihistamine", "Cardiovascular", "Diabetes", "Gastrointestinal", "Pediatric",
] as const;

export interface MedicineBatch {
  id: string;
  /** Display name with strength, e.g. "Paracetamol 250mg" */
  medicineName: string;
  genericName: string;
  brandName: string;
  category: MedicineCategory;
  prescription: Prescription;
  code: string;
  batchNo: string;
  expirationDate: string; // ISO date
  stock: number;
  minimum: number;
}

export interface DispenseRecord {
  id: string;
  batchId: string;
  medicineName: string;
  quantity: number;
  recipient: string;
  prescribingDoctor: string;
  reference: string;
  dispensedBy: string;
  timestamp: string; // ISO datetime
}

export interface DispenseInput {
  batchId: string;
  quantity: number;
  recipient: string;
  prescribingDoctor: string;
  reference: string;
}

export interface NearbyBarangay {
  id: string;
  name: string;
  address: string;
  availableCodes: string[];
  available: boolean;
}

export interface Requisition {
  id: string;
  fromBarangayId: string;
  medicineName: string;
  quantity: number;
  status: "pending" | "approved" | "fulfilled" | "declined";
  requestedAt: string;
}

/* ---------- Physicians & appointments ---------- */
export type Specialty = "General Medicine" | "Pediatrics" | "Orthopedics" | "OB-GYN" | "Cardiology";
export type ShiftType = "morning" | "afternoon" | "weekend";
export type Availability = "available" | "full" | "on_leave";
export type ConsultType = "face_to_face" | "tele";

export interface Physician {
  id: string;
  name: string;
  specialty: Specialty;
  shift: ShiftType;
  consultType: ConsultType;
  availability: Availability;
  capacity: number;
  booked: number;
  days: number[]; // 0 = Mon … 6 = Sun
  hours: string;
}

export type Priority = "routine" | "urgent" | "emergency";

export interface BookingInput {
  physicianId: string;
  patientName: string;
  contact: string;
  chiefComplaint: string;
  priority: Priority;
}

export interface Appointment extends BookingInput {
  id: string;
  ticket: string; // ALG-BK-2026-XXXX
  physicianName: string;
  bookedAt: string;
  status: "scheduled" | "in_queue" | "done" | "cancelled";
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
}

/* ---------- V1 linear ambulance dispatch (no map) ---------- */
export type UnitStatus = "standby" | "en_route" | "at_hospital" | "off_duty";
export type Triage = "red" | "yellow" | "green";
export type DispatchMilestone = "request_logged" | "unit_assigned" | "en_route" | "arrived";

export const DISPATCH_MILESTONES: readonly DispatchMilestone[] = [
  "request_logged",
  "unit_assigned",
  "en_route",
  "arrived",
] as const;

export interface AmbulanceUnit {
  id: string; // "A#01"
  name: string; // "Unit A#01"
  plate: string;
  contact: string;
  baseStation: string;
  status: UnitStatus;
  crew: string;
  incidentId: string | null;
}

export interface EmergencyRequestInput {
  zone: string;
  landmark: string;
  manualAddress?: string;
  triage: Triage;
  chiefComplaint: string;
  callerName: string;
  callerContact: string;
}

export interface EmergencyIncident extends EmergencyRequestInput {
  id: string;
  createdAt: string;
  milestone: DispatchMilestone;
  assignedUnitId: string | null;
  etaMinutes: number | null;
  closed: boolean;
}

export const ZONE_OPTIONS = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5"] as const;
export const LANDMARK_OPTIONS = ["Covered Court", "Barangay Hall", "Health Center", "Public Market", "Elementary School"] as const;

/* ---------- Physician roster filters ---------- */
export interface PhysicianFilters {
  specialty: Specialty | "all";
  shift: ShiftType | "all";
  availability: Availability | "all";
  consultType: ConsultType | "all";
}

export const SPECIALTIES: readonly Specialty[] = ["General Medicine", "Pediatrics", "Orthopedics", "OB-GYN", "Cardiology"] as const;

/* ---------- Health official registration ---------- */
export type ProfessionalTitle = "" | "Dr." | "MD" | "RN" | "BHW";

export type ClinicalRole =
  | "md_general"
  | "md_orthopedics"
  | "bhw_triage"
  | "head_nurse"
  | "ambulance_dispatcher";

export const CLINICAL_ROLES: readonly ClinicalRole[] = [
  "md_general",
  "md_orthopedics",
  "bhw_triage",
  "head_nurse",
  "ambulance_dispatcher",
] as const;

export const CLINICAL_ROLE_LABEL: Record<ClinicalRole, string> = {
  md_general: "Medical Doctor - General Medicine",
  md_orthopedics: "Medical Doctor - Orthopedics",
  bhw_triage: "Barangay Health Worker / Triage Officer",
  head_nurse: "Head Nurse",
  ambulance_dispatcher: "Ambulance Fleet Dispatcher",
};

export interface OfficialRegistrationForm {
  fullName: string;
  title: ProfessionalTitle;
  staffId: string;
  clinicalRole: ClinicalRole | "";
  station: string;
  mobile: string;
  pin: string;
  confirmPin: string;
  accessCode: string;
}

export type OfficialFormField = keyof OfficialRegistrationForm;

/** Error codes keep validation independent of language; views map them to copy. */
export type OfficialErrorCode =
  | "required"
  | "name_short"
  | "id_format"
  | "mobile_format"
  | "pin_format"
  | "pin_weak"
  | "pin_mismatch"
  | "code_format"
  | "bad_code"
  | "duplicate_id"
  | "unavailable";

export type OfficialFieldErrors = Partial<Record<OfficialFormField, OfficialErrorCode>>;

export type RegisterOfficialResult =
  | { ok: true; role: Role }
  | { ok: false; code: OfficialErrorCode; field?: OfficialFormField };

export const EMPTY_OFFICIAL_FORM: OfficialRegistrationForm = {
  fullName: "",
  title: "",
  staffId: "",
  clinicalRole: "",
  station: "",
  mobile: "",
  pin: "",
  confirmPin: "",
  accessCode: "",
};
