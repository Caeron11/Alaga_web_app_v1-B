import { Check } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { EmptyState, PageHeader, SectionHeader } from "../../components/PageHeader";
import { TriageBadge, UnitBadge } from "../../components/StatusBadge";
import { Field } from "../../components/Field";
import { BTN_ACTIVE, BTN_DANGER, BTN_GHOST, FIELD, HAIRLINE } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useHealthData } from "../../context/HealthDataContext";
import { useToast } from "../../context/ToastContext";
import { fmtTime } from "../../lib/format";
import {
  DISPATCH_MILESTONES,
  LANDMARK_OPTIONS,
  ZONE_OPTIONS,
  type DispatchMilestone,
  type EmergencyIncident,
  type Triage,
  type UnitStatus,
} from "../../../types";

const MILESTONE_LABEL: Record<DispatchMilestone, string> = {
  request_logged: "Request logged",
  unit_assigned: "Unit assigned",
  en_route: "En route",
  arrived: "Arrived at scene",
};
const OTHER = "Other (type street)";
const TRIAGE_ORDER: Record<Triage, number> = { red: 0, yellow: 1, green: 2 };
const UNIT_STATUSES: { id: UnitStatus; label: string }[] = [
  { id: "standby", label: "Standby" },
  { id: "en_route", label: "En route" },
  { id: "at_hospital", label: "At hospital" },
  { id: "off_duty", label: "Off duty" },
];

const where = (i: EmergencyIncident): string =>
  i.manualAddress?.trim() ? `${i.zone}, ${i.manualAddress.trim()}` : `${i.zone} · ${i.landmark}`;

/* ------------------------------------------------------------------ */
/* Citizen: request form + linear tracker                              */
/* ------------------------------------------------------------------ */
function CitizenView() {
  const { user } = useAuth();
  const { incidents, units, requestAmbulance } = useHealthData();
  const toast = useToast();

  const [zone, setZone] = useState<string>(ZONE_OPTIONS[0]);
  const [landmark, setLandmark] = useState<string>(LANDMARK_OPTIONS[0]);
  const [street, setStreet] = useState("");
  const [triage, setTriage] = useState<Triage>("red");
  const [complaint, setComplaint] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [contact, setContact] = useState(user?.mobile ?? "");
  const [error, setError] = useState<string | null>(null);
  const [trackedId, setTrackedId] = useState<string | null>(null);

  const mine =
    incidents.find((i) => i.id === trackedId) ?? incidents.find((i) => !i.closed && i.callerContact === user?.mobile);
  const unit = mine?.assignedUnitId ? units.find((u) => u.id === mine.assignedUnitId) : undefined;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const manual = landmark === OTHER;
    if (!complaint.trim() || !name.trim() || !contact.trim()) return setError("Enter your name, contact number and the emergency");
    if (manual && !street.trim()) return setError("Type the street or address");
    setError(null);
    const inc = requestAmbulance({
      zone,
      landmark: manual ? "Other" : landmark,
      manualAddress: manual ? street : undefined,
      triage,
      chiefComplaint: complaint.trim(),
      callerName: name.trim(),
      callerContact: contact.trim(),
    });
    setTrackedId(inc.id);
    setComplaint("");
    toast.push({ kind: "info", title: "Ambulance request sent", description: "Stay on this page for updates" });
  };

  const currentIdx = mine ? DISPATCH_MILESTONES.indexOf(mine.milestone) : -1;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={submit} noValidate className="space-y-4">
        <SectionHeader title="Request an ambulance" />
        {error && <p role="alert" className="rounded-control bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Purok or zone">
            <select className={FIELD} value={zone} onChange={(e) => setZone(e.target.value)}>
              {ZONE_OPTIONS.map((z) => <option key={z}>{z}</option>)}
            </select>
          </Field>
          <Field label="Landmark">
            <select className={FIELD} value={landmark} onChange={(e) => setLandmark(e.target.value)}>
              {[...LANDMARK_OPTIONS, OTHER].map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
        </div>
        {landmark === OTHER && (
          <Field label="Street or address">
            <input className={FIELD} value={street} onChange={(e) => setStreet(e.target.value)} autoComplete="street-address" />
          </Field>
        )}
        <Field label="Severity">
          <select className={FIELD} value={triage} onChange={(e) => setTriage(e.target.value as Triage)}>
            <option value="red">Red: critical</option>
            <option value="yellow">Yellow: urgent</option>
            <option value="green">Green: non-emergency</option>
          </select>
        </Field>
        <Field label="Chief complaint">
          <textarea className={`${FIELD} min-h-[96px] py-2`} value={complaint} onChange={(e) => setComplaint(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </Field>
          <Field label="Contact number">
            <input className={FIELD} type="tel" value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="tel" />
          </Field>
        </div>
        <button type="submit" className={`${BTN_DANGER} w-full sm:w-auto`}>Pindot Saklolo</button>
        <p className="text-sm text-slate-400">For a life-threatening emergency, also call 911.</p>
      </form>

      <section aria-label="Dispatch status">
        <SectionHeader title="Dispatch status" />
        {!mine ? (
          <EmptyState>No active request. Updates appear here after you send one.</EmptyState>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <TriageBadge triage={mine.triage} />
              <span>{where(mine)}</span>
            </div>
            <ol className="relative">
              {DISPATCH_MILESTONES.map((m, i) => {
                const done = i < currentIdx || (i === currentIdx && m === "arrived");
                const current = i === currentIdx && !done;
                return (
                  <li key={m} className="flex gap-3 pb-6 last:pb-0" aria-current={current ? "step" : undefined}>
                    <span className="flex flex-col items-center">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                          done ? "border-emerald-400 bg-emerald-400 text-slate-950" : current ? "border-sky-400 text-sky-300" : "border-slate-600 text-slate-500"
                        }`}
                      >
                        {done ? <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" /> : i + 1}
                      </span>
                      {i < DISPATCH_MILESTONES.length - 1 && <span className={`mt-1 w-px flex-1 ${done ? "bg-emerald-400/60" : "bg-slate-700"}`} aria-hidden="true" />}
                    </span>
                    <span className={`text-sm ${done || current ? "text-slate-100" : "text-slate-400"}`}>
                      {MILESTONE_LABEL[m]}
                      <span className="sr-only">{done ? ", done" : current ? ", current" : ", pending"}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
            <dl className={`mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t ${HAIRLINE} pt-4 text-sm`}>
              <dt className="text-slate-400">Unit</dt>
              <dd className="text-slate-100">{unit ? unit.name : "Waiting for assignment"}</dd>
              {unit && (
                <>
                  <dt className="text-slate-400">Plate</dt>
                  <dd className="tabular-nums text-slate-100">{unit.plate}</dd>
                  <dt className="text-slate-400">Contact</dt>
                  <dd className="tabular-nums text-slate-100">{unit.contact}</dd>
                </>
              )}
              <dt className="text-slate-400">ETA</dt>
              <dd className="text-slate-100">
                {mine.milestone === "arrived" ? "Arrived" : mine.etaMinutes !== null ? `About ${mine.etaMinutes} minutes` : "To be confirmed"}
              </dd>
            </dl>
          </>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Staff: fleet roster + incident queue                                */
/* ------------------------------------------------------------------ */
function StaffConsole() {
  const { units, incidents, dispatchUnit, advanceIncident, closeIncident, setUnitStatus } = useHealthData();
  const toast = useToast();
  const [pick, setPick] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const open = useMemo(
    () =>
      incidents
        .filter((i) => !i.closed)
        .sort((a, b) => TRIAGE_ORDER[a.triage] - TRIAGE_ORDER[b.triage] || a.createdAt.localeCompare(b.createdAt)),
    [incidents],
  );
  const standby = units.filter((u) => u.status === "standby");

  const dispatch = (incidentId: string) => {
    const unitId = pick[incidentId] ?? standby[0]?.id;
    if (!unitId) return setError("No unit is on standby");
    const res = dispatchUnit(incidentId, unitId);
    if (!res.ok) return setError(res.error);
    setError(null);
    toast.ambulanceDispatched(res.data.name);
  };

  return (
    <div className="space-y-10">
      <section aria-label="Incident queue">
        <SectionHeader title={`Incoming emergencies (${open.length})`} />
        {error && <p role="alert" className="mb-3 rounded-control bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}
        {open.length === 0 ? (
          <EmptyState>No open emergency requests.</EmptyState>
        ) : (
          <ul>
            {open.map((i) => {
              const unit = units.find((u) => u.id === i.assignedUnitId);
              const next = DISPATCH_MILESTONES[DISPATCH_MILESTONES.indexOf(i.milestone) + 1];
              return (
                <li key={i.id} className={`flex flex-col gap-3 border-b ${HAIRLINE} py-4 first:pt-0 lg:flex-row lg:items-center lg:justify-between`}>
                  <div className="min-w-0 space-y-1 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <TriageBadge triage={i.triage} />
                      <span className="tabular-nums text-slate-400">{fmtTime(i.createdAt)}</span>
                      <span className="text-slate-300">{MILESTONE_LABEL[i.milestone]}</span>
                    </div>
                    <p className="font-medium text-slate-100">{i.chiefComplaint}</p>
                    <p className="text-slate-300">{where(i)}</p>
                    <p className="tabular-nums text-slate-400">{i.callerName} · {i.callerContact}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!unit ? (
                      <>
                        <select
                          aria-label={`Unit for incident at ${where(i)}`}
                          className={`${FIELD} w-auto min-w-[10rem]`}
                          value={pick[i.id] ?? standby[0]?.id ?? ""}
                          onChange={(e) => setPick((p) => ({ ...p, [i.id]: e.target.value }))}
                          disabled={standby.length === 0}
                        >
                          {standby.length === 0 && <option value="">No unit on standby</option>}
                          {standby.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.baseStation}</option>)}
                        </select>
                        <button type="button" onClick={() => dispatch(i.id)} disabled={standby.length === 0} className={BTN_DANGER}>
                          Dispatch selected unit
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-slate-200">{unit.name}</span>
                        {next ? (
                          <button type="button" onClick={() => advanceIncident(i.id)} className={BTN_ACTIVE}>
                            Mark {MILESTONE_LABEL[next].toLowerCase()}
                          </button>
                        ) : (
                          <button type="button" onClick={() => closeIncident(i.id)} className={BTN_GHOST}>Close incident</button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-label="Ambulance roster">
        <SectionHeader title="Ambulance roster" />
        <div className={`overflow-x-auto rounded-card border ${HAIRLINE}`}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Ambulance fleet</caption>
            <thead className="bg-slate-900/80 text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Unit</th>
                <th scope="col" className="px-4 py-3 font-medium">Base station</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Driver or EMT</th>
                <th scope="col" className="px-4 py-3 font-medium">Incident</th>
                <th scope="col" className="px-4 py-3 font-medium">Set status</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => {
                const inc = incidents.find((i) => i.id === u.incidentId);
                return (
                  <tr key={u.id} className={`border-t ${HAIRLINE}`}>
                    <td className="px-4 py-3"><p className="font-medium text-slate-100">{u.name}</p><p className="text-xs tabular-nums text-slate-400">{u.plate}</p></td>
                    <td className="px-4 py-3 text-slate-300">{u.baseStation}</td>
                    <td className="px-4 py-3"><UnitBadge status={u.status} /></td>
                    <td className="px-4 py-3 text-slate-300">{u.crew}</td>
                    <td className="px-4 py-3 text-slate-300">{inc ? `${inc.zone} · ${inc.chiefComplaint}` : "None"}</td>
                    <td className="px-4 py-2">
                      <select
                        aria-label={`Status for ${u.name}`}
                        className={`${FIELD} w-auto`}
                        value={u.status}
                        onChange={(e) => setUnitStatus(u.id, e.target.value as UnitStatus)}
                      >
                        {UNIT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function AmbulanceDispatchLinear({ staff }: { staff: boolean }) {
  return (
    <>
      <PageHeader
        title={staff ? "Ambulance dispatch" : "Request ambulance"}
        description={staff ? "Assign standby units to incoming emergencies and track each call to arrival." : "Choose your location and describe the emergency. A unit is assigned by the barangay dispatcher."}
      />
      {staff ? <StaffConsole /> : <CitizenView />}
    </>
  );
}
