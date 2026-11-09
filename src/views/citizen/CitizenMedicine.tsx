import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionHeader } from "../../components/PageHeader";
import { SimpleBadge, StockBadge } from "../../components/StatusBadge";
import { FIELD, HAIRLINE } from "../../components/ui";
import { stockStatus, useHealthData } from "../../context/HealthDataContext";

export function CitizenMedicine() {
  const { batches, nearbyBarangays } = useHealthData();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return batches
      .filter((b) => q === "" || b.medicineName.toLowerCase().includes(q) || b.code.toLowerCase().includes(q))
      .map((b) => ({ b, status: stockStatus(b) }));
  }, [batches, query]);

  return (
    <>
      <PageHeader title="Medicine stock" description="Check what the barangay health center has before you go." />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="Medicine availability">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search medicine" aria-label="Search medicine" className={`${FIELD} pl-9`} />
          </div>
          {rows.length === 0 ? (
            <EmptyState>No medicine matches your search.</EmptyState>
          ) : (
            <div className={`overflow-x-auto rounded-card border ${HAIRLINE}`}>
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Medicine availability</caption>
                <thead className="bg-slate-900/80 text-slate-300">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Medicine</th>
                    <th scope="col" className="px-4 py-3 font-medium">Availability</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ b, status }) => (
                    <tr key={b.id} className={`border-t ${HAIRLINE}`}>
                      <td className="px-4 py-3 text-slate-100">{b.medicineName}</td>
                      <td className="px-4 py-3"><StockBadge status={status} /></td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-200">{status === "expired" ? 0 : b.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside aria-label="Nearby barangays">
          <SectionHeader title="Nearby barangays" />
          <ul>
            {nearbyBarangays.map((n) => (
              <li key={n.id} className={`flex items-start justify-between gap-3 border-b ${HAIRLINE} py-3 last:border-b-0`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">{n.name}</p>
                  <p className="text-sm text-slate-300">{n.address}</p>
                </div>
                {n.available ? <SimpleBadge tone="ok">Available</SimpleBadge> : <SimpleBadge tone="slate">Unavailable</SimpleBadge>}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
