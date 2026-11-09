import { FilePlus2, History, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { DispenseMedicineModal } from "../../components/DispenseMedicineModal";
import { Field } from "../../components/Field";
import { Modal } from "../../components/Modal";
import { EmptyState, PageHeader, SectionHeader } from "../../components/PageHeader";
import { SimpleBadge, StockBadge } from "../../components/StatusBadge";
import { BTN_ACTIVE, BTN_GHOST, FIELD, FOCUS, HAIRLINE } from "../../components/ui";
import { daysUntil, expiryBand, stockStatus, useHealthData } from "../../context/HealthDataContext";
import { useToast } from "../../context/ToastContext";
import { fmtDate } from "../../lib/format";
import { MEDICINE_CATEGORIES, type ExpiryBand, type MedicineCategory, type Prescription, type StockStatus } from "../../../types";
import { AddStockModal, DispenseRecordsModal } from "../admin/InventoryModals";

type QuickStatus = "all" | "low_stock" | "near_expiry" | "out_of_stock";
interface AttributeFilters {
  category: MedicineCategory | "all";
  prescription: Prescription | "all";
}
const NO_FILTERS: AttributeFilters = { category: "all", prescription: "all" };

const BAND_NOTE: Record<ExpiryBand, string> = { expired: "Expired", d30: "Within 30 days", d60: "Within 60 days", d90: "Within 90 days", ok: "" };
const BAND_COLOR: Record<ExpiryBand, string> = { expired: "text-red-300", d30: "text-amber-300", d60: "text-amber-300", d90: "text-slate-300", ok: "" };

const PILL =
  `inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-control border px-3 text-sm font-medium tabular-nums transition-colors duration-150 ease-alaga ${FOCUS}`;
const PILL_ACTIVE = "border-blue-600 bg-blue-600 text-white shadow-sm";
const PILL_TONE: Record<QuickStatus, string> = {
  all: "border-slate-700/80 bg-slate-800/80 text-slate-200 hover:border-slate-500 hover:bg-slate-700 hover:text-slate-50",
  low_stock: "border-amber-300/40 bg-amber-300/10 text-amber-300 hover:bg-amber-300/20",
  near_expiry: "border-orange-300/40 bg-orange-300/10 text-orange-300 hover:bg-orange-300/20",
  out_of_stock: "border-red-400/40 bg-red-400/10 text-red-300 hover:bg-red-400/20",
};

/* ---------------- Filter modal ---------------- */
function FilterForm({ value, onApply, onClose }: { value: AttributeFilters; onApply: (f: AttributeFilters) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<AttributeFilters>(value);

  const chip = (on: boolean, label: string, onClick: () => void) => (
    <button key={label} type="button" role="radio" aria-checked={on} onClick={onClick} className={`${on ? BTN_ACTIVE : BTN_GHOST} !px-3`}>
      {label}
    </button>
  );

  return (
    <Modal
      title="Filter medicine"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={() => setDraft(NO_FILTERS)} className={BTN_GHOST}>Clear filters</button>
          <button type="button" onClick={() => { onApply(draft); onClose(); }} className={BTN_ACTIVE}>Apply</button>
        </>
      }
    >
      <fieldset className="mb-6">
        <legend className="mb-2 text-sm font-medium text-slate-200">Category</legend>
        <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-2">
          {chip(draft.category === "all", "All", () => setDraft({ ...draft, category: "all" }))}
          {MEDICINE_CATEGORIES.map((c) => chip(draft.category === c, c, () => setDraft({ ...draft, category: c })))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-200">Prescription requirement</legend>
        <div role="radiogroup" aria-label="Prescription requirement" className="flex flex-wrap gap-2">
          {chip(draft.prescription === "all", "All", () => setDraft({ ...draft, prescription: "all" }))}
          {chip(draft.prescription === "otc", "Over the counter", () => setDraft({ ...draft, prescription: "otc" }))}
          {chip(draft.prescription === "rx", "Prescription required (Rx)", () => setDraft({ ...draft, prescription: "rx" }))}
        </div>
      </fieldset>
    </Modal>
  );
}

/* ---------------- Nearby barangays (+ requisition for staff) ---------------- */
function NearbyPanel({ staff }: { staff: boolean }) {
  const { batches, nearbyBarangays, requisitions, requestFromBarangay } = useHealthData();
  const toast = useToast();
  const [brgyId, setBrgyId] = useState<string>(nearbyBarangays[0]?.id ?? "");
  const [med, setMed] = useState("");
  const [qty, setQty] = useState("");
  const [error, setError] = useState<string | null>(null);

  const medNames = useMemo(() => Array.from(new Set(batches.map((b) => b.medicineName))), [batches]);
  const brgy = nearbyBarangays.find((n) => n.id === brgyId);

  const file = (e: FormEvent) => {
    e.preventDefault();
    const name = med || medNames[0] || "";
    const n = Number(qty);
    if (!brgy) return setError("Select a barangay");
    if (!Number.isInteger(n) || n <= 0) return setError("Enter a quantity of at least 1");
    const res = requestFromBarangay(brgy.id, name, n);
    if (!res.ok) return setError(res.error);
    setError(null);
    setQty("");
    toast.push({ kind: "info", title: "Request filed", description: `${n} × ${name} from ${brgy.name}` });
  };

  const body = (n: (typeof nearbyBarangays)[number]) => (
    <>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-100">{n.name}</span>
        <span className="block text-sm text-slate-300">{n.address}</span>
        {n.available && <span className="block font-mono text-xs text-slate-400">{n.availableCodes.join(", ")} in stock</span>}
      </span>
      {n.available ? <SimpleBadge tone="ok">Available</SimpleBadge> : <SimpleBadge tone="slate">Unavailable</SimpleBadge>}
    </>
  );

  return (
    <aside aria-label="Nearby barangays">
      <SectionHeader title="Nearby barangays" />
      {staff ? (
        <>
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
                {body(n)}
              </button>
            ))}
          </div>
          <form onSubmit={file} noValidate className="space-y-3">
            {error && <p role="alert" className="rounded-control bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}
            <Field label="Medicine">
              <select className={FIELD} value={med || medNames[0] || ""} onChange={(e) => setMed(e.target.value)}>
                {medNames.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Quantity">
              <input className={`${FIELD} tabular-nums`} type="number" inputMode="numeric" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
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
        </>
      ) : (
        <ul>
          {nearbyBarangays.map((n) => (
            <li key={n.id} className={`flex items-start justify-between gap-3 border-b ${HAIRLINE} py-3 last:border-b-0`}>{body(n)}</li>
          ))}
        </ul>
      )}
    </aside>
  );
}

/* ---------------- Main view ---------------- */
export function MedicineStockView({ staff }: { staff: boolean }) {
  const { batches } = useHealthData();
  const [quick, setQuick] = useState<QuickStatus>("all");
  const [attrs, setAttrs] = useState<AttributeFilters>(NO_FILTERS);
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dispenseId, setDispenseId] = useState<string | undefined>();
  const [dispenseOpen, setDispenseOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);

  const total = batches.length;
  const counts = useMemo(() => {
    const c = { low_stock: 0, near_expiry: 0, out_of_stock: 0 };
    batches.forEach((b) => {
      const s = stockStatus(b);
      if (s === "low_stock" || s === "near_expiry" || s === "out_of_stock") c[s] += 1;
    });
    return c;
  }, [batches]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return batches
      .map((b) => ({ b, status: stockStatus(b) as StockStatus }))
      .filter(({ b, status }) => {
        if (quick !== "all" && status !== quick) return false;
        if (attrs.category !== "all" && b.category !== attrs.category) return false;
        if (attrs.prescription !== "all" && b.prescription !== attrs.prescription) return false;
        if (q === "") return true;
        return [b.brandName, b.genericName, b.medicineName, b.code].some((f) => f.toLowerCase().includes(q));
      });
  }, [batches, quick, attrs, query]);

  const activeAttrCount = (attrs.category !== "all" ? 1 : 0) + (attrs.prescription !== "all" ? 1 : 0);

  const quickDefs: { id: QuickStatus; label: string }[] = [
    { id: "all", label: "Lahat (All)" },
    { id: "low_stock", label: `Low Stock [${counts.low_stock}/${total}]` },
    { id: "near_expiry", label: `Near-Expiry [${counts.near_expiry}/${total}]` },
    { id: "out_of_stock", label: `Out of Stock [${counts.out_of_stock}/${total}]` },
  ];

  const nameCell = (b: (typeof rows)[number]["b"]) => (
    <td className="px-4 py-3">
      <p className="font-medium text-slate-100">{b.medicineName}</p>
      <p className="text-slate-300">{b.brandName} · {b.genericName}</p>
      <p className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400">{b.category}</span>
        <SimpleBadge tone={b.prescription === "rx" ? "sky" : "slate"}>{b.prescription === "rx" ? "Rx" : "OTC"}</SimpleBadge>
      </p>
    </td>
  );

  return (
    <>
      <PageHeader
        title={staff ? "Medicine inventory" : "Medicine stock"}
        description={staff ? "Batch ledger, dispensing and requests from nearby barangays." : "Check what the barangay health center has before you go."}
        actions={
          staff ? (
            <>
              <button type="button" onClick={() => setAddOpen(true)} className={BTN_ACTIVE}><FilePlus2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />Add stock</button>
              <button type="button" onClick={() => setRecordsOpen(true)} className={BTN_GHOST}><History className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />Dispense records</button>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Medicine ledger" className="min-w-0">
          <div role="radiogroup" aria-label="Quick status filter" className="mb-4 flex flex-wrap gap-2">
            {quickDefs.map((d) => (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={quick === d.id}
                onClick={() => setQuick(d.id)}
                className={`${PILL} ${quick === d.id ? PILL_ACTIVE : PILL_TONE[d.id]}`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Brand or generic name"
                aria-label="Search by brand name or generic name"
                className={`${FIELD} pl-9`}
              />
            </div>
            <button type="button" onClick={() => setFilterOpen(true)} aria-haspopup="dialog" className={BTN_GHOST}>
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              Filters
              {activeAttrCount > 0 && <span className="rounded-full bg-blue-600 px-2 text-xs font-semibold tabular-nums text-white">{activeAttrCount}</span>}
            </button>
          </div>

          <p className="mb-2 text-sm tabular-nums text-slate-300" aria-live="polite">Showing {rows.length} of {total}</p>

          {rows.length === 0 ? (
            <EmptyState>No medicine matches these filters.</EmptyState>
          ) : (
            <div className={`overflow-x-auto rounded-card border ${HAIRLINE}`}>
              <table className={`w-full text-left text-sm ${staff ? "min-w-[820px]" : ""}`}>
                <caption className="sr-only">Medicine ledger</caption>
                <thead className="bg-slate-900/80 text-slate-300">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Medicine</th>
                    {staff && <th scope="col" className="px-4 py-3 font-medium">Batch no.</th>}
                    {staff && <th scope="col" className="px-4 py-3 font-medium">Expiration</th>}
                    <th scope="col" className="px-4 py-3 text-right font-medium">Stock</th>
                    {staff && <th scope="col" className="px-4 py-3 text-right font-medium">Minimum</th>}
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    {staff && <th scope="col" className="px-4 py-3"><span className="sr-only">Action</span></th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ b, status }) => {
                    const band = expiryBand(b.expirationDate);
                    const canDispense = b.stock > 0 && daysUntil(b.expirationDate) >= 0;
                    return (
                      <tr key={b.id} className={`border-t ${HAIRLINE}`}>
                        {nameCell(b)}
                        {staff && <td className="px-4 py-3 font-mono tabular-nums text-slate-300">{b.batchNo}</td>}
                        {staff && (
                          <td className="px-4 py-3 tabular-nums">
                            <p className="text-slate-200">{fmtDate(b.expirationDate)}</p>
                            {BAND_NOTE[band] && <p className={`text-xs ${BAND_COLOR[band]}`}>{BAND_NOTE[band]}</p>}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right tabular-nums text-slate-100">{status === "expired" ? 0 : b.stock}</td>
                        {staff && <td className="px-4 py-3 text-right tabular-nums text-slate-300">{b.minimum}</td>}
                        <td className="px-4 py-3"><StockBadge status={status} /></td>
                        {staff && (
                          <td className="px-4 py-2 text-right">
                            <button type="button" disabled={!canDispense} onClick={() => { setDispenseId(b.id); setDispenseOpen(true); }} className={BTN_GHOST} aria-label={`Dispense ${b.medicineName}`}>
                              Dispense
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <NearbyPanel staff={staff} />
      </div>

      {filterOpen && <FilterForm value={attrs} onApply={setAttrs} onClose={() => setFilterOpen(false)} />}
      {staff && (
        <>
          <DispenseMedicineModal open={dispenseOpen} onClose={() => setDispenseOpen(false)} initialBatchId={dispenseId} />
          <AddStockModal open={addOpen} onClose={() => setAddOpen(false)} />
          <DispenseRecordsModal open={recordsOpen} onClose={() => setRecordsOpen(false)} />
        </>
      )}
    </>
  );
}
