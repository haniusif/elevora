import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Card, PageHeader, Badge, Btn, cx, Modal, Field, TextInput, Select, FormGrid, toast } from "../lib/ui";
import { useDB, create, update, remove, nextNumId } from "../api/store";
import { contractStatusAr, type Contract, type ContractStatus } from "../data/seed";

const filters: (ContractStatus | "all")[] = ["all", "active", "renewal_due", "expired", "draft", "suspended"];

const empty = (): Contract => ({
  id: 0, contractNo: "", customer: "", cover: "non_comprehensive", status: "draft",
  elevators: 1, value: 1200, startDate: "", endDate: "", visitsTotal: 12, visitEveryDays: 30, zone: "", tech: "",
});

function ContractForm({ init, onClose }: { init: Contract; onClose: () => void }) {
  const isNew = init.id === 0;
  const customers = useDB((d) => d.customers);
  const [f, setF] = useState<Contract>(init);
  const set = (k: keyof Contract, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const save = () => {
    if (!f.customer) return toast("اختر العميل", "err");
    if (isNew) {
      const id = nextNumId("contracts", 900);
      create("contracts", { ...f, id, contractNo: f.contractNo || String(id) });
      toast("تم إنشاء العقد");
    } else {
      update("contracts", f.id, f);
      toast("تم حفظ التعديلات");
    }
    onClose();
  };
  return (
    <Modal title={isNew ? "عقد صيانة جديد" : `تعديل عقد ${f.contractNo}`} onClose={onClose} wide
      footer={<><Btn variant="primary" onClick={save}>حفظ</Btn><Btn variant="outline" onClick={onClose}>إلغاء</Btn></>}>
      <FormGrid>
        <Field label="العميل" full>
          <Select value={f.customer} onChange={(e) => set("customer", e.target.value)}>
            <option value="">— اختر —</option>
            {customers.map((c) => <option key={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="نوع التغطية">
          <Select value={f.cover} onChange={(e) => set("cover", e.target.value)}>
            <option value="comprehensive">شامل</option><option value="non_comprehensive">غير شامل</option>
          </Select>
        </Field>
        <Field label="الحالة">
          <Select value={f.status} onChange={(e) => set("status", e.target.value as ContractStatus)}>
            {(["draft", "active", "renewal_due", "expired", "suspended"] as ContractStatus[]).map((s) => <option key={s} value={s}>{contractStatusAr[s]}</option>)}
          </Select>
        </Field>
        <Field label="عدد المصاعد"><TextInput type="number" value={f.elevators} onChange={(e) => set("elevators", +e.target.value)} /></Field>
        <Field label="قيمة العقد (ر.س)"><TextInput type="number" value={f.value} onChange={(e) => set("value", +e.target.value)} /></Field>
        <Field label="تاريخ البداية"><TextInput type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
        <Field label="تاريخ النهاية"><TextInput type="date" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
        <Field label="عدد الزيارات"><TextInput type="number" value={f.visitsTotal} onChange={(e) => set("visitsTotal", +e.target.value)} /></Field>
        <Field label="زيارة كل (يوم)"><TextInput type="number" value={f.visitEveryDays} onChange={(e) => set("visitEveryDays", +e.target.value)} /></Field>
        <Field label="منطقة الصيانة"><TextInput value={f.zone} onChange={(e) => set("zone", e.target.value)} /></Field>
        <Field label="فني الصيانة"><TextInput value={f.tech} onChange={(e) => set("tech", e.target.value)} /></Field>
      </FormGrid>
    </Modal>
  );
}

export default function Contracts() {
  const contracts = useDB((d) => d.contracts);
  const [status, setStatus] = useState<(typeof filters)[number]>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Contract | null>(null);

  const rows = useMemo(
    () => contracts.filter((k) => (status === "all" || k.status === status) && (!q || [k.contractNo, k.customer, k.zone].some((x) => x.includes(q)))),
    [contracts, status, q]
  );
  const del = (k: Contract) => { if (window.confirm(`حذف العقد ${k.contractNo}؟`)) { remove("contracts", k.id); toast("تم الحذف"); } };
  const renew = (k: Contract) => { update("contracts", k.id, { status: "active" }); toast(`تم تجديد العقد ${k.contractNo}`); };

  return (
    <div>
      <PageHeader title="العقود و SLA" subtitle={`${contracts.length} عقد صيانة — شامل / غير شامل، بمستويات خدمة`}
        actions={<Btn variant="primary" onClick={() => setEditing(empty())}><Plus size={15} /> عقد جديد</Btn>} />

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث: رقم العقد، العميل، المنطقة…"
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" />
          <div className="flex flex-wrap items-center gap-1 text-sm">
            {filters.map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={cx("rounded-lg px-2.5 py-1 text-xs font-medium transition", status === s ? "bg-brand-500 text-white" : "text-ink-soft hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")}>
                {s === "all" ? "الكل" : contractStatusAr[s]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink-faint dark:bg-slate-800/60">
              <tr className="text-right">
                <th className="px-4 py-2.5 font-semibold">رقم العقد</th><th className="px-4 py-2.5 font-semibold">العميل</th>
                <th className="px-4 py-2.5 font-semibold">التغطية</th><th className="px-4 py-2.5 font-semibold">المصاعد</th>
                <th className="px-4 py-2.5 font-semibold">القيمة</th><th className="px-4 py-2.5 font-semibold">يبدأ</th>
                <th className="px-4 py-2.5 font-semibold">ينتهي</th><th className="px-4 py-2.5 font-semibold">الزيارات</th>
                <th className="px-4 py-2.5 font-semibold">الحالة</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((k) => (
                <tr key={k.id} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5"><Link to={`/contracts/${k.id}`} className="tnum font-semibold text-brand-600 hover:underline dark:text-brand-300">{k.contractNo}</Link></td>
                  <td className="px-4 py-2.5 font-medium">{k.customer}</td>
                  <td className="px-4 py-2.5"><Badge value={k.cover} /></td>
                  <td className="tnum px-4 py-2.5">{k.elevators}</td>
                  <td className="tnum px-4 py-2.5">{k.value.toLocaleString()}</td>
                  <td className="tnum px-4 py-2.5 text-ink-soft">{k.startDate}</td>
                  <td className="tnum px-4 py-2.5 text-ink-soft">{k.endDate}</td>
                  <td className="tnum px-4 py-2.5">{k.visitsTotal}/{k.visitEveryDays}ي</td>
                  <td className="px-4 py-2.5"><Badge value={k.status} label={contractStatusAr[k.status]} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {(k.status === "renewal_due" || k.status === "expired") && (
                        <button onClick={() => renew(k)} className="rounded-md p-1.5 text-ink-faint hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10" title="تجديد"><RefreshCw size={14} /></button>
                      )}
                      <button onClick={() => setEditing(k)} className="rounded-md p-1.5 text-ink-faint hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"><Pencil size={14} /></button>
                      <button onClick={() => del(k)} className="rounded-md p-1.5 text-ink-faint hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-2 text-xs text-ink-faint">الإجمالي: {rows.length}</p>
      {editing && <ContractForm init={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
