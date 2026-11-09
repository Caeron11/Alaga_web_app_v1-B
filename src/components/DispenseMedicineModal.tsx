import { useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { daysUntil, expiryBand, useHealthData } from "../context/HealthDataContext";
import { useToast } from "../context/ToastContext";
import { Modal } from "./Modal";
import { BTN_ACTIVE, BTN_GHOST, FIELD } from "./ui";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Preselect a batch when opened from an inventory row */
  initialBatchId?: string;
}

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

function DispenseForm({ onClose, initialBatchId }: Omit<Props, "open">) {
  const { batches, dispenseMedicine } = useHealthData();
  const { user } = useAuth();
  const toast = useToast();

  const options = useMemo(() => batches.filter((b) => b.stock > 0 && daysUntil(b.expirationDate) >= 0), [batches]);
  const [batchId, setBatchId] = useState<string>(
    initialBatchId && options.some((o) => o.id === initialBatchId) ? initialBatchId : (options[0]?.id ?? ""),
  );
  const [qty, setQty] = useState("1");
  const [recipient, setRecipient] = useState("");
  const [doctor, setDoctor] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  const batch = options.find((b) => b.id === batchId);
  const qtyNum = Number(qty);
  const after = batch && Number.isInteger(qtyNum) && qtyNum > 0 ? batch.stock - qtyNum : null;
  const band = batch ? expiryBand(batch.expirationDate) : "ok";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const res = dispenseMedicine(
      { batchId, quantity: qtyNum, recipient, prescribingDoctor: doctor, reference },
      user?.name ?? "Staff",
    );
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.medicineDispensed(res.data.medicineName, res.data.quantity);
    onClose();
  };

  if (options.length === 0) {
    return (
      <Modal title="Dispense medicine" onClose={onClose} footer={<button type="button" onClick={onClose} className={BTN_GHOST}>Close</button>}>
        <p className="text-sm text-slate-300">No batches with stock are available to dispense. Add stock or request a restock from a nearby barangay.</p>
      </Modal>
    );
  }

  return (
    <Modal
      title="Dispense medicine"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button>
          <button type="submit" form="dispense-form" className={BTN_ACTIVE}>Dispense</button>
        </>
      }
    >
      <form id="dispense-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <p role="alert" className="rounded-control bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}

        <label className="block text-sm text-slate-300">
          Medicine batch
          <select className={`${FIELD} mt-1`} value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            {options.map((b) => (
              <option key={b.id} value={b.id}>
                {b.medicineName} · {b.batchNo} · {b.stock} left
              </option>
            ))}
          </select>
        </label>
        {batch && (
          <p className={`text-sm ${band === "d30" ? "text-amber-300" : "text-slate-400"}`}>
            Expires {fmtDate(batch.expirationDate)} ({daysUntil(batch.expirationDate)} days)
          </p>
        )}

        <label className="block text-sm text-slate-300">
          Quantity
          <input
            className={`${FIELD} mt-1 tabular-nums`}
            type="number"
            inputMode="numeric"
            min={1}
            max={batch?.stock}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </label>
        {after !== null && (
          <p className={`text-sm tabular-nums ${after < 0 ? "text-rose-300" : "text-slate-400"}`}>
            {after < 0 ? `Only ${batch?.stock} in stock` : `Stock after dispensing: ${after}`}
          </p>
        )}

        <label className="block text-sm text-slate-300">
          Recipient name
          <input className={`${FIELD} mt-1`} value={recipient} onChange={(e) => setRecipient(e.target.value)} autoComplete="off" />
        </label>
        <label className="block text-sm text-slate-300">
          Prescribing doctor
          <input className={`${FIELD} mt-1`} value={doctor} onChange={(e) => setDoctor(e.target.value)} autoComplete="off" />
        </label>
        <label className="block text-sm text-slate-300">
          Diagnosis or prescription reference
          <input className={`${FIELD} mt-1`} value={reference} onChange={(e) => setReference(e.target.value)} autoComplete="off" />
        </label>
      </form>
    </Modal>
  );
}

export function DispenseMedicineModal({ open, onClose, initialBatchId }: Props) {
  return open ? <DispenseForm onClose={onClose} initialBatchId={initialBatchId} /> : null;
}
