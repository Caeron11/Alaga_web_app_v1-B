import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { BTN_GHOST, HAIRLINE } from "./ui";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[href]';

/** Render only while open: `{open && <Modal …/>}`. Local form state then resets on every open. */
export function Modal({ title, onClose, children, footer }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-panel border ${HAIRLINE} bg-navy-900 sm:rounded-panel`}
      >
        <div className={`flex shrink-0 items-center justify-between border-b ${HAIRLINE} px-4 py-2 sm:px-6`}>
          <h2 id={titleId} className="text-base font-medium text-slate-100">
            {title}
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className={`${BTN_GHOST} !px-0`}>
            <X className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
        {footer && <div className={`flex shrink-0 justify-end gap-2 border-t ${HAIRLINE} px-4 py-3 pb-safe sm:px-6`}>{footer}</div>}
      </div>
    </div>
  );
}
