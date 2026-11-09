import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  DISPATCH_MILESTONES,
  type Announcement,
  type AmbulanceUnit,
  type Appointment,
  type BookingInput,
  type DispenseInput,
  type DispenseRecord,
  type EmergencyIncident,
  type EmergencyRequestInput,
  type ExpiryBand,
  type MedicineBatch,
  type NearbyBarangay,
  type Physician,
  type Requisition,
  type StockStatus,
  type UnitStatus,
} from "../../types";

/* ---------- Derived status helpers ---------- */
const DAY_MS = 86_400_000;

export const daysUntil = (iso: string, now: Date = new Date()): number =>
  Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY_MS);

export const expiryBand = (iso: string, now: Date = new Date()): ExpiryBand => {
  const d = daysUntil(iso, now);
  if (d < 0) return "expired";
  if (d <= 30) return "d30";
  if (d <= 60) return "d60";
  if (d <= 90) return "d90";
  return "ok";
};

export const stockStatus = (b: MedicineBatch, now: Date = new Date()): StockStatus => {
  if (daysUntil(b.expirationDate, now) < 0) return "expired";
  if (b.stock <= 0) return "out_of_stock";
  if (expiryBand(b.expirationDate, now) === "d30") return "near_expiry";
  if (b.stock < b.minimum) return "low_stock";
  return "in_stock";
};

/* ---------- Seed data ---------- */
const iso = (offsetDays: number): string => new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10);

const SEED_BATCHES: MedicineBatch[] = [
  { id: "b-001", medicineName: "Paracetamol 250mg", genericName: "Paracetamol", brandName: "Biogesic", category: "Analgesic", prescription: "otc", code: "PEC-250", batchNo: "PC25-0412", expirationDate: iso(210), stock: 18, minimum: 40 },
  { id: "b-002", medicineName: "Amoxicillin 500mg", genericName: "Amoxicillin", brandName: "Amoxil", category: "Antibiotic", prescription: "rx", code: "AMX-500", batchNo: "AM50-0388", expirationDate: iso(150), stock: 22, minimum: 50 },
  { id: "b-003", medicineName: "Erceflora 5mL", genericName: "Bacillus clausii", brandName: "Erceflora", category: "Gastrointestinal", prescription: "otc", code: "ERF-5", batchNo: "ER05-0207", expirationDate: iso(21), stock: 36, minimum: 20 },
  { id: "b-004", medicineName: "Cetirizine 10mg", genericName: "Cetirizine", brandName: "Allerkid", category: "Antihistamine", prescription: "otc", code: "CTZ-5", batchNo: "CT10-0551", expirationDate: iso(300), stock: 0, minimum: 30 },
  { id: "b-005", medicineName: "Losartan 50mg", genericName: "Losartan", brandName: "Cozaar", category: "Cardiovascular", prescription: "rx", code: "LOS-50", batchNo: "LS50-0119", expirationDate: iso(75), stock: 120, minimum: 60 },
  { id: "b-006", medicineName: "Metformin 500mg", genericName: "Metformin", brandName: "Glucophage", category: "Diabetes", prescription: "rx", code: "MET-500", batchNo: "MF50-0630", expirationDate: iso(400), stock: 240, minimum: 100 },
];

const SEED_PHYSICIANS: Physician[] = [
  { id: "p-001", name: "Dr. Juan D. Matinag, MD", specialty: "General Medicine", shift: "morning", consultType: "face_to_face", availability: "available", capacity: 20, booked: 9, days: [0, 1, 2, 3, 4], hours: "8:00 AM – 12:00 PM" },
  { id: "p-002", name: "Dr. Charlisse Kierk, MD", specialty: "Pediatrics", shift: "afternoon", consultType: "face_to_face", availability: "available", capacity: 16, booked: 11, days: [0, 2, 4], hours: "1:00 PM – 5:00 PM" },
  { id: "p-003", name: "Dr. Al Garitim, MD", specialty: "Orthopedics", shift: "morning", consultType: "tele", availability: "full", capacity: 12, booked: 12, days: [1, 3], hours: "9:00 AM – 12:00 PM" },
  { id: "p-004", name: "Dr. Ana Reyes, MD", specialty: "OB-GYN", shift: "weekend", consultType: "face_to_face", availability: "on_leave", capacity: 10, booked: 0, days: [5, 6], hours: "8:00 AM – 12:00 PM" },
];

const SEED_UNITS: AmbulanceUnit[] = [
  { id: "A#01", name: "Unit A#01", plate: "NBC 4412", contact: "0917 100 0001", baseStation: "Barangay Hall", status: "standby", crew: "R. Mendoza (EMT)", incidentId: null },
  { id: "A#02", name: "Unit A#02", plate: "NCR 8830", contact: "0917 100 0002", baseStation: "Health Center", status: "standby", crew: "J. Bautista (Driver)", incidentId: null },
  { id: "A#03", name: "Unit A#03", plate: "ABQ 2051", contact: "0917 100 0003", baseStation: "Health Center", status: "off_duty", crew: "Unassigned", incidentId: null },
];

const SEED_BARANGAYS: NearbyBarangay[] = [
  { id: "n-001", name: "Barangay Batumbakal", address: "Barangay 102, Purok 5, Subdivision 2", availableCodes: ["CTZ-5"], available: true },
  { id: "n-002", name: "Barangay T. Amad", address: "Barangay 101, Purok 2, Subdivision 3", availableCodes: [], available: false },
];

const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a-001",
    title: "Libreng bakuna para sa sanggol, bata, at senior citizens",
    body: "Mula 8:00 AM hanggang 3:00 PM sa Barangay 101 Covered Court at Health Center. Limitado ang slots para sa walk-in, kaya magpatala nang maaga.",
    date: iso(5),
  },
  {
    id: "a-002",
    title: "Libreng maintenance medicine para sa hypertension at diabetes",
    body: "Magdala ng valid ID at huling reseta sa Health Center tuwing Martes at Huwebes ng umaga.",
    date: iso(9),
  },
];

/* ---------- Public API ---------- */
export type ActionResult<T = undefined> = ({ ok: true } & (T extends undefined ? object : { data: T })) | { ok: false; error: string };

interface HealthDataValue {
  batches: MedicineBatch[];
  dispenseRecords: DispenseRecord[];
  nearbyBarangays: NearbyBarangay[];
  requisitions: Requisition[];
  physicians: Physician[];
  appointments: Appointment[];
  todayQueue: Appointment[];
  announcements: Announcement[];
  units: AmbulanceUnit[];
  incidents: EmergencyIncident[];
  activeUnitCount: number;

  dispenseMedicine: (input: DispenseInput, dispensedBy: string) => ActionResult<DispenseRecord>;
  addStock: (batch: Omit<MedicineBatch, "id">) => void;
  requestFromBarangay: (barangayId: string, medicineName: string, quantity: number) => ActionResult<Requisition>;

  bookConsultation: (input: BookingInput) => ActionResult<Appointment>;

  requestAmbulance: (input: EmergencyRequestInput) => EmergencyIncident;
  dispatchUnit: (incidentId: string, unitId: string) => ActionResult<AmbulanceUnit>;
  advanceIncident: (incidentId: string) => void;
  closeIncident: (incidentId: string) => void;
  setUnitStatus: (unitId: string, status: UnitStatus) => void;
}

const HealthDataContext = createContext<HealthDataValue | null>(null);

const rand4 = (): string => String(Math.floor(1000 + Math.random() * 9000));
const uid = (p: string): string => `${p}-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
const ETA_BY_TRIAGE = { red: 6, yellow: 12, green: 20 } as const;

export function HealthDataProvider({ children }: { children: ReactNode }) {
  const [batches, setBatches] = useState<MedicineBatch[]>(SEED_BATCHES);
  const [dispenseRecords, setDispenseRecords] = useState<DispenseRecord[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [physicians, setPhysicians] = useState<Physician[]>(SEED_PHYSICIANS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [units, setUnits] = useState<AmbulanceUnit[]>(SEED_UNITS);
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);

  const dispenseMedicine = useCallback<HealthDataValue["dispenseMedicine"]>(
    (input, dispensedBy) => {
      const batch = batches.find((b) => b.id === input.batchId);
      if (!batch) return { ok: false, error: "Select a medicine batch" };
      if (!Number.isInteger(input.quantity) || input.quantity <= 0) return { ok: false, error: "Enter a quantity of at least 1" };
      if (daysUntil(batch.expirationDate) < 0) return { ok: false, error: "This batch has expired and cannot be dispensed" };
      if (input.quantity > batch.stock) return { ok: false, error: `Only ${batch.stock} in stock for this batch` };
      if (!input.recipient.trim() || !input.prescribingDoctor.trim()) return { ok: false, error: "Recipient and prescribing doctor are required" };

      const record: DispenseRecord = {
        id: uid("d"),
        batchId: batch.id,
        medicineName: batch.medicineName,
        quantity: input.quantity,
        recipient: input.recipient.trim(),
        prescribingDoctor: input.prescribingDoctor.trim(),
        reference: input.reference.trim(),
        dispensedBy,
        timestamp: new Date().toISOString(),
      };
      setBatches((prev) => prev.map((b) => (b.id === batch.id ? { ...b, stock: b.stock - input.quantity } : b)));
      setDispenseRecords((prev) => [record, ...prev]);
      return { ok: true, data: record };
    },
    [batches],
  );

  const addStock = useCallback<HealthDataValue["addStock"]>((batch) => {
    setBatches((prev) => {
      const same = prev.find((b) => b.batchNo === batch.batchNo && b.code === batch.code);
      if (same) return prev.map((b) => (b.id === same.id ? { ...b, stock: b.stock + batch.stock } : b));
      return [...prev, { ...batch, id: uid("b") }];
    });
  }, []);

  const requestFromBarangay = useCallback<HealthDataValue["requestFromBarangay"]>((barangayId, medicineName, quantity) => {
    if (quantity <= 0) return { ok: false, error: "Enter a quantity of at least 1" };
    const req: Requisition = {
      id: uid("rq"),
      fromBarangayId: barangayId,
      medicineName,
      quantity,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };
    setRequisitions((prev) => [req, ...prev]);
    return { ok: true, data: req };
  }, []);

  const bookConsultation = useCallback<HealthDataValue["bookConsultation"]>(
    (input) => {
      const doc = physicians.find((p) => p.id === input.physicianId);
      if (!doc) return { ok: false, error: "Select a physician" };
      if (doc.availability === "on_leave") return { ok: false, error: `${doc.name} is on leave` };
      if (doc.booked >= doc.capacity) return { ok: false, error: "No slots left for this shift" };
      if (!input.patientName.trim() || !input.contact.trim() || !input.chiefComplaint.trim())
        return { ok: false, error: "Name, contact number and chief complaint are required" };

      const taken = new Set(appointments.map((a) => a.ticket));
      let ticket = `ALG-BK-2026-${rand4()}`;
      while (taken.has(ticket)) ticket = `ALG-BK-2026-${rand4()}`;

      const appt: Appointment = {
        ...input,
        patientName: input.patientName.trim(),
        id: uid("ap"),
        ticket,
        physicianName: doc.name,
        bookedAt: new Date().toISOString(),
        status: "scheduled",
      };
      setPhysicians((prev) =>
        prev.map((p) => {
          if (p.id !== doc.id) return p;
          const booked = p.booked + 1;
          return { ...p, booked, availability: booked >= p.capacity ? "full" : p.availability };
        }),
      );
      setAppointments((prev) => [appt, ...prev]);
      return { ok: true, data: appt };
    },
    [physicians, appointments],
  );

  const requestAmbulance = useCallback<HealthDataValue["requestAmbulance"]>((input) => {
    const incident: EmergencyIncident = {
      ...input,
      id: uid("inc"),
      createdAt: new Date().toISOString(),
      milestone: "request_logged",
      assignedUnitId: null,
      etaMinutes: null,
      closed: false,
    };
    setIncidents((prev) => [incident, ...prev]);
    return incident;
  }, []);

  const dispatchUnit = useCallback<HealthDataValue["dispatchUnit"]>(
    (incidentId, unitId) => {
      const unit = units.find((u) => u.id === unitId);
      const incident = incidents.find((i) => i.id === incidentId);
      if (!incident || incident.closed) return { ok: false, error: "Incident not found" };
      if (!unit) return { ok: false, error: "Select a unit" };
      if (unit.status !== "standby") return { ok: false, error: `${unit.name} is not on standby` };

      setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, status: "en_route", incidentId } : u)));
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === incidentId
            ? { ...i, assignedUnitId: unitId, milestone: "unit_assigned", etaMinutes: ETA_BY_TRIAGE[i.triage] }
            : i,
        ),
      );
      return { ok: true, data: { ...unit, status: "en_route", incidentId } };
    },
    [units, incidents],
  );

  const advanceIncident = useCallback((incidentId: string) => {
    setIncidents((prev) =>
      prev.map((i) => {
        if (i.id !== incidentId || i.closed) return i;
        const idx = DISPATCH_MILESTONES.indexOf(i.milestone);
        const next = DISPATCH_MILESTONES[Math.min(idx + 1, DISPATCH_MILESTONES.length - 1)];
        const arrived = next === "arrived";
        return { ...i, milestone: next, etaMinutes: arrived ? 0 : i.etaMinutes };
      }),
    );
  }, []);

  const closeIncident = useCallback((incidentId: string) => {
    setIncidents((prev) => prev.map((i) => (i.id === incidentId ? { ...i, closed: true } : i)));
    setUnits((prev) => prev.map((u) => (u.incidentId === incidentId ? { ...u, status: "standby", incidentId: null } : u)));
  }, []);

  const setUnitStatus = useCallback<HealthDataValue["setUnitStatus"]>((unitId, status) => {
    setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, status, incidentId: status === "standby" ? null : u.incidentId } : u)));
  }, []);

  const todayQueue = useMemo(
    () => appointments.filter((a) => a.status === "scheduled" || a.status === "in_queue"),
    [appointments],
  );
  const activeUnitCount = useMemo(() => units.filter((u) => u.status !== "off_duty").length, [units]);

  const value = useMemo<HealthDataValue>(
    () => ({
      batches,
      dispenseRecords,
      nearbyBarangays: SEED_BARANGAYS,
      requisitions,
      physicians,
      appointments,
      todayQueue,
      announcements: SEED_ANNOUNCEMENTS,
      units,
      incidents,
      activeUnitCount,
      dispenseMedicine,
      addStock,
      requestFromBarangay,
      bookConsultation,
      requestAmbulance,
      dispatchUnit,
      advanceIncident,
      closeIncident,
      setUnitStatus,
    }),
    [batches, dispenseRecords, requisitions, physicians, appointments, todayQueue, units, incidents, activeUnitCount,
     dispenseMedicine, addStock, requestFromBarangay, bookConsultation, requestAmbulance, dispatchUnit, advanceIncident, closeIncident, setUnitStatus],
  );

  return <HealthDataContext.Provider value={value}>{children}</HealthDataContext.Provider>;
}

export function useHealthData(): HealthDataValue {
  const ctx = useContext(HealthDataContext);
  if (!ctx) throw new Error("useHealthData must be used within HealthDataProvider");
  return ctx;
}
