import { Link, useParams } from "react-router-dom";
import { ArrowRight, CalendarClock, MapPin, User, Wrench, Plus, Trash2 } from "lucide-react";
import { Card, Badge, Stat, Btn, cx, toast } from "../lib/ui";
import { useDB, update } from "../api/store";
import { contractStatusAr, defaultBilling, type BillingLine } from "../data/seed";

const billStatusCls: Record<BillingLine["status"], string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  invoiced: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300",
};
const billStatusAr: Record<BillingLine["status"], string> = { paid: "مدفوعة", invoiced: "صادرة", pending: "مجدولة" };
const nextStatus: Record<BillingLine["status"], BillingLine["status"]> = { pending: "invoiced", invoiced: "paid", paid: "pending" };

export default function ContractDetail() {
  const { id } = useParams();
  const contracts = useDB((d) => d.contracts);
  const elevators = useDB((d) => d.elevators);
  const k = contracts.find((x) => x.id === Number(id));
  if (!k) return <div className="text-ink-faint">غير موجود</div>;
  const covered = elevators.filter((e) => e.contractNo === k.contractNo);

  const billing = k.billing ?? defaultBilling(k.value);
  const persist = (next: BillingLine[]) => update("contracts", k.id, { billing: next });
  const setLine = (i: number, patch: Partial<BillingLine>) => persist(billing.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const addLine = () => persist([...billing, { seq: billing.length + 1, type: "fixed", label: `دفعة ${billing.length + 1}`, amount: 0, status: "pending" }]);
  const delLine = (i: number) => persist(billing.filter((_, idx) => idx !== i).map((b, idx) => ({ ...b, seq: idx + 1 })));
  const cycle = (i: number) => { setLine(i, { status: nextStatus[billing[i].status] }); toast("تم تحديث حالة الدفعة"); };

  const total = billing.reduce((s, b) => s + b.amount, 0);
  const paid = billing.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0);
  const outstanding = total - paid;

  return (
    <div>
      <Link to="/contracts" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-brand-600">
        <ArrowRight size={15} /> رجوع إلى العقود
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">عقد {k.contractNo}</h1>
            <Badge value={k.cover} />
            <Badge value={k.status} label={contractStatusAr[k.status]} />
          </div>
          <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">{k.customer} · {k.zone}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="قيمة العقد" value={`${k.value.toLocaleString()}`} hint="ر.س" />
        <Stat label="المصاعد المغطّاة" value={k.elevators} tone="info" />
        <Stat label="المحصّل" value={paid.toLocaleString()} tone="ok" hint="ر.س" />
        <Stat label="المتبقّي" value={outstanding.toLocaleString()} tone={outstanding > 0 ? "warn" : "ok"} hint="ر.س" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">تفاصيل العقد و SLA</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-ink-faint"><User size={14} /> العميل</dt><dd>{k.customer}</dd></div>
            <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-ink-faint"><CalendarClock size={14} /> المدة</dt><dd className="tnum">{k.startDate} ← {k.endDate}</dd></div>
            <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-ink-faint"><MapPin size={14} /> المنطقة</dt><dd>{k.zone}</dd></div>
            <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-ink-faint"><Wrench size={14} /> الفني</dt><dd>{k.tech}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-ink-faint">الزيارات</dt><dd className="tnum">{k.visitsTotal} / كل {k.visitEveryDays} يوم</dd></div>
          </dl>
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-ink-soft dark:bg-slate-800/50">
            SLA: استجابة خلال 4 ساعات · وصول خلال 24 ساعة · إصلاح خلال 72 ساعة (مثال).
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">المصاعد المغطّاة ({covered.length})</h3>
            {covered.length ? (
              <div className="space-y-1.5">
                {covered.map((e) => (
                  <Link key={e.id} to={`/elevators/${e.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-300">{e.assetNo}</span>
                    <span className="text-ink-soft">{e.brand} {e.model} · {e.site}</span>
                    <Badge value={e.status} />
                  </Link>
                ))}
              </div>
            ) : <p className="text-sm text-ink-faint">لا توجد مصاعد مرتبطة برقم هذا العقد في البيانات التجريبية.</p>}
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">جدول الدفعات</h3>
              <button onClick={addLine} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10"><Plus size={13} /> إضافة دفعة</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] text-sm">
                <thead className="text-xs text-ink-faint">
                  <tr className="text-right"><th className="py-1 font-medium">الدفعة</th><th className="py-1 font-medium">المبلغ (ر.س)</th><th className="py-1 font-medium">الحالة</th><th></th></tr>
                </thead>
                <tbody>
                  {billing.map((b, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-1.5">
                        <input value={b.label} onChange={(e) => setLine(i, { label: e.target.value })}
                          className="w-28 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm outline-none hover:border-slate-200 focus:border-brand-400 dark:hover:border-slate-700" />
                      </td>
                      <td className="py-1.5">
                        <input type="number" value={b.amount} onChange={(e) => setLine(i, { amount: +e.target.value })}
                          className="tnum w-24 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" />
                      </td>
                      <td className="py-1.5">
                        <button onClick={() => cycle(i)} title="اضغط لتغيير الحالة" className={cx("rounded-md px-2 py-0.5 text-xs font-medium", billStatusCls[b.status])}>{billStatusAr[b.status]}</button>
                      </td>
                      <td className="py-1.5"><button onClick={() => delLine(i)} className="rounded p-1 text-ink-faint hover:text-rose-600" aria-label="حذف"><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-200 font-semibold dark:border-slate-700">
                    <td className="py-1.5">الإجمالي</td>
                    <td className="tnum py-1.5">{total.toLocaleString()}</td>
                    <td className="py-1.5 text-xs font-normal text-ink-faint" colSpan={2}>محصّل {paid.toLocaleString()} · متبقٍ {outstanding.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-ink-faint">عدّل المبالغ والمسميات مباشرة؛ اضغط على الحالة لتدويرها (مجدولة ← صادرة ← مدفوعة).</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
