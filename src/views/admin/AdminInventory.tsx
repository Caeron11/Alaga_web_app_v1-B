import { FilePlus2, History, Search } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { DispenseMedicineModal } from "../../components/DispenseMedicineModal";
import { Field } from "../../components/Field";
import { EmptyState, PageHeader, SectionHeader } from "../../components/PageHeader";
import { SimpleBadge, StockBadge } from "../../components/StatusBadge";
import { BTN_ACTIVE, BTN_GHOST, FIELD, FOCUS, HAIRLINE } from "../../components/ui";
import { daysUntil, expiryBand, stockStatus, useHealthData } from "../../context/HealthDataContext";
import { useToast } from "../../context/ToastContext";
import { fmtDate } from "../../lib/format";
import type { ExpiryBand, StockStatus } from "../../../types";
import { AddStockModal, DispenseRecordsModal } from "./InventoryModals";

const BAND_NOTE: Record<ExpiryBand, string> = { expired: "Expired", d30: "Within 30 days", d60: "Within 60 days", d90: "Within 90 days", ok: "" };
const BAND_COLOR: Record<ExpiryBand, string> = { expired: "text-red-300", d30: "text-amber-300", d60: "text-amber-300", d90: "text-slate-300", ok: "" };

export function AdminInventory() {
  const { batches, nearbyBarangays, requisitions, requestFromBarangay } = useHealthData();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "all">("all");
  const [dispenseId, setDispenseId] = useState<string | undefined>();
  const [dispenseOpen, setDispenseOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);

  const [brgyId, setBrgyId] = useState<string>(nearbyBarangays[0]?.id ?? "");
  const [reqMed, setReqMed] = useState("");
  const [reqQty, setReqQty] = useState("");
  const [reqError, setReqError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return batches
      .map((b) => ({ b, status: stockStatus(b) }))
      .filter(({ b, status }) => (statusFilter === "all" || status === statusFilter) && (q === "" || b.medicineName.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || b.batchNo.toLowerCase().includes(q)));
  }, [batches, query, statusFilter]);

  const counts = useMemo(() => {
    const c = { low_stock: 0, near_expiry: 0, out_of_stock: 0 };
    batches.forEach((b) => {
      const s = stockStatus(b);
      if (s === "low_stock" || s === "near_expiry" || s === "out_of_stock") c[s] += 1;
    });
    return c;
  }, [batches]);

  const medNames = useMemo(() => Array.from(new Set(batches.map((b) => b.medicineName))), [batches]);
  const brgy = nearbyBarangays.find((n) => n.id === brgyId);

  const file = (e: FormEvent) => {
    e.preventDefault();
    const med = reqMed || medNames[0] || "";
    const qty = Number(reqQty);
    if (!brgy) return setReqError("Select a barangay");
    if (!Number.isInteger(qty) || qty <= 0) return setReqError("Enter a quantity of at least 1");
    const res = requestFromBarangay(brgy.id, med, qty);
    if (!res.ok) return setReqError(res.error);
    setReqError(null);
    setReqQty("");
    toast.push({ kind: "info", title: "Request filed", description: `${qty} × ${med} from ${brgy.name}` });
  };

  return (
    <>
      <PageHeader
        title="Medicine inventory"
        description={`${counts.low_stock} low stock · ${counts.near_expiry} near expiry · ${counts.out_of_stock} out of stock`}
        actions={
          <>
            <button type="button" onClick={() => setAddOpen(true)} className={BTN_ACTIVE}><FilePlus2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />Add stock</button>
            <button type="button" onClick={() => setRecordsOpen(true)} className={BTN_GHOST}><History className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />Dispense records</button>
          </>
        }
      />

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Stock table" className="min-w-0">
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search medicine" aria-label="Search medicine" className={`${FIELD} pl-9`} />
            </div>
            <select aria-label="Filter by status" className={`${FIELD} w-auto`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StockStatus | "all")}>
              <option value="all">All statuses</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="near_expiry">Near expiry</option>
              <option value="out_of_stock">Out of stock</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {rows.length === 0 ? (
            <EmptyState>No batches match.</EmptyState>
          ) : (
            <div className={`overflow-x-auto rounded-card border ${HAIRLINE}`}>
              <table className="w-full min-w-[760px] text-left text-sm">
                <caption className="sr-only">Medicine batches</caption>
                <thead className="bg-slate-900/80 text-slate-300">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Medicine</th>
                    <th scope="col" className="px-4 py-3 font-medium">Batch no.</th>
                    <th scope="col" className="px-4 py-3 font-medium">Expiration</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Stock</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Minimum</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ b, status }) => {
                    const band = expiryBand(b.expirationDate);
                    const canDispense = b.stock > 0 && daysUntil(b.expirationDate) >= 0;
                    return (
                      <tr key={b.id} className={`border-t ${HAIRLINE}`}>
                        <td className="px-4 py-3"><p className="font-medium text-slate-100">{b.medicineName}</p><p className="font-mono text-xs text-slate-400">{b.code}</p></td>
                        <td className="px-4 py-3 font-mono tabular-nums text-slate-300">{b.batchNo}</td>
                        <td className="px-4 py-3 tabular-nums"><p className="text-slate-200">{fmtDate(b.expirationDate)}</p>{BAND_NOTE[band] && <p className={`text-xs ${BAND_COLOR[band]}`}>{BAND_NOTE[band]}</p>}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-100">{b.stock}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">{b.minimum}</td>
                        <td className="px-4 py-3"><StockBadge status={status} /></td>
                        <td className="px-4 py-2 text-right">
                          <button type="button" disabled={!canDispense} onClick={() => { setDispenseId(b.id); setDispenseOpen(true); }} className={BTN_GHOST} aria-label={`Dispense ${b.medicineName}`}>Dispense</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside aria-label="Requisition">
          <SectionHeader title="Nearby barangays" />
          <div role="radiogroup" aria-label="Barangay" className="mb-4">
            {nearbyBarangays.map((n) => (
              <button
                key={n.id}
                type="button"
                role="radio"
                aria-checked={brgyId === n.id}
                onClick={() => setBrgyId(n.id)}
                className={`flex min-h-[44px] w-full items-start justify-between gap-3 border-b ${HAIRLINE} px-2 py-3 text-left transition-colors duration-150 ease-alaga last:border-b-0 ${FOCUS} ${brgyId === n.id ? "bg-slate-800/80" : "hover:bg-slate-800/50"}`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-100">{n.name}</span>
                  <span className="block text-sm text-slate-300">{n.address}</span>
                  {n.available && <span className="block font-mono text-xs text-slate-400">{n.availableCodes.join(", ")} in stock</span>}
                </span>
                {n.available ? <SimpleBadge tone="ok">Available</SimpleBadge> : <SimpleBadge tone="slate">Unavailable</SimpleBadge>}
              </button>
            ))}
          </div>

          <form onSubmit={file} noValidate className="space-y-3">
            {reqError && <p role="alert" className="rounded-control bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{reqError}</p>}
            <Field label="Medicine">
              <select className={FIELD} value={reqMed || medNames[0] || ""} onChange={(e) => setReqMed(e.target.value)}>
                {medNames.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Quantity">
              <input className={`${FIELD} tabular-nums`} type="number" inputMode="numeric" min={1} value={reqQty} onChange={(e) => setReqQty(e.target.value)} />
            </Field>
            <button type="submit" className={`${BTN_ACTIVE} w-full`}>File request from selected barangay</button>
          </form>

          {requisitions.length > 0 && (
            <div className="mt-8">
              <SectionHeader title="Filed requests" />
              <ul>
                {requisitions.map((r) => (
                  <li key={r.id} className={`flex items-center justify-between gap-3 border-b ${HAIRLINE} py-3 text-sm last:border-b-0`}>
                    <span className="text-slate-200"><span className="tabular-nums">{r.quantity}</span> × {r.medicineName}</span>
                    <SimpleBadge tone="amber">Pending</SimpleBadge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <DispenseMedicineModal open={dispenseOpen} onClose={() => setDispenseOpen(false)} initialBatchId={dispenseId} />
      <AddStockModal open={addOpen} onClose={() => setAddOpen(false)} />
      <DispenseRecordsModal open={recordsOpen} onClose={() => setRecordsOpen(false)} />
    </>
  );
}
