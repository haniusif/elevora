import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { Card, PageHeader, Badge, Btn, cx, Modal, Field, TextInput, Select, FormGrid, toast } from "../lib/ui";
import type { WorkOrder, Priority } from "../data/mock";
import { useDB, create, remove, nextStrId } from "../api/store";

const typeFilters = ["الكل", "صيانة دورية", "إصلاح عطل", "فحص", "تركيب"] as const;
const checklistFor: Record<string, number> = { "صيانة دورية": 18, "إصلاح عطل": 9, "فحص": 22, "تركيب": 25 };

function NewWO({ onClose }: { onClose: () => void }) {
  const elevators = useDB((d) => d.elevators);
  const [f, setF] = useState({ type: "صيانة دورية", priority: "normal" as Priority, elevatorId: elevators[0]?.id ?? 0, scheduledAt: "", tech: "" });
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const save = () => {
    const el = elevators.find((e) => e.id === Number(f.elevatorId));
    if (!el) return toast("اختر المصعد", "err");
    const wo: WorkOrder = {
      id: nextStrId("wo"),
      woNo: "WO-" + Math.floor(3400 + Math.random() * 599),
      type: f.type as WorkOrder["type"],
      status: "scheduled",
      priority: f.priority,
      elevatorId: el.id,
      customer: el.customer,
      site: el.site,
      scheduledAt: f.scheduledAt || "2026-10-18 09:00",
      technicians: f.tech ? [{ name: f.tech, role: "رئيسي" }] : [{ name: el.maintenanceTech, role: "رئيسي" }],
      checklistDone: 0,
      checklistTotal: checklistFor[f.type] ?? 10,
      partsCount: 0,
      cost: 0,
    };
    create("workOrders", wo);
    toast("تم إنشاء أمر العمل");
    onClose();
  };
  return (
    <Modal title="أمر عمل جديد" onClose={onClose} footer={<><Btn variant="primary" onClick={save}>إنشاء</Btn><Btn variant="outline" onClick={onClose}>إلغاء</Btn></>}>
      <FormGrid>
        <Field label="نوع العمل">
          <Select value={f.type} onChange={(e) => set("type", e.target.value)}>
            {Object.keys(checklistFor).map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="الأولوية">
          <Select value={f.priority} onChange={(e) => set("priority", e.target.value)}>
            <option value="low">منخفض</option><option value="normal">عادي</option><option value="high">مرتفع</option><option value="critical">حرج</option><option value="emergency">طارئ</option>
          </Select>
        </Field>
        <Field label="المصعد" full>
          <Select value={f.elevatorId} onChange={(e) => set("elevatorId", e.target.value)}>
            {elevators.map((e) => <option key={e.id} value={e.id}>{e.assetNo} — {e.customer} ({e.site})</option>)}
          </Select>
        </Field>
        <Field label="الموعد"><TextInput placeholder="2026-10-18 09:00" value={f.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} /></Field>
        <Field label="الفني (اختياري)"><TextInput value={f.tech} onChange={(e) => set("tech", e.target.value)} /></Field>
      </FormGrid>
    </Modal>
  );
}

export default function WorkOrders() {
  const workOrders = useDB((d) => d.workOrders);
  const elevators = useDB((d) => d.elevators);
  const [t, setT] = useState<(typeof typeFilters)[number]>("الكل");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const rows = useMemo(
    () => workOrders.filter((w) => (t === "الكل" || w.type === t) && (!q || [w.woNo, w.customer, w.site].some((f) => f.includes(q)))),
    [workOrders, t, q]
  );
  const del = (w: WorkOrder) => { if (window.confirm(`حذف ${w.woNo}؟`)) { remove("workOrders", w.id); toast("تم الحذف"); } };

  return (
    <div>
      <PageHeader title="أوامر العمل" subtitle="العمود الفقري التشغيلي — كل زيارة أو إصلاح أو تركيب هو أمر عمل واحد"
        actions={<Btn variant="primary" onClick={() => setAdding(true)}><Plus size={15} /> أمر عمل جديد</Btn>} />

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث: رقم الأمر، العميل، الموقع…"
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" />
          <div className="flex flex-wrap items-center gap-1">
            {typeFilters.map((ff) => (
              <button key={ff} onClick={() => setT(ff)} className={cx("rounded-lg px-2.5 py-1 text-xs font-medium transition", t === ff ? "bg-brand-500 text-white" : "text-ink-soft hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")}>{ff}</button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink-faint dark:bg-slate-800/60">
              <tr className="text-right">
                <th className="px-4 py-2.5 font-semibold">رقم الأمر</th><th className="px-4 py-2.5 font-semibold">النوع</th>
                <th className="px-4 py-2.5 font-semibold">المصعد</th><th className="px-4 py-2.5 font-semibold">العميل / الموقع</th>
                <th className="px-4 py-2.5 font-semibold">الموعد</th><th className="px-4 py-2.5 font-semibold">الفنيون</th>
                <th className="px-4 py-2.5 font-semibold">الأولوية</th><th className="px-4 py-2.5 font-semibold">الحالة</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => {
                const el = elevators.find((e) => e.id === w.elevatorId);
                return (
                  <tr key={w.id} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5"><Link to={`/work-orders/${w.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">{w.woNo}</Link></td>
                    <td className="px-4 py-2.5">{w.type}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{el?.assetNo ?? "—"}</td>
                    <td className="px-4 py-2.5"><div className="font-medium">{w.customer}</div><div className="text-[11px] text-ink-faint">{w.site}</div></td>
                    <td className="tnum px-4 py-2.5 text-ink-soft">{w.scheduledAt}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{w.technicians.map((tt) => tt.name).join("، ")}</td>
                    <td className="px-4 py-2.5"><Badge value={w.priority} /></td>
                    <td className="px-4 py-2.5"><Badge value={w.status} /></td>
                    <td className="px-4 py-2.5"><button onClick={() => del(w)} className="rounded-md p-1.5 text-ink-faint hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" aria-label="حذف"><Trash2 size={14} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-2 text-xs text-ink-faint">الإجمالي: {rows.length}</p>
      {adding && <NewWO onClose={() => setAdding(false)} />}
    </div>
  );
}
