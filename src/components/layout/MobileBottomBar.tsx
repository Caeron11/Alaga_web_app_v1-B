import { Settings, Siren } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { FOCUS, HAIRLINE } from "../ui";
import { getNavItems, type ViewId } from "./nav";

interface MobileBottomBarProps {
  view: ViewId;
  onNavigate: (v: ViewId) => void;
  onOpenSettings: () => void;
}

const ITEM = `flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-control px-1 py-1 text-xs transition-colors duration-150 ease-alaga ${FOCUS}`;

export function MobileBottomBar({ view, onNavigate, onOpenSettings }: MobileBottomBarProps) {
  const { user } = useAuth();
  const { locale } = useSettings();
  if (!user) return null;

  const staff = user.role !== "resident";
  const byId = Object.fromEntries(getNavItems(user.role).map((i) => [i.id, i])) as Record<ViewId, ReturnType<typeof getNavItems>[number]>;
  const left = [byId.overview, byId.medicine];
  const right = [byId.physicians];
  const fabLabel = staff ? "Dispatch" : "Saklolo";

  const renderItem = ({ id, icon: Icon, short }: (typeof left)[number]) => {
    const active = id === view;
    return (
      <button
        key={id}
        type="button"
        onClick={() => onNavigate(id)}
        aria-current={active ? "page" : undefined}
        className={`${ITEM} ${active ? "bg-blue-600 font-semibold text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
        <span className="whitespace-nowrap">{short[locale]}</span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Primary"
      className={`fixed inset-x-0 bottom-0 z-40 border-t ${HAIRLINE} bg-navy-950 px-2 pt-2 pb-safe lg:hidden`}
    >
      <div className="mx-auto flex max-w-md items-end gap-1">
        {left.map(renderItem)}

        <div className="flex flex-1 flex-col items-center">
          <button
            type="button"
            onClick={() => onNavigate("ambulance")}
            aria-label={staff ? "Open ambulance dispatch" : "Request an ambulance"}
            aria-current={view === "ambulance" ? "page" : undefined}
            className={`-mt-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-900/50 transition-colors duration-150 ease-alaga hover:bg-rose-500 ${FOCUS} ${view === "ambulance" ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950" : ""}`}
          >
            <Siren className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <span className="mt-0.5 text-xs font-medium text-rose-300">{fabLabel}</span>
        </div>

        {right.map(renderItem)}
        <button type="button" onClick={onOpenSettings} aria-haspopup="dialog" className={`${ITEM} text-slate-300 hover:bg-slate-800 hover:text-white`}>
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
}
