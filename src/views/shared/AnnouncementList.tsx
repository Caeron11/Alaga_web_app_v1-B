import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Modal } from "../../components/Modal";
import { EmptyState, SectionHeader } from "../../components/PageHeader";
import { BTN_GHOST, FOCUS, HAIRLINE } from "../../components/ui";
import { useHealthData } from "../../context/HealthDataContext";
import { fmtDate } from "../../lib/format";
import type { Announcement } from "../../../types";

const PREVIEW_COUNT = 3;

export function AnnouncementList() {
  const { announcements } = useHealthData();
  const [all, setAll] = useState(false);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const shown = all ? announcements : announcements.slice(0, PREVIEW_COUNT);

  return (
    <section aria-label="Announcements">
      <SectionHeader
        title="Announcements"
        action={
          announcements.length > PREVIEW_COUNT ? (
            <button type="button" onClick={() => setAll((a) => !a)} className={BTN_GHOST}>
              {all ? "Show fewer" : "View all"}
            </button>
          ) : undefined
        }
      />
      {shown.length === 0 ? (
        <EmptyState>No announcements right now.</EmptyState>
      ) : (
        <ul>
          {shown.map((a) => (
            <li key={a.id} className={`border-b ${HAIRLINE} last:border-b-0`}>
              <button
                type="button"
                onClick={() => setSelected(a)}
                className={`flex min-h-[44px] w-full items-start gap-3 rounded-control py-3 text-left transition-colors duration-150 ease-alaga hover:bg-slate-800/60 ${FOCUS}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-100">{a.title}</span>
                  <span className="mt-0.5 block text-sm text-slate-300 line-clamp-2">{a.body}</span>
                  <span className="mt-1 block text-xs tabular-nums text-slate-400">{fmtDate(a.date)}</span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)} footer={<button type="button" onClick={() => setSelected(null)} className={BTN_GHOST}>Close</button>}>
          <p className="text-xs tabular-nums text-slate-400">{fmtDate(selected.date)}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">{selected.body}</p>
        </Modal>
      )}
    </section>
  );
}
