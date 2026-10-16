import { Link, useParams } from "react-router-dom";
import { ArrowRight, CalendarClock, MapPin, User, Wrench } from "lucide-react";
import { Card, Badge, Stat } from "../lib/ui";
import { useDB } from "../api/store";
import { contractStatusAr } from "../data/seed";

export default function ContractDetail() {
  const { id } = useParams();
  const contracts = useDB((d) => d.contracts);
  const elevators = useDB((d) => d.elevators);
  const k = contracts.find((x) => x.id === Number(id));
  if (!k) return <div className="text-ink-faint">غير موجود</div>;
  const covered = elevators.filter((e) => e.contractNo === k.contractNo);

  // simple 4-installment billing schedule derived from value
  const schedule = [0.25, 0.25, 0.25, 0.25].map((p, i) => ({
    seq: i + 1,
    amount: Math.round(k.value * p),
    status: i === 0 ? "مدفوعة" : i === 1 ? "صادرة" : "مجدولة",
  }));

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
        <Stat label="عدد الزيارات" value={k.visitsTotal} />
        <Stat label="زيارة كل" value={`${k.visitEveryDays} يوم`} tone="warn" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">تفاصيل العقد و SLA</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-ink-faint"><User size={14} /> العميل</dt><dd>{k.customer}</dd></div>
            <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-ink-faint"><CalendarClock size={14} /> المدة</dt><dd className="tnum">{k.startDate} ← {k.endDate}</dd></div>
            <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-ink-faint"><MapPin size={14} /> المنطقة</dt><dd>{k.zone}</dd></div>
            <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-ink-faint"><Wrench size={14} /> الفني</dt><dd>{k.tech}</dd></div>
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
            <h3 className="mb-3 text-sm font-semibold">جدول الدفعات</h3>
            <table className="w-full text-sm">
              <thead className="text-xs text-ink-faint"><tr className="text-right"><th className="py-1 font-medium">الدفعة</th><th className="py-1 font-medium">المبلغ</th><th className="py-1 font-medium">الحالة</th></tr></thead>
              <tbody>
                {schedule.map((s) => (
                  <tr key={s.seq} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-1.5">دفعة {s.seq}</td>
                    <td className="tnum py-1.5">{s.amount.toLocaleString()} ر.س</td>
                    <td className="py-1.5">
                      <span className={
                        "rounded-md px-2 py-0.5 text-xs font-medium " +
                        (s.status === "مدفوعة" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : s.status === "صادرة" ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300")
                      }>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
