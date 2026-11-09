import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { SettingsView } from "../../views/settings/SettingsView";
import { BTN_GHOST, HAIRLINE } from "../ui";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const FOCUSABLE = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),[href]';

/** Slide-over shell. All content lives in SettingsView. */
export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { user } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!user) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ease-alaga ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l ${HAIRLINE} bg-navy-900 transition-[transform,visibility] duration-300 ease-alaga sm:w-96 ${open ? "visible translate-x-0" : "invisible translate-x-full"}`}
      >
        <div className={`flex h-14 shrink-0 items-center justify-between border-b ${HAIRLINE} px-4`}>
          <h2 className="text-base font-medium text-slate-100">Settings</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close settings" className={`${BTN_GHOST} !px-0`}>
            <X className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-safe">{open && <SettingsView />}</div>
      </div>
    </>
  );
}
