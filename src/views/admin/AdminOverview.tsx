import { useState } from "react";
import { BookDoctorModal } from "../../components/BookDoctorModal";
import { EmptyState, PageHeader, SectionHeader } from "../../components/PageHeader";
import { PriorityBadge } from "../../components/StatusBadge";
import { BTN_ACTIVE, HAIRLINE } from "../../components/ui";
import { stockStatus, useHealthData } from "../../context/HealthDataContext";
import { fmtTime } from "../../lib/format";
import { AnnouncementList } from "../shared/AnnouncementList";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 flex-1 px-4 py-3 first:pl-0">
      <dd className="text-[28px] font-medium leading-none tabular-nums text-slate-100">{value}</dd>
      <dt className="mt-1 text-sm text-slate-300">{label}</dt>
    </div>
  );
}

export function AdminOverview() {
  const { todayQueue, activeUnitCount, batches, incidents } = useHealthData();
  const [bookOpen, setBookOpen] = useState(false);

  const alerts = batches.filter((b) => {
    const s = stockStatus(b);
    return s !== "in_stock";
  }).length;
  const openCalls = incidents.filter((i) => !i.closed).length;

  return (
    <>
      <PageHeader title="Overview" actions={<button type="button" onClick={() => setBookOpen(true)} className={BTN_ACTIVE}>Book consultation</button>} />

      <dl className={`mb-10 flex flex-wrap divide-x divide-white/[0.08] border-y ${HAIRLINE}`}>
        <Stat label="Patients in queue" value={todayQueue.length} />
        <Stat label="Units on duty" value={activeUnitCount} />
        <Stat label="Medicine alerts" value={alerts} />
        <Stat label="Open emergency calls" value={openCalls} />
      </dl>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-label="Today's patient queue">
          <SectionHeader title="Today's patient queue" />
          {todayQueue.length === 0 ? (
            <EmptyState>No patients in the queue. New bookings appear here.</EmptyState>
          ) : (
            <ul>
              {todayQueue.map((a, idx) => (
                <li key={a.id} className={`border-b ${HAIRLINE} py-3 text-sm last:border-b-0`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-100"><span className="tabular-nums text-slate-400">{todayQueue.length - idx}.</span> {a.patientName}</span>
                    <PriorityBadge priority={a.priority} />
                  </div>
                  <p className="mt-0.5 text-slate-300">{a.chiefComplaint}</p>
                  <p className="text-xs tabular-nums text-slate-400">{a.physicianName} · <span className="font-mono">{a.ticket}</span> · {fmtTime(a.bookedAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <AnnouncementList />
      </div>

      <BookDoctorModal open={bookOpen} onClose={() => setBookOpen(false)} />
    </>
  );
}
