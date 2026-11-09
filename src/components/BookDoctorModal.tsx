import { CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useHealthData } from "../context/HealthDataContext";
import { useToast } from "../context/ToastContext";
import type { Appointment, Priority } from "../../types";
import { Modal } from "./Modal";
import { BTN_ACTIVE, BTN_GHOST, FIELD } from "./ui";

interface Props {
  open: boolean;
  onClose: () => void;
  initialPhysicianId?: string;
}

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "routine", label: "Routine" },
  { id: "urgent", label: "Urgent" },
  { id: "emergency", label: "Emergency" },
];

function BookForm({ onClose, initialPhysicianId }: Omit<Props, "open">) {
  const { physicians, bookConsultation } = useHealthData();
  const { user } = useAuth();
  const toast = useToast();

  const bookable = physicians.filter((p) => p.availability !== "on_leave" && p.booked < p.capacity);
  const [physicianId, setPhysicianId] = useState<string>(
    initialPhysicianId && bookable.some((p) => p.id === initialPhysicianId) ? initialPhysicianId : (bookable[0]?.id ?? ""),
  );
  const resident = user?.role === "resident";
  const [name, setName] = useState(resident ? (user?.name ?? "") : "");
  const [contact, setContact] = useState(resident ? (user?.mobile ?? "") : "");
  const [complaint, setComplaint] = useState("");
  const [priority, setPriority] = useState<Priority>("routine");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Appointment | null>(null);

  const doc = physicians.find((p) => p.id === physicianId);
  const remaining = doc ? doc.capacity - doc.booked : 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const res = bookConsultation({ physicianId, patientName: name, contact, chiefComplaint: complaint, priority });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.appointmentBooked(res.data.ticket);
    setDone(res.data);
  };

  if (done) {
    return (
      <Modal title="Appointment booked" onClose={onClose} footer={<button type="button" onClick={onClose} className={BTN_ACTIVE}>Done</button>}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" strokeWidth={1.5} aria-hidden="true" />
          <div className="text-sm text-slate-300">
            <p className="text-slate-100">{done.patientName} is booked with {done.physicianName}.</p>
            <p className="mt-2">Reference ticket</p>
            <p className="font-mono text-lg tabular-nums text-slate-100">{done.ticket}</p>
            <p className="mt-2 text-slate-400">Show this ticket at the health center.</p>
          </div>
        </div>
      </Modal>
    );
  }

  if (bookable.length === 0) {
    return (
      <Modal title="Book consultation" onClose={onClose} footer={<button type="button" onClick={onClose} className={BTN_GHOST}>Close</button>}>
        <p className="text-sm text-slate-300">No physicians have open slots right now. Check the schedule again later.</p>
      </Modal>
    );
  }

  return (
    <Modal
      title="Book consultation"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button>
          <button type="submit" form="book-form" className={BTN_ACTIVE}>Book appointment</button>
        </>
      }
    >
      <form id="book-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <p role="alert" className="rounded-control bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}

        <label className="block text-sm text-slate-300">
          Physician
          <select className={`${FIELD} mt-1`} value={physicianId} onChange={(e) => setPhysicianId(e.target.value)}>
            {physicians.map((p) => {
              const closed = p.availability === "on_leave" || p.booked >= p.capacity;
              return (
                <option key={p.id} value={p.id} disabled={closed}>
                  {p.name} · {p.specialty}
                  {p.availability === "on_leave" ? " (on leave)" : p.booked >= p.capacity ? " (full)" : ""}
                </option>
              );
            })}
          </select>
        </label>
        {doc && (
          <p className="text-sm tabular-nums text-slate-400">
            {doc.hours} · {remaining} of {doc.capacity} slots left
          </p>
        )}

        <label className="block text-sm text-slate-300">
          Patient name
          <input className={`${FIELD} mt-1`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="block text-sm text-slate-300">
          Contact number
          <input className={`${FIELD} mt-1`} type="tel" value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="tel" />
        </label>
        <label className="block text-sm text-slate-300">
          Chief complaint
          <textarea className={`${FIELD} mt-1 min-h-[96px] py-2`} value={complaint} onChange={(e) => setComplaint(e.target.value)} />
        </label>

        <fieldset>
          <legend className="mb-1 text-sm text-slate-300">Priority</legend>
          <div role="radiogroup" aria-label="Priority" className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={priority === p.id}
                onClick={() => setPriority(p.id)}
                className={priority === p.id ? BTN_ACTIVE : BTN_GHOST}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

export function BookDoctorModal({ open, onClose, initialPhysicianId }: Props) {
  return open ? <BookForm onClose={onClose} initialPhysicianId={initialPhysicianId} /> : null;
}
