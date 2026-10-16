import { Link, useParams } from "react-router-dom";
import { ArrowRight, MapPin, Clock, Check, X, Minus, Camera, PenTool, Package } from "lucide-react";
import { Card, Badge, Btn } from "../lib/ui";
import { workOrders, elevators, woChecklistSample } from "../data/mock";

const flow = ["scheduled", "assigned", "en_route", "started", "completed", "customer_signed", "supervisor_approved", "closed"];
const flowAr: Record<string, string> = {
  scheduled: "مجدول", assigned: "مُسند", en_route: "في الطريق", started: "بدأ",
  completed: "مكتمل", customer_signed: "توقيع العميل", supervisor_approved: "اعتماد المشرف", closed: "مغلق",
};

export default function WorkOrderDetail() {
  const { id } = useParams();
  const w = workOrders.find((x) => x.id === id);
  if (!w) return <div>غير موجود</div>;
  const el = elevators.find((e) => e.id === w.elevatorId)!;
  const curIdx = Math.max(0, flow.indexOf(w.status));

  return (
    <div>
      <Link to="/work-orders" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-brand-600">
        <ArrowRight size={15} /> رجوع إلى أوامر العمل
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold">{w.woNo}</h1>
            <Badge value={w.status} />
            <Badge value={w.priority} />
          </div>
          <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">
            {w.type} · <Link to={`/elevators/${el.id}`} className="font-mono text-brand-600 hover:underline">{el.assetNo}</Link> · {w.customer} · {w.site}
          </p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline"><MapPin size={15} /> الموقع</Btn>
          <Btn variant="primary"><Check size={15} /> اعتماد</Btn>
        </div>
      </div>

      {/* Status flow */}
      <Card className="mb-4 p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {flow.map((s, i) => (
            <div key={s} className="flex shrink-0 items-center">
              <div className={"flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium " +
                (i <= curIdx ? "bg-brand-500 text-white" : "bg-slate-100 text-ink-faint dark:bg-slate-800")}>
                {i < curIdx && <Check size={12} />} {flowAr[s]}
              </div>
              {i < flow.length - 1 && <div className={"h-0.5 w-5 " + (i < curIdx ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-800")} />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">التفاصيل</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-faint">الموعد</dt><dd className="tnum">{w.scheduledAt}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-faint">نوع العمل</dt><dd>{w.type}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-faint">المصعد</dt><dd className="font-mono text-xs">{el.assetNo}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-faint">تكلفة الأمر</dt><dd className="tnum">{w.cost.toLocaleString()} ر.س</dd></div>
            </dl>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">الفنيون المسندون</h3>
            <ul className="space-y-2">
              {w.technicians.map((t) => (
                <li key={t.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                      {t.name[0]}
                    </span>
                    {t.name}
                  </span>
                  <Badge value={t.role === "رئيسي" ? "active" : "normal"} label={t.role} />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Clock size={15} className="text-ink-faint" /> الحضور والموقع</h3>
            <div className="space-y-1.5 text-sm text-ink-soft">
              <div className="flex justify-between"><span>تسجيل الدخول</span><span className="tnum">{w.status === "scheduled" ? "—" : "11:34"}</span></div>
              <div className="flex justify-between"><span>تسجيل الخروج</span><span className="tnum">{w.checklistDone === w.checklistTotal && w.checklistTotal ? "12:52" : "—"}</span></div>
              <div className="flex justify-between"><span>التحقق من GPS</span><span className="text-emerald-600">{w.status === "scheduled" ? "—" : "مطابق ✓"}</span></div>
            </div>
          </Card>
        </div>

        {/* Right: checklist + parts */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">قائمة الفحص</h3>
              <span className="tnum text-xs text-ink-faint">{w.checklistDone}/{w.checklistTotal} مكتمل</span>
            </div>
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${w.checklistTotal ? (w.checklistDone / w.checklistTotal) * 100 : 0}%` }} />
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {woChecklistSample.map((c, i) => {
                const done = i < w.checklistDone;
                return (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="flex items-center gap-2">
                      {c.type === "pass_fail" && (c.result === "pass" ? <Check size={15} className="text-emerald-500" /> : <X size={15} className="text-rose-500" />)}
                      {c.type === "photo" && <Camera size={15} className="text-sky-500" />}
                      {c.type === "signature" && <PenTool size={15} className="text-brand-500" />}
                      {!["pass_fail", "photo", "signature"].includes(c.type) && <Minus size={15} className="text-ink-faint" />}
                      <span className={done ? "" : "text-ink-faint"}>{c.label}</span>
                    </span>
                    <span className="text-xs text-ink-faint">
                      {c.type === "measurement" ? `${c.value} ${c.unit}` : c.type === "pass_fail" ? (c.result === "pass" ? "ناجح" : "فاشل") : c.value}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Package size={15} className="text-amber-500" /> القطع المستهلكة</h3>
            {w.partsCount ? (
              <table className="w-full text-sm">
                <thead className="text-xs text-ink-faint"><tr className="text-right"><th className="py-1 font-medium">الصنف</th><th className="py-1 font-medium">الكمية</th><th className="py-1 font-medium">التكلفة</th></tr></thead>
                <tbody>
                  <tr className="border-t border-slate-100 dark:border-slate-800"><td className="py-1.5">حساس باب أوتوماتيك</td><td className="tnum py-1.5">1</td><td className="tnum py-1.5">{w.cost} ر.س</td></tr>
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-ink-faint">لم تُصرف قطع لهذا الأمر.</p>
            )}
            <p className="mt-2 text-[11px] text-ink-faint">القطع تُصرف من المخزون عبر حركة مخزون وتُحمّل على تكلفة الأمر.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
