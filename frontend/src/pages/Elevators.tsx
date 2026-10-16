import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QrCode, Filter, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, PageHeader, Badge, Btn, cx, Modal, Field, TextInput, Select, FormGrid, toast } from "../lib/ui";
import { statusAr, type Elevator, type AssetStatus } from "../data/mock";
import { useDB, create, update, remove, nextNumId } from "../api/store";
import { useAuth } from "../auth";

const statuses = ["all", "active", "under_maintenance", "out_of_service"] as const;

const empty = (): Elevator => ({
  id: 0, assetNo: "", qr: "", brand: "", model: "", type: "ركاب أوتوماتيك",
  capacityKg: 630, speed: 1.0, stops: 4, drive: "Gearless", doorType: "أوتوماتيك",
  status: "active", customer: "", customerType: "سكني", site: "", building: "",
  contractNo: "", cover: "non_comprehensive", maintenanceTech: "", commissioned: "", warrantyEnd: "",
});

function ElevatorForm({ init, onClose }: { init: Elevator; onClose: () => void }) {
  const isNew = init.id === 0;
  const [f, setF] = useState<Elevator>(init);
  const set = (k: keyof Elevator, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const save = () => {
    if (!f.customer || !f.site) return toast("أدخل اسم العميل والموقع", "err");
    if (isNew) {
      const id = nextNumId("elevators");
      create("elevators", { ...f, id, assetNo: f.assetNo || `LFT-${id}`, qr: f.qr || `QR-${id}` });
      toast("تم إضافة الأصل");
    } else {
      update("elevators", f.id, f);
      toast("تم حفظ التعديلات");
    }
    onClose();
  };
  return (
    <Modal
      title={isNew ? "إضافة مصعد (أصل جديد)" : `تعديل ${f.assetNo}`}
      onClose={onClose}
      wide
      footer={<><Btn variant="primary" onClick={save}>حفظ</Btn><Btn variant="outline" onClick={onClose}>إلغاء</Btn></>}
    >
      <FormGrid>
        <Field label="اسم العميل"><TextInput value={f.customer} onChange={(e) => set("customer", e.target.value)} /></Field>
        <Field label="نوع العميل">
          <Select value={f.customerType} onChange={(e) => set("customerType", e.target.value)}>
            <option value="سكني">سكني</option><option value="تجاري">تجاري</option>
          </Select>
        </Field>
        <Field label="الموقع (الحي)"><TextInput value={f.site} onChange={(e) => set("site", e.target.value)} /></Field>
        <Field label="المبنى"><TextInput value={f.building} onChange={(e) => set("building", e.target.value)} /></Field>
        <Field label="الماركة"><TextInput value={f.brand} onChange={(e) => set("brand", e.target.value)} /></Field>
        <Field label="الموديل"><TextInput value={f.model} onChange={(e) => set("model", e.target.value)} /></Field>
        <Field label="النوع"><TextInput value={f.type} onChange={(e) => set("type", e.target.value)} /></Field>
        <Field label="نوع الماكينة">
          <Select value={f.drive} onChange={(e) => set("drive", e.target.value)}>
            <option>Gearless</option><option>Geared</option><option>Hydraulic</option>
          </Select>
        </Field>
        <Field label="الحمولة (كجم)"><TextInput type="number" value={f.capacityKg} onChange={(e) => set("capacityKg", +e.target.value)} /></Field>
        <Field label="عدد الوقفات"><TextInput type="number" value={f.stops} onChange={(e) => set("stops", +e.target.value)} /></Field>
        <Field label="السرعة (م/ث)"><TextInput type="number" step="0.1" value={f.speed} onChange={(e) => set("speed", +e.target.value)} /></Field>
        <Field label="نوع الباب"><TextInput value={f.doorType} onChange={(e) => set("doorType", e.target.value)} /></Field>
        <Field label="رقم العقد"><TextInput value={f.contractNo} onChange={(e) => set("contractNo", e.target.value)} /></Field>
        <Field label="نوع التغطية">
          <Select value={f.cover} onChange={(e) => set("cover", e.target.value)}>
            <option value="comprehensive">شامل</option><option value="non_comprehensive">غير شامل</option>
          </Select>
        </Field>
        <Field label="فني الصيانة"><TextInput value={f.maintenanceTech} onChange={(e) => set("maintenanceTech", e.target.value)} /></Field>
        <Field label="الحالة">
          <Select value={f.status} onChange={(e) => set("status", e.target.value as AssetStatus)}>
            <option value="active">يعمل</option><option value="under_maintenance">تحت الصيانة</option>
            <option value="out_of_service">خارج الخدمة</option><option value="decommissioned">مستبعد</option>
          </Select>
        </Field>
        <Field label="تاريخ التشغيل"><TextInput type="date" value={f.commissioned} onChange={(e) => set("commissioned", e.target.value)} /></Field>
        <Field label="انتهاء الضمان"><TextInput type="date" value={f.warrantyEnd} onChange={(e) => set("warrantyEnd", e.target.value)} /></Field>
      </FormGrid>
    </Modal>
  );
}

export default function Elevators() {
  const { can } = useAuth();
  const elevators = useDB((d) => d.elevators);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [editing, setEditing] = useState<Elevator | null>(null);

  const rows = useMemo(
    () =>
      elevators.filter((e) => {
        const okS = status === "all" || e.status === status;
        const okQ = !q || [e.assetNo, e.customer, e.site, e.brand, e.model, String(e.id)].some((f) => f.toLowerCase().includes(q.toLowerCase()));
        return okS && okQ;
      }),
    [elevators, q, status]
  );

  const del = (e: Elevator) => {
    if (window.confirm(`حذف الأصل ${e.assetNo}؟`)) {
      remove("elevators", e.id);
      toast("تم حذف الأصل");
    }
  };

  return (
    <div>
      <PageHeader
        title="المصاعد (سجل الأصول)"
        subtitle={`${elevators.length} مصعد · كل مصعد أصل مُدار بسجل كامل عبر العقود`}
        actions={
          <>
            <Btn variant="outline"><QrCode size={15} /> مسح QR</Btn>
            {can("elevators", "create") && <Btn variant="primary" onClick={() => setEditing(empty())}><Plus size={15} /> أصل جديد</Btn>}
          </>
        }
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث: رقم الأصل، العميل، الموقع، الماركة…"
            className="min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" />
          <div className="flex items-center gap-1 text-sm">
            <Filter size={14} className="text-ink-faint" />
            {statuses.map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={cx("rounded-lg px-2.5 py-1 text-xs font-medium transition", status === s ? "bg-brand-500 text-white" : "text-ink-soft hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")}>
                {s === "all" ? "الكل" : statusAr[s]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink-faint dark:bg-slate-800/60">
              <tr className="text-right">
                <th className="px-4 py-2.5 font-semibold">رقم الأصل</th>
                <th className="px-4 py-2.5 font-semibold">العميل</th>
                <th className="px-4 py-2.5 font-semibold">الموقع</th>
                <th className="px-4 py-2.5 font-semibold">الماركة / الموديل</th>
                <th className="px-4 py-2.5 font-semibold">الوقفات</th>
                <th className="px-4 py-2.5 font-semibold">العقد</th>
                <th className="px-4 py-2.5 font-semibold">الحالة</th>
                <th className="px-4 py-2.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5"><Link to={`/elevators/${e.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">{e.assetNo}</Link></td>
                  <td className="px-4 py-2.5"><div className="font-medium">{e.customer}</div><div className="text-[11px] text-ink-faint">{e.customerType}</div></td>
                  <td className="px-4 py-2.5 text-ink-soft">{e.site}</td>
                  <td className="px-4 py-2.5">{e.brand} · <span className="text-ink-faint">{e.model}</span></td>
                  <td className="tnum px-4 py-2.5">{e.stops}</td>
                  <td className="tnum px-4 py-2.5">{e.contractNo} <Badge value={e.cover} /></td>
                  <td className="px-4 py-2.5"><Badge value={e.status} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      {can("elevators", "edit") && <button onClick={() => setEditing(e)} className="rounded-md p-1.5 text-ink-faint hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800" aria-label="تعديل"><Pencil size={14} /></button>}
                      {can("elevators", "delete") && <button onClick={() => del(e)} className="rounded-md p-1.5 text-ink-faint hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" aria-label="حذف"><Trash2 size={14} /></button>}
                      {!can("elevators", "edit") && !can("elevators", "delete") && <span className="text-xs text-ink-faint">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-ink-faint">لا توجد نتائج مطابقة</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-2 text-xs text-ink-faint">الإجمالي: {rows.length} من {elevators.length}</p>

      {editing && <ElevatorForm init={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
