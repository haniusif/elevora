import { useRef, useState } from "react";
import type { PointerEvent as RPE } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowRight, MapPin, Clock, Check, X, Camera, PenTool, Package, Trash2, Plus, UserPlus } from "lucide-react";
import { Card, Badge, Btn, Modal, Select, TextInput, Field, FormGrid, toast, cx } from "../lib/ui";
import { defaultChecklist, type WorkOrder, type WoChecklistItem, type WoPart, type TechRole } from "../data/mock";
import { useDB, update, remove } from "../api/store";
import { useAuth } from "../auth";

const flow = ["scheduled", "assigned", "en_route", "started", "completed", "customer_signed", "supervisor_approved", "closed"];
const flowAr: Record<string, string> = {
  scheduled: "مجدول", assigned: "مُسند", en_route: "في الطريق", started: "بدأ",
  completed: "مكتمل", customer_signed: "توقيع العميل", supervisor_approved: "اعتماد المشرف", closed: "مغلق",
};
const LABOUR_RATE = 80; // ر.س/ساعة (تقديري)

// ---- Signature pad -------------------------------------------------------
function SignaturePad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const pos = (e: RPE) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };
  const down = (e: RPE) => { drawing.current = true; const ctx = ref.current!.getContext("2d")!; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move = (e: RPE) => {
    if (!drawing.current) return;
    const ctx = ref.current!.getContext("2d")!;
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#0e7c6b";
    const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke();
  };
  const up = () => { drawing.current = false; };
  const clear = () => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); };
  return (
    <div>
      <canvas
        ref={ref} width={520} height={160}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        className="w-full touch-none rounded-lg border border-dashed border-slate-300 bg-white dark:border-slate-600"
      />
      <div className="mt-2 flex gap-2">
        <Btn variant="primary" onClick={() => onSave(ref.current!.toDataURL())}>حفظ التوقيع</Btn>
        <Btn variant="outline" onClick={clear}>مسح</Btn>
      </div>
    </div>
  );
}

// ---- Parts picker --------------------------------------------------------
function PartPicker({ onAdd, onClose }: { onAdd: (p: WoPart) => void; onClose: () => void }) {
  const items = useDB((d) => d.items);
  const [itemId, setItemId] = useState(items[0]?.id ?? 0);
  const [qty, setQty] = useState(1);
  const it = items.find((x) => x.id === Number(itemId));
  const add = () => {
    if (!it) return;
    if (qty < 1) return toast("أدخل كمية صحيحة", "err");
    if (qty > it.onHand) return toast(`المتاح ${it.onHand} فقط`, "err");
    onAdd({ itemId: it.id, sku: it.sku, name: it.name, qty, unitCost: it.cost, unitPrice: it.price });
    onClose();
  };
  return (
    <Modal title="إضافة قطعة غيار" onClose={onClose} footer={<><Btn variant="primary" onClick={add}>صرف وإضافة</Btn><Btn variant="outline" onClick={onClose}>إلغاء</Btn></>}>
      <FormGrid>
        <Field label="الصنف" full>
          <Select value={itemId} onChange={(e) => setItemId(Number(e.target.value))}>
            {items.map((x) => <option key={x.id} value={x.id}>{x.name} — متاح {x.onHand} {x.unit}</option>)}
          </Select>
        </Field>
        <Field label="الكمية"><TextInput type="number" min={1} value={qty} onChange={(e) => setQty(+e.target.value)} /></Field>
        <Field label="المتاح حالياً"><TextInput value={it ? `${it.onHand} ${it.unit}` : "—"} readOnly /></Field>
      </FormGrid>
      {it && <p className="mt-3 text-xs text-ink-faint">سيتم صرف {qty} × {it.name} من المخزون وتحميلها على تكلفة الأمر.</p>}
    </Modal>
  );
}

// ---- Technician add ------------------------------------------------------
function AddTech({ onAdd, onClose }: { onAdd: (name: string, role: TechRole) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<TechRole>("مساعد");
  return (
    <Modal title="إسناد فني" onClose={onClose} footer={<><Btn variant="primary" onClick={() => { if (!name) return toast("أدخل اسم الفني", "err"); onAdd(name, role); onClose(); }}>إسناد</Btn><Btn variant="outline" onClick={onClose}>إلغاء</Btn></>}>
      <FormGrid>
        <Field label="اسم الفني"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="الدور">
          <Select value={role} onChange={(e) => setRole(e.target.value as TechRole)}>
            <option value="رئيسي">رئيسي</option><option value="مساعد">مساعد</option><option value="متدرب">متدرب</option>
          </Select>
        </Field>
      </FormGrid>
    </Modal>
  );
}

export default function WorkOrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { can } = useAuth();
  const canEdit = can("work_orders", "edit");
  const workOrders = useDB((d) => d.workOrders);
  const elevators = useDB((d) => d.elevators);
  const items = useDB((d) => d.items);
  const w = workOrders.find((x) => x.id === id);
  const el = elevators.find((e) => e.id === w?.elevatorId);
  const [picking, setPicking] = useState(false);
  const [addingTech, setAddingTech] = useState(false);
  if (!w || !el) return <div className="text-ink-faint">غير موجود</div>;

  const curIdx = Math.max(0, flow.indexOf(w.status));
  const checklist = w.checklist ?? defaultChecklist(w.type);
  const parts = w.parts ?? [];
  const partsTotal = parts.reduce((s, p) => s + p.qty * p.unitCost, 0);
  const labour = (w.labourHours ?? 0) * LABOUR_RATE;
  const done = checklist.filter((c) => c.done).length;

  const persistChecklist = (list: WoChecklistItem[], extra?: Partial<WorkOrder>) =>
    update("workOrders", w.id, { checklist: list, checklistDone: list.filter((c) => c.done).length, checklistTotal: list.length, ...extra });

  const setItem = (i: number, patch: Partial<WoChecklistItem>) =>
    persistChecklist(checklist.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const recost = (nextParts: WoPart[], hours = w.labourHours ?? 0) =>
    nextParts.reduce((s, p) => s + p.qty * p.unitCost, 0) + hours * LABOUR_RATE;

  const addPart = (p: WoPart) => {
    const it = items.find((x) => x.id === p.itemId);
    if (it) update("items", it.id, { onHand: Math.max(0, it.onHand - p.qty) });
    const next = [...parts, p];
    update("workOrders", w.id, { parts: next, partsCount: next.length, cost: recost(next) });
    toast("تم صرف القطعة");
  };
  const removePart = (idx: number) => {
    const p = parts[idx];
    const it = items.find((x) => x.id === p.itemId);
    if (it) update("items", it.id, { onHand: it.onHand + p.qty });
    const next = parts.filter((_, i) => i !== idx);
    update("workOrders", w.id, { parts: next, partsCount: next.length, cost: recost(next) });
    toast("تم إرجاع القطعة للمخزون");
  };
  const setHours = (h: number) => update("workOrders", w.id, { labourHours: h, cost: recost(parts, h) });

  const addTech = (name: string, role: TechRole) =>
    update("workOrders", w.id, { technicians: [...w.technicians, { name, role }] });
  const removeTech = (i: number) =>
    update("workOrders", w.id, { technicians: w.technicians.filter((_, idx) => idx !== i) });

  const saveSignature = (dataUrl: string) =>
    persistChecklist(checklist.map((c) => (c.type === "signature" ? { ...c, done: true, value: "تم" } : c)), {
      signatureUrl: dataUrl,
      status: curIdx < flow.indexOf("customer_signed") ? "customer_signed" : w.status,
    });

  const advance = () => {
    const next = flow[Math.min(curIdx + 1, flow.length - 1)];
    update("workOrders", w.id, { status: next as WorkOrder["status"] });
    toast(`الحالة: ${flowAr[next]}`);
  };
  const del = () => { if (window.confirm(`حذف ${w.woNo}؟`)) { remove("workOrders", w.id); nav("/work-orders"); } };

  return (
    <div>
      <Link to="/work-orders" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-brand-600">
        <ArrowRight size={15} /> رجوع إلى أوامر العمل
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold">{w.woNo}</h1>
            <Badge value={w.status} /><Badge value={w.priority} />
          </div>
          <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">
            {w.type} · <Link to={`/elevators/${el.id}`} className="font-mono text-brand-600 hover:underline">{el.assetNo}</Link> · {w.customer} · {w.site}
          </p>
        </div>
        <div className="flex gap-2">
          {can("work_orders", "delete") && <Btn variant="outline" onClick={del}><Trash2 size={15} /> حذف</Btn>}
          <Btn variant="outline"><MapPin size={15} /> الموقع</Btn>
          {canEdit && <Btn variant="primary" onClick={advance}><Check size={15} /> تقديم الحالة</Btn>}
        </div>
      </div>

      {/* Status flow */}
      <Card className="mb-4 p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {flow.map((s, i) => (
            <div key={s} className="flex shrink-0 items-center">
              <div className={cx("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", i <= curIdx ? "bg-brand-500 text-white" : "bg-slate-100 text-ink-faint dark:bg-slate-800")}>
                {i < curIdx && <Check size={12} />} {flowAr[s]}
              </div>
              {i < flow.length - 1 && <div className={cx("h-0.5 w-5", i < curIdx ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-800")} />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">التفاصيل والتكلفة</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-faint">الموعد</dt><dd className="tnum">{w.scheduledAt}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-faint">نوع العمل</dt><dd>{w.type}</dd></div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-faint">ساعات العمل</dt>
                <dd><input type="number" min={0} step="0.5" value={w.labourHours ?? 0} onChange={(e) => setHours(+e.target.value)}
                  className="tnum w-20 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" /></dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 dark:border-slate-800"><dt className="text-ink-faint">تكلفة القطع</dt><dd className="tnum">{partsTotal.toLocaleString()} ر.س</dd></div>
              <div className="flex justify-between"><dt className="text-ink-faint">تكلفة العمالة</dt><dd className="tnum">{labour.toLocaleString()} ر.س</dd></div>
              <div className="flex justify-between font-semibold"><dt>إجمالي التكلفة</dt><dd className="tnum text-brand-600 dark:text-brand-300">{(partsTotal + labour).toLocaleString()} ر.س</dd></div>
            </dl>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">الفنيون المسندون</h3>
              {canEdit && <button onClick={() => setAddingTech(true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10"><UserPlus size={13} /> إسناد</button>}
            </div>
            <ul className="space-y-2">
              {w.technicians.map((t, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">{t.name[0]}</span>
                    {t.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Badge value={t.role === "رئيسي" ? "active" : "normal"} label={t.role} />
                    <button onClick={() => removeTech(i)} className="rounded p-1 text-ink-faint hover:text-rose-600" aria-label="إزالة"><X size={13} /></button>
                  </span>
                </li>
              ))}
              {w.technicians.length === 0 && <li className="text-sm text-ink-faint">لا يوجد فنيون مسندون.</li>}
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Clock size={15} className="text-ink-faint" /> الحضور والموقع</h3>
            <div className="space-y-1.5 text-sm text-ink-soft">
              <div className="flex justify-between"><span>تسجيل الدخول</span><span className="tnum">{w.status === "scheduled" ? "—" : "11:34"}</span></div>
              <div className="flex justify-between"><span>تسجيل الخروج</span><span className="tnum">{done === checklist.length && checklist.length ? "12:52" : "—"}</span></div>
              <div className="flex justify-between"><span>التحقق من GPS</span><span className="text-emerald-600">{w.status === "scheduled" ? "—" : "مطابق ✓"}</span></div>
            </div>
          </Card>
        </div>

        {/* Right: checklist + parts + signature */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">قائمة الفحص</h3>
              <span className="tnum text-xs text-ink-faint">{done}/{checklist.length} مكتمل</span>
            </div>
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${checklist.length ? (done / checklist.length) * 100 : 0}%` }} />
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {checklist.map((c, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span className={cx("flex items-center gap-2", c.done ? "" : "text-ink-soft")}>
                    {c.done ? <Check size={15} className="text-emerald-500" /> : <span className="inline-block h-[15px] w-[15px] rounded-full border border-slate-300 dark:border-slate-600" />}
                    {c.label}{c.unit ? ` (${c.unit})` : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {c.type === "pass_fail" && (
                      <>
                        <button onClick={() => setItem(i, { result: "pass", done: true })} className={cx("rounded-md px-2 py-0.5 text-xs font-medium", c.result === "pass" ? "bg-emerald-500 text-white" : "bg-slate-100 text-ink-soft dark:bg-slate-800")}>ناجح</button>
                        <button onClick={() => setItem(i, { result: "fail", done: true })} className={cx("rounded-md px-2 py-0.5 text-xs font-medium", c.result === "fail" ? "bg-rose-500 text-white" : "bg-slate-100 text-ink-soft dark:bg-slate-800")}>فاشل</button>
                      </>
                    )}
                    {c.type === "boolean" && (
                      <button onClick={() => setItem(i, { value: c.value === "نعم" ? "لا" : "نعم", done: true })} className={cx("rounded-md px-2 py-0.5 text-xs font-medium", c.done ? "bg-brand-500 text-white" : "bg-slate-100 text-ink-soft dark:bg-slate-800")}>{c.value || "اضغط"}</button>
                    )}
                    {(c.type === "measurement" || c.type === "number" || c.type === "text") && (
                      <input value={c.value ?? ""} onChange={(e) => setItem(i, { value: e.target.value, done: !!e.target.value })} placeholder="القيمة"
                        className="tnum w-24 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" />
                    )}
                    {c.type === "photo" && (
                      <button onClick={() => setItem(i, { value: c.done ? "" : "مرفقة", done: !c.done })} className={cx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", c.done ? "bg-sky-500 text-white" : "bg-slate-100 text-ink-soft dark:bg-slate-800")}><Camera size={12} /> {c.done ? "مرفقة" : "إرفاق"}</button>
                    )}
                    {c.type === "signature" && (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-faint"><PenTool size={12} /> {c.done ? "تم" : "بالأسفل"}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><Package size={15} className="text-amber-500" /> القطع المستهلكة</h3>
              {canEdit && <button onClick={() => setPicking(true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10"><Plus size={13} /> صرف قطعة</button>}
            </div>
            {parts.length ? (
              <table className="w-full text-sm">
                <thead className="text-xs text-ink-faint"><tr className="text-right"><th className="py-1 font-medium">الصنف</th><th className="py-1 font-medium">الكمية</th><th className="py-1 font-medium">التكلفة</th><th></th></tr></thead>
                <tbody>
                  {parts.map((p, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-1.5">{p.name} <span className="font-mono text-[11px] text-ink-faint">{p.sku}</span></td>
                      <td className="tnum py-1.5">{p.qty}</td>
                      <td className="tnum py-1.5">{(p.qty * p.unitCost).toLocaleString()} ر.س</td>
                      <td className="py-1.5"><button onClick={() => removePart(i)} className="rounded p-1 text-ink-faint hover:text-rose-600" aria-label="إرجاع"><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-200 font-semibold dark:border-slate-700"><td className="py-1.5">الإجمالي</td><td></td><td className="tnum py-1.5">{partsTotal.toLocaleString()} ر.س</td><td></td></tr>
                </tbody>
              </table>
            ) : <p className="text-sm text-ink-faint">لم تُصرف قطع لهذا الأمر.</p>}
            <p className="mt-2 text-[11px] text-ink-faint">صرف القطعة يخصم من المخزون ويُحمّل على تكلفة الأمر؛ الإرجاع يعيدها للمخزون.</p>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><PenTool size={15} className="text-brand-500" /> توقيع العميل / التسليم</h3>
            {w.signatureUrl ? (
              <div>
                <img src={w.signatureUrl} alt="التوقيع" className="h-32 w-full rounded-lg border border-slate-200 bg-white object-contain dark:border-slate-700" />
                <div className="mt-2"><Btn variant="outline" onClick={() => update("workOrders", w.id, { signatureUrl: undefined })}>إعادة التوقيع</Btn></div>
              </div>
            ) : (
              <SignaturePad onSave={saveSignature} />
            )}
          </Card>
        </div>
      </div>

      {picking && <PartPicker onAdd={addPart} onClose={() => setPicking(false)} />}
      {addingTech && <AddTech onAdd={addTech} onClose={() => setAddingTech(false)} />}
    </div>
  );
}
