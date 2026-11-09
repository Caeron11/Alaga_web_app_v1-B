import { CalendarPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { BookDoctorModal } from "../../components/BookDoctorModal";
import { EmptyState, PageHeader, SectionHeader } from "../../components/PageHeader";
import {
  applyPhysicianFilters,
  DEFAULT_PHYSICIAN_FILTERS,
  PhysicianSearchBar,
} from "../../components/PhysicianFilterPopover";
import { AvailabilityBadge } from "../../components/StatusBadge";
import { BTN_ACTIVE, BTN_GHOST, HAIRLINE } from "../../components/ui";
import { useHealthData } from "../../context/HealthDataContext";
import type { Physician, PhysicianFilters } from "../../../types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const SHIFT_LABEL = { morning: "Morning", afternoon: "Afternoon", weekend: "Weekend duty" } as const;
const CONSULT_LABEL = { face_to_face: "Face-to-face", tele: "Tele-consultation" } as const;

const todayIndex = (): number => (new Date().getDay() + 6) % 7;

function weekLabel(): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - todayIndex());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const m = (d: Date) => d.toLocaleDateString("en-PH", { month: "long" });
  return m(start) === m(end)
    ? `${m(start)} ${start.getDate()}–${end.getDate()}`
    : `${m(start)} ${start.getDate()} – ${m(end)} ${end.getDate()}`;
}

const canBook = (p: Physician): boolean => p.availability !== "on_leave" && p.booked < p.capacity;

export function PhysicianScheduleView({ staff }: { staff: boolean }) {
  const { physicians } = useHealthData();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<PhysicianFilters>(DEFAULT_PHYSICIAN_FILTERS);
  const [bookId, setBookId] = useState<string | null>(null);
  const [bookOpen, setBookOpen] = useState(false);

  const list = useMemo(() => applyPhysicianFilters(physicians, filters, query), [physicians, filters, query]);
  const today = todayIndex();
  const availableToday = physicians.filter((p) => p.days.includes(today) && canBook(p));

  const openBook = (id?: string) => {
    setBookId(id ?? null);
    setBookOpen(true);
  };

  const bookButton = (p: Physician) => (
    <button type="button" disabled={!canBook(p)} onClick={() => openBook(p.id)} className={BTN_GHOST} aria-label={`Book ${p.name}`}>
      <CalendarPlus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      Book
    </button>
  );

  return (
    <>
      <PageHeader
        title={staff ? "Physician schedule" : "Physician duty"}
        description={staff ? "Weekly roster, remaining slots and bookings." : "See which doctors are on duty and book a consultation."}
        actions={
          <button type="button" onClick={() => openBook()} className={BTN_ACTIVE}>
            Book consultation
          </button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <PhysicianSearchBar query={query} onQueryChange={setQuery} filters={filters} onFiltersChange={setFilters} />
          <p className="mb-3 mt-4 text-sm tabular-nums text-slate-300">Week of {weekLabel()}</p>

          {list.length === 0 ? (
            <EmptyState>No physicians match these filters.</EmptyState>
          ) : (
            <>
              {/* md+: weekly grid */}
              <div className={`hidden overflow-x-auto rounded-card border ${HAIRLINE} md:block`}>
                <table className="w-full min-w-[720px] text-left text-sm">
                  <caption className="sr-only">Weekly physician schedule</caption>
                  <thead className="bg-slate-900/80 text-slate-300">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Doctor and specialty</th>
                      {DAYS.map((d, i) => (
                        <th key={d} scope="col" className={`px-2 py-3 text-center font-medium ${i === today ? "text-white" : ""}`}>
                          {d}
                        </th>
                      ))}
                      <th scope="col" className="px-4 py-3 text-right font-medium">Slots</th>
                      <th scope="col" className="px-4 py-3"><span className="sr-only">Action</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p) => (
                      <tr key={p.id} className={`border-t ${HAIRLINE}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-100">{p.name}</p>
                          <p className="text-slate-300">{p.specialty} · {CONSULT_LABEL[p.consultType]}</p>
                        </td>
                        {DAYS.map((d, i) => {
                          const on = p.days.includes(i) && p.availability !== "on_leave";
                          return (
                            <td key={d} className={`px-2 py-3 text-center ${i === today ? "bg-slate-800/50" : ""}`}>
                              {on ? (
                                <span className="text-xs text-slate-200" title={p.hours}>{SHIFT_LABEL[p.shift]}</span>
                              ) : (
                                <span className="text-slate-500" aria-label="Not on duty">–</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right tabular-nums text-slate-200">
                          {p.availability === "on_leave" ? <AvailabilityBadge status="on_leave" /> : `${p.capacity - p.booked} of ${p.capacity}`}
                        </td>
                        <td className="px-4 py-3 text-right">{bookButton(p)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* mobile: list */}
              <ul className="md:hidden">
                {list.map((p) => (
                  <li key={p.id} className={`flex items-start justify-between gap-3 border-b ${HAIRLINE} py-4 first:pt-0`}>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-slate-100">{p.name}</p>
                      <p className="text-sm text-slate-300">{p.specialty} · {CONSULT_LABEL[p.consultType]}</p>
                      <p className="text-sm text-slate-400">{p.days.map((d) => DAYS[d]).join(", ")} · {p.hours}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <AvailabilityBadge status={p.availability} />
                        <span className="text-xs tabular-nums text-slate-400">{p.capacity - p.booked} slots left</span>
                      </div>
                    </div>
                    {bookButton(p)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside aria-label="Available today">
          <SectionHeader title="Available today" />
          {availableToday.length === 0 ? (
            <EmptyState>No doctors with open slots today.</EmptyState>
          ) : (
            <ul>
              {availableToday.map((p) => (
                <li key={p.id} className={`flex items-center justify-between gap-3 border-b ${HAIRLINE} py-3 last:border-b-0`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">{p.name}</p>
                    <p className="text-sm text-slate-300">{p.specialty}</p>
                    <p className="text-xs tabular-nums text-slate-400">{p.hours}</p>
                  </div>
                  <button type="button" onClick={() => openBook(p.id)} className={BTN_GHOST}>Request</button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <BookDoctorModal open={bookOpen} onClose={() => setBookOpen(false)} initialPhysicianId={bookId ?? undefined} />
    </>
  );
}
