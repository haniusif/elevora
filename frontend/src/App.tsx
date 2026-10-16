import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import { useAuth } from "./auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Elevators from "./pages/Elevators";
import ElevatorDetail from "./pages/ElevatorDetail";
import WorkOrders from "./pages/WorkOrders";
import WorkOrderDetail from "./pages/WorkOrderDetail";
import Faults from "./pages/Faults";
import FaultDetail from "./pages/FaultDetail";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Contracts from "./pages/Contracts";
import ContractDetail from "./pages/ContractDetail";
import Inventory from "./pages/Inventory";

export default function App() {
  const loc = useLocation();
  const { user } = useAuth();

  if (loc.pathname === "/login") return <Login />;
  if (!user) return <Navigate to="/login" replace />;

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
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/contracts/:id" element={<ContractDetail />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </AppShell>
  );
}
