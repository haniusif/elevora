import { useEffect, useState, ReactNode } from "react";
import { Routes, Route, useLocation, Navigate, Link } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import AppShell from "./components/AppShell";
import { useAuth } from "./auth";
import { bootstrap } from "./api/client";
import type { Module } from "./rbac";
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

function AccessDenied() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
          <Lock size={22} />
        </div>
        <h2 className="text-lg font-bold">لا تملك صلاحية الوصول</h2>
        <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">هذا القسم غير متاح لدورك الحالي.</p>
        <Link to="/" className="mt-4 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">العودة للوحة المعلومات</Link>
      </div>
    </div>
  );
}

function Guard({ module, children }: { module: Module; children: ReactNode }) {
  const { can } = useAuth();
  return can(module, "view") ? <>{children}</> : <AccessDenied />;
}

export default function App() {
  const loc = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    if (user) bootstrap().then(() => on && setLoading(false));
    else setLoading(false);
    return () => { on = false; };
  }, [user]);

  if (loc.pathname === "/login") return <Login />;
  if (!user) return <Navigate to="/login" replace />;

  if (loading)
    return (
      <div className="grid min-h-full place-items-center text-ink-soft">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 size={18} className="animate-spin text-brand-500" /> جارٍ تحميل البيانات…
        </div>
      </div>
    );

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Guard module="dashboard"><Dashboard /></Guard>} />
        <Route path="/elevators" element={<Guard module="elevators"><Elevators /></Guard>} />
        <Route path="/elevators/:id" element={<Guard module="elevators"><ElevatorDetail /></Guard>} />
        <Route path="/work-orders" element={<Guard module="work_orders"><WorkOrders /></Guard>} />
        <Route path="/work-orders/:id" element={<Guard module="work_orders"><WorkOrderDetail /></Guard>} />
        <Route path="/faults" element={<Guard module="faults"><Faults /></Guard>} />
        <Route path="/faults/:id" element={<Guard module="faults"><FaultDetail /></Guard>} />
        <Route path="/customers" element={<Guard module="customers"><Customers /></Guard>} />
        <Route path="/customers/:id" element={<Guard module="customers"><CustomerDetail /></Guard>} />
        <Route path="/contracts" element={<Guard module="contracts"><Contracts /></Guard>} />
        <Route path="/contracts/:id" element={<Guard module="contracts"><ContractDetail /></Guard>} />
        <Route path="/inventory" element={<Guard module="inventory"><Inventory /></Guard>} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </AppShell>
  );
}
