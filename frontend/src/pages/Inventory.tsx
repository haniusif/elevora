import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Minus, PackagePlus, AlertTriangle } from "lucide-react";
import { Card, PageHeader, Btn, Stat, Modal, Field, TextInput, Select, FormGrid, toast, cx } from "../lib/ui";
import { useDB, create, update, remove, nextNumId } from "../api/store";
import type { Item } from "../data/seed";

const warehouses = ["المستودع الرئيسي", "مستودع الفرع", "مركبة الفني", "الموقع"];

const empty = (): Item => ({
  id: 0, sku: "", name: "", category: "قطع غيار", brand: "محلي", unit: "قطعة",
  cost: 0, price: 0, onHand: 0, reserved: 0, minStock: 0, warehouse: "المستودع الرئيسي",
});

function ItemForm({ init, onClose }: { init: Item; onClose: () => void }) {
  const isNew = init.id === 0;
  const [f, setF] = useState<Item>(init);
  const set = (k: keyof Item, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const save = () => {
    if (!f.name) return toast("أدخل اسم الصنف", "err");
    if (isNew) {
      const id = nextNumId("items", 3000);
      create("items", { ...f, id, sku: f.sku || `SP-${id}` });
      toast("تم إضافة الصنف");
    } else {
      update("items", f.id, f);
      toast("تم حفظ التعديلات");
    }
    onClose();
  };
  return (
    <Modal title={isNew ? "صنف جديد" : `تعديل ${f.name}`} onClose={onClose} wide
      footer={<><Btn variant="primary" onClick={save}>حفظ</Btn><Btn variant="outline" onClick={onClose}>إلغاء</Btn></>}>
      <FormGrid>
        <Field label="اسم الصنف" full><TextInput value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="رمز SKU"><TextInput value={f.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
        <Field label="الفئة"><TextInput value={f.category} onChange={(e) => set("category", e.target.value)} /></Field>
        <Field label="الماركة / المنشأ"><TextInput value={f.brand} onChange={(e) => set("brand", e.target.value)} /></Field>
        <Field label="الوحدة"><TextInput value={f.unit} onChange={(e) => set("unit", e.target.value)} /></Field>
        <Field label="تكلفة الشراء"><TextInput type="number" value={f.cost} onChange={(e) => set("cost", +e.target.value)} /></Field>
        <Field label="سعر البيع"><TextInput type="number" value={f.price} onChange={(e) => set("price", +e.target.value)} /></Field>
        <Field label="الكمية المتاحة"><TextInput type="number" value={f.onHand} onChange={(e) => set("onHand", +e.target.value)} /></Field>
        <Field label="المحجوز"><TextInput type="number" value={f.reserved} onChange={(e) => set("reserved", +e.target.value)} /></Field>
        <Field label="الحد الأدنى"><TextInput type="number" value={f.minStock} onChange={(e) => set("minStock", +e.target.value)} /></Field>
        <Field label="المستودع">
          <Select value={f.warehouse} onChange={(e) => set("warehouse", e.target.value)}>
            {warehouses.map((w) => <option key={w}>{w}</option>)}
          </Select>
        </Field>
      </FormGrid>
    </Modal>
  );
}

export default function Inventory() {
  const items = useDB((d) => d.items);
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  const isLow = (it: Item) => it.onHand <= it.minStock;
  const rows = useMemo(
    () => items.filter((it) => (!lowOnly || isLow(it)) && (!q || [it.name, it.sku, it.category, it.brand].some((x) => x.toLowerCase().includes(q.toLowerCase())))),
    [items, q, lowOnly]
  );
  const lowCount = items.filter(isLow).length;
  const stockValue = items.reduce((s, it) => s + it.onHand * it.cost, 0);

  const adjust = (it: Item, d: number) => {
    const next = Math.max(0, it.onHand + d);
    update("items", it.id, { onHand: next });
  };
  const del = (it: Item) => { if (window.confirm(`حذف ${it.name}؟`)) { remove("items", it.id); toast("تم الحذف"); } };

  return (
    <div>
      <PageHeader title="المخزون وقطع الغيار" subtitle="أصناف المخزون بالكميات والحد الأدنى — حركة المخزون تُحدّث المتاح"
        actions={<Btn variant="primary" onClick={() => setEditing(empty())}><Plus size={15} /> صنف جديد</Btn>} />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="عدد الأصناف" value={items.length} />
        <Stat label="أصناف تحت الحد" value={lowCount} tone={lowCount ? "warn" : "ok"} />
        <Stat label="قيمة المخزون" value={stockValue.toLocaleString()} hint="ر.س (بالتكلفة)" tone="info" />
        <Stat label="المحجوز" value={items.reduce((s, it) => s + it.reserved, 0)} />
      </div>

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث: الاسم، SKU، الفئة…"
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" />
          <button onClick={() => setLowOnly((v) => !v)}
            className={cx("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition", lowOnly ? "bg-amber-500 text-white" : "text-ink-soft hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")}>
            <AlertTriangle size={13} /> تحت الحد الأدنى فقط
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink-faint dark:bg-slate-800/60">
              <tr className="text-right">
                <th className="px-4 py-2.5 font-semibold">SKU</th><th className="px-4 py-2.5 font-semibold">الصنف</th>
                <th className="px-4 py-2.5 font-semibold">الفئة</th><th className="px-4 py-2.5 font-semibold">المستودع</th>
                <th className="px-4 py-2.5 font-semibold">التكلفة/البيع</th><th className="px-4 py-2.5 font-semibold">المتاح</th>
                <th className="px-4 py-2.5 font-semibold">الحد الأدنى</th><th className="px-4 py-2.5 font-semibold">تعديل الكمية</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => (
                <tr key={it.id} className={cx("border-t border-slate-100 dark:border-slate-800", isLow(it) ? "bg-amber-50/60 dark:bg-amber-500/5" : "hover:bg-slate-50 dark:hover:bg-slate-800/40")}>
                  <td className="px-4 py-2.5 font-mono text-xs">{it.sku}</td>
                  <td className="px-4 py-2.5 font-medium">{it.name}<div className="text-[11px] text-ink-faint">{it.brand}</div></td>
                  <td className="px-4 py-2.5 text-ink-soft">{it.category}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{it.warehouse}</td>
                  <td className="tnum px-4 py-2.5">{it.cost} / {it.price}</td>
                  <td className="tnum px-4 py-2.5">
                    <span className={cx("font-semibold", isLow(it) && "text-amber-600 dark:text-amber-400")}>{it.onHand}</span>
                    <span className="text-[11px] text-ink-faint"> {it.unit}</span>
                    {it.reserved > 0 && <div className="text-[11px] text-ink-faint">محجوز {it.reserved}</div>}
                  </td>
                  <td className="tnum px-4 py-2.5">{it.minStock}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => adjust(it, -1)} className="rounded-md border border-slate-200 p-1 text-ink-soft hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" aria-label="صرف"><Minus size={13} /></button>
                      <button onClick={() => adjust(it, 1)} className="rounded-md border border-slate-200 p-1 text-ink-soft hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" aria-label="توريد"><PackagePlus size={13} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(it)} className="rounded-md p-1.5 text-ink-faint hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"><Pencil size={14} /></button>
                      <button onClick={() => del(it)} className="rounded-md p-1.5 text-ink-faint hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-2 text-xs text-ink-faint">الإجمالي: {rows.length} من {items.length}</p>
      {editing && <ItemForm init={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
