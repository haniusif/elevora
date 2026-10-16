import { Routes, Route, useLocation } from "react-router-dom";
import AppShell from "./components/AppShell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Elevators from "./pages/Elevators";
import ElevatorDetail from "./pages/ElevatorDetail";
import WorkOrders from "./pages/WorkOrders";
import WorkOrderDetail from "./pages/WorkOrderDetail";
import Faults from "./pages/Faults";
import FaultDetail from "./pages/FaultDetail";

export default function App() {
  const loc = useLocation();
  if (loc.pathname === "/login") return <Login />;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/elevators" element={<Elevators />} />
        <Route path="/elevators/:id" element={<ElevatorDetail />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/work-orders/:id" element={<WorkOrderDetail />} />
        <Route path="/faults" element={<Faults />} />
        <Route path="/faults/:id" element={<FaultDetail />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </AppShell>
  );
}
