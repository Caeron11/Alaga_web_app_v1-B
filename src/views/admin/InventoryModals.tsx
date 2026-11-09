import { useState, type FormEvent } from "react";
import { MEDICINE_CATEGORIES, type MedicineCategory, type Prescription } from "../../../types";
import { Field } from "../../components/Field";
import { Modal } from "../../components/Modal";
import { EmptyState } from "../../components/PageHeader";
import { BTN_ACTIVE, BTN_GHOST, FIELD, HAIRLINE } from "../../components/ui";
import { useHealthData } from "../../context/HealthDataContext";
import { useToast } from "../../context/ToastContext";
import { fmtDateTime } from "../../lib/format";

function AddStockForm({ onClose }: { onClose: () => void }) {
  const { addStock } = useHealthData();
  const toast = useToast();
  const [f, setF] = useState({ medicineName: "", genericName: "", brandName: "", code: "", batchNo: "", expirationDate: "", stock: "", minimum: "" });
  const [category, setCategory] = useState<MedicineCategory>(MEDICINE_CATEGORIES[0]);
  const [prescription, setPrescription] = useState<Prescription>("otc");
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const stock = Number(f.stock);
    const minimum = Number(f.minimum);
    if (!f.medicineName.trim() || !f.genericName.trim() || !f.brandName.trim() || !f.code.trim() || !f.batchNo.trim() || !f.expirationDate) return setError("Fill in every field");
    if (!Number.isInteger(stock) || stock <= 0) return setError("Quantity must be at least 1");
    if (!Number.isInteger(minimum) || minimum < 0) return setError("Minimum level cannot be negative");
    addStock({ medicineName: f.medicineName.trim(), genericName: f.genericName.trim(), brandName: f.brandName.trim(), category, prescription, code: f.code.trim().toUpperCase(), batchNo: f.batchNo.trim(), expirationDate: f.expirationDate, stock, minimum });
    toast.push({ title: "Stock added", description: `${stock} × ${f.medicineName.trim()}` });
    onClose();
  };

  return (
    <Modal
      title="Add stock"
      onClose={onClose}
      footer={<><button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button><button type="submit" form="add-stock-form" className={BTN_ACTIVE}>Add stock</button></>}
    >
      <form id="add-stock-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <p role="alert" className="rounded-control bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}
        <Field label="Medicine name and strength"><input className={FIELD} value={f.medicineName} onChange={set("medicineName")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Generic name"><input className={FIELD} value={f.genericName} onChange={set("genericName")} /></Field>
          <Field label="Brand name"><input className={FIELD} value={f.brandName} onChange={set("brandName")} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select className={FIELD} value={category} onChange={(e) => setCategory(e.target.value as MedicineCategory)}>
              {MEDICINE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Prescription">
            <select className={FIELD} value={prescription} onChange={(e) => setPrescription(e.target.value as Prescription)}>
              <option value="otc">Over the counter</option>
              <option value="rx">Prescription required (Rx)</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code"><input className={FIELD} value={f.code} onChange={set("code")} /></Field>
          <Field label="Batch number"><input className={FIELD} value={f.batchNo} onChange={set("batchNo")} /></Field>
        </div>
        <Field label="Expiration date"><input className={FIELD} type="date" value={f.expirationDate} onChange={set("expirationDate")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Quantity"><input className={`${FIELD} tabular-nums`} type="number" inputMode="numeric" min={1} value={f.stock} onChange={set("stock")} /></Field>
          <Field label="Minimum level"><input className={`${FIELD} tabular-nums`} type="number" inputMode="numeric" min={0} value={f.minimum} onChange={set("minimum")} /></Field>
        </div>
      </form>
    </Modal>
  );
}

export function AddStockModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <AddStockForm onClose={onClose} /> : null;
}

export function DispenseRecordsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispenseRecords } = useHealthData();
  if (!open) return null;
  return (
    <Modal title="Dispense records" onClose={onClose} footer={<button type="button" onClick={onClose} className={BTN_GHOST}>Close</button>}>
      {dispenseRecords.length === 0 ? (
        <EmptyState>Nothing dispensed yet.</EmptyState>
      ) : (
        <ul>
          {dispenseRecords.map((r) => (
            <li key={r.id} className={`space-y-0.5 border-b ${HAIRLINE} py-3 text-sm last:border-b-0`}>
              <p className="font-medium text-slate-100"><span className="tabular-nums">{r.quantity}</span> × {r.medicineName}</p>
              <p className="text-slate-300">To {r.recipient} · prescribed by {r.prescribingDoctor}</p>
              {r.reference && <p className="text-slate-400">Ref: {r.reference}</p>}
              <p className="text-xs tabular-nums text-slate-400">{fmtDateTime(r.timestamp)} · {r.dispensedBy}</p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
