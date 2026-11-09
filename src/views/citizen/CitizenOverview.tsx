import { useState } from "react";
import { BookDoctorModal } from "../../components/BookDoctorModal";
import { EmptyState, PageHeader, SectionHeader } from "../../components/PageHeader";
import { PriorityBadge } from "../../components/StatusBadge";
import { BTN_ACTIVE, BTN_GHOST, HAIRLINE } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useHealthData } from "../../context/HealthDataContext";
import { fmtDateTime } from "../../lib/format";
import { AnnouncementList } from "../shared/AnnouncementList";
import type { ViewId } from "../../components/layout/nav";

export function CitizenOverview({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { user } = useAuth();
  const { physicians, appointments } = useHealthData();
  const [bookOpen, setBookOpen] = useState(false);
  const [bookId, setBookId] = useState<string | undefined>();

  const today = (new Date().getDay() + 6) % 7;
  const onDuty = physicians.filter((p) => p.days.includes(today) && p.availability === "available" && p.booked < p.capacity);
  const mine = appointments.filter((a) => a.contact === user?.mobile || a.patientName === user?.name);

  return (
    <>
      <PageHeader
        title="Overview"
        description="Barangay health updates, doctors on duty and your appointments."
        actions={<button type="button" onClick={() => { setBookId(undefined); setBookOpen(true); }} className={BTN_ACTIVE}>Book consultation</button>}
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <AnnouncementList />
        <div className="space-y-10">
          <section aria-label="Doctors on duty today">
            <SectionHeader title="Doctors on duty today" action={<button type="button" onClick={() => onNavigate("physicians")} className={BTN_GHOST}>Full schedule</button>} />
            {onDuty.length === 0 ? (
              <EmptyState>No doctors with open slots today.</EmptyState>
            ) : (
              <ul>
                {onDuty.map((p) => (
                  <li key={p.id} className={`flex items-center justify-between gap-3 border-b ${HAIRLINE} py-3 last:border-b-0`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">{p.name}</p>
                      <p className="text-sm text-slate-300">{p.specialty}</p>
                      <p className="text-xs tabular-nums text-slate-400">{p.hours}</p>
                    </div>
                    <button type="button" onClick={() => { setBookId(p.id); setBookOpen(true); }} className={BTN_GHOST}>Book</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="My appointments">
            <SectionHeader title="My appointments" />
            {mine.length === 0 ? (
              <EmptyState>You have no appointments yet.</EmptyState>
            ) : (
              <ul>
                {mine.map((a) => (
                  <li key={a.id} className={`space-y-1 border-b ${HAIRLINE} py-3 text-sm last:border-b-0`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-100">{a.physicianName}</span>
                      <PriorityBadge priority={a.priority} />
                    </div>
                    <p className="text-slate-300">{a.chiefComplaint}</p>
                    <p className="font-mono text-xs tabular-nums text-slate-400">{a.ticket} · {fmtDateTime(a.bookedAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      <BookDoctorModal open={bookOpen} onClose={() => setBookOpen(false)} initialPhysicianId={bookId} />
    </>
  );
}
