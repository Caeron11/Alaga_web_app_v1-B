import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { Avatar } from "../Avatar";
import { FOCUS, HAIRLINE } from "../ui";
import { getNavItems, ROLE_LABEL, type ViewId } from "./nav";

interface DesktopSidebarProps {
  view: ViewId;
  onNavigate: (v: ViewId) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const ROW = `flex min-h-[44px] w-full items-center gap-3 rounded-control px-3 text-sm transition-colors duration-150 ease-alaga ${FOCUS}`;

export function DesktopSidebar({ view, onNavigate, collapsed, onToggle }: DesktopSidebarProps) {
  const { user, logout } = useAuth();
  const { locale } = useSettings();
  if (!user) return null;
  const items = getNavItems(user.role);

  return (
    <aside
      aria-label="Primary"
      className={`fixed bottom-0 left-0 top-14 z-30 hidden flex-col border-r ${HAIRLINE} bg-navy-950 transition-[width] duration-300 ease-alaga lg:flex ${collapsed ? "w-[72px]" : "w-64"}`}
    >
      <div className={`flex items-center gap-3 border-b ${HAIRLINE} p-4 ${collapsed ? "justify-center" : ""}`}>
        <Avatar name={user.name} src={user.avatarUrl} size={40} />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">{user.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden="true" />
              {ROLE_LABEL[user.role]}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-1">
          {items.map(({ id, icon: Icon, label }) => {
            const active = id === view;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onNavigate(id)}
                  aria-current={active ? "page" : undefined}
                  aria-label={collapsed ? label[locale] : undefined}
                  title={collapsed ? label[locale] : undefined}
                  className={`${ROW} ${collapsed ? "justify-center px-0" : ""} ${
                    active ? "bg-blue-600 font-semibold text-white" : "text-slate-300 hover:bg-slate-800 hover:text-slate-50"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  {!collapsed && <span className="truncate">{label[locale]}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={`flex flex-col gap-1 border-t ${HAIRLINE} p-2`}>
        <button
          type="button"
          onClick={logout}
          aria-label={collapsed ? "Log out" : undefined}
          title={collapsed ? "Log out" : undefined}
          className={`${ROW} text-slate-300 hover:bg-slate-800 hover:text-slate-50 ${collapsed ? "justify-center px-0" : ""}`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} aria-hidden="true" />
          {!collapsed && <span>Log out</span>}
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`${ROW} text-slate-400 hover:bg-slate-800 hover:text-slate-50 ${collapsed ? "justify-center px-0" : ""}`}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
