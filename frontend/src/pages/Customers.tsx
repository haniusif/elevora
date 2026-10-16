import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Building2, User } from "lucide-react";
import { Card, PageHeader, Btn, Modal, Field, TextInput, Select, FormGrid, toast, cx } from "../lib/ui";
import { useDB, create, update, remove, nextNumId } from "../api/store";
import type { Customer } from "../data/seed";

const empty = (): Customer => ({
  id: 0, code: "", type: "individual", name: "", phone: "", vat: "", nationalId: "",
  city: "الرياض", district: "", sites: 1, elevators: 1,
});

function CustomerForm({ init, onClose }: { init: Customer; onClose: () => void }) {
  const isNew = init.id === 0;
  const [f, setF] = useState<Customer>(init);
  const set = (k: keyof Customer, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const save = () => {
    if (!f.name) return toast("أدخل اسم العميل", "err");
    if (isNew) {
      const id = nextNumId("customers", 2000);
      create("customers", { ...f, id, code: f.code || `C-${id}` });
      toast("تم إضافة العميل");
    } else {
      update("customers", f.id, f);
      toast("تم حفظ التعديلات");
    }
    onClose();
  };
  return (
    <Modal title={isNew ? "عميل جديد" : `تعديل ${f.name}`} onClose={onClose}
      footer={<><Btn variant="primary" onClick={save}>حفظ</Btn><Btn variant="outline" onClick={onClose}>إلغاء</Btn></>}>
      <FormGrid>
        <Field label="اسم العميل" full><TextInput value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="النوع">
          <Select value={f.type} onChange={(e) => set("type", e.target.value)}>
            <option value="individual">فرد</option><option value="company">شركة</option>
          </Select>
        </Field>
        <Field label="رقم الجوال"><TextInput value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        {f.type === "company"
          ? <Field label="الرقم الضريبي"><TextInput value={f.vat} onChange={(e) => set("vat", e.target.value)} /></Field>
          : <Field label="السجل المدني"><TextInput value={f.nationalId} onChange={(e) => set("nationalId", e.target.value)} /></Field>}
        <Field label="المدينة"><TextInput value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
        <Field label="الحي / الموقع"><TextInput value={f.district} onChange={(e) => set("district", e.target.value)} /></Field>
        <Field label="عدد المواقع"><TextInput type="number" value={f.sites} onChange={(e) => set("sites", +e.target.value)} /></Field>
        <Field label="عدد المصاعد"><TextInput type="number" value={f.elevators} onChange={(e) => set("elevators", +e.target.value)} /></Field>
      </FormGrid>
    </Modal>
  );
}

export default function Customers() {
  const customers = useDB((d) => d.customers);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const rows = useMemo(
    () => customers.filter((c) => !q || [c.name, c.code, c.district, c.phone].some((x) => (x ?? "").toLowerCase().includes(q.toLowerCase()))),
    [customers, q]
  );
  const del = (c: Customer) => { if (window.confirm(`حذف العميل ${c.name}؟`)) { remove("customers", c.id); toast("تم الحذف"); } };

  return (
    <div>
      <PageHeader title="العملاء" subtitle={`${customers.length} عميل — أفراد وشركات`}
        actions={<Btn variant="primary" onClick={() => setEditing(empty())}><Plus size={15} /> عميل جديد</Btn>} />

      <Card className="mb-4 p-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث: الاسم، الرمز، الحي، الجوال…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" />
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink-faint dark:bg-slate-800/60">
              <tr className="text-right">
                <th className="px-4 py-2.5 font-semibold">الرمز</th><th className="px-4 py-2.5 font-semibold">العميل</th>
                <th className="px-4 py-2.5 font-semibold">النوع</th><th className="px-4 py-2.5 font-semibold">الجوال</th>
                <th className="px-4 py-2.5 font-semibold">الحي</th><th className="px-4 py-2.5 font-semibold">المواقع</th>
                <th className="px-4 py-2.5 font-semibold">المصاعد</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-2.5"><Link to={`/customers/${c.id}`} className="font-medium text-brand-600 hover:underline dark:text-brand-300">{c.name}</Link></td>
                  <td className="px-4 py-2.5">
                    <span className={cx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", c.type === "company" ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" : "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300")}>
                      {c.type === "company" ? <Building2 size={12} /> : <User size={12} />}{c.type === "company" ? "شركة" : "فرد"}
                    </span>
                  </td>
                  <td className="tnum px-4 py-2.5 text-ink-soft">{c.phone}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{c.district}</td>
                  <td className="tnum px-4 py-2.5">{c.sites}</td>
                  <td className="tnum px-4 py-2.5">{c.elevators}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(c)} className="rounded-md p-1.5 text-ink-faint hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"><Pencil size={14} /></button>
                      <button onClick={() => del(c)} className="rounded-md p-1.5 text-ink-faint hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-2 text-xs text-ink-faint">الإجمالي: {rows.length}</p>
      {editing && <CustomerForm init={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
