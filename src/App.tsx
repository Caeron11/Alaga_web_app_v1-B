import { useEffect, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import type { ViewId } from "./components/layout/nav";
import { AppProviders } from "./context/AppProviders";
import { useAuth } from "./context/AuthContext";
import { AdminInventory } from "./views/admin/AdminInventory";
import { AdminOverview } from "./views/admin/AdminOverview";
import { CitizenMedicine } from "./views/citizen/CitizenMedicine";
import { CitizenOverview } from "./views/citizen/CitizenOverview";
import { LoginView } from "./views/LoginView";
import { AmbulanceDispatchLinear } from "./views/shared/AmbulanceDispatchLinear";
import { PhysicianScheduleView } from "./views/shared/PhysicianScheduleView";

function Gate() {
  const { user, isStaff } = useAuth();
  const [view, setView] = useState<ViewId>("overview");

  useEffect(() => {
    if (!user) setView("overview");
  }, [user]);

  if (!user) return <LoginView />;

  return (
    <AppShell view={view} onNavigate={setView}>
      {view === "overview" && (isStaff ? <AdminOverview /> : <CitizenOverview onNavigate={setView} />)}
      {view === "ambulance" && <AmbulanceDispatchLinear staff={isStaff} />}
      {view === "medicine" && (isStaff ? <AdminInventory /> : <CitizenMedicine />)}
      {view === "physicians" && <PhysicianScheduleView staff={isStaff} />}
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProviders>
      <Gate />
    </AppProviders>
  );
}
