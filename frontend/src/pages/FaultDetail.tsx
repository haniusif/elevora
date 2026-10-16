import { Link, useParams } from "react-router-dom";
import { ArrowRight, Clock, MessageSquare, Lock, Wrench, CheckCircle2 } from "lucide-react";
import { Card, Badge, Btn } from "../lib/ui";
import { faults, elevators } from "../data/mock";

export default function FaultDetail() {
  const { id } = useParams();
  const f = faults.find((x) => x.id === id);
  if (!f) return <div>غير موجود</div>;
  const el = elevators.find((e) => e.id === f.elevatorId)!;

  return (
    <div>
      <Link to="/faults" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-brand-600">
        <ArrowRight size={15} /> رجوع إلى البلاغات
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold">{f.ticketNo}</h1>
            <Badge value={f.priority} />
            <Badge value={f.status} />
          </div>
          <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">
            {f.fault} · <Link to={`/elevators/${el.id}`} className="font-mono text-brand-600 hover:underline">{el.assetNo}</Link> · {f.customer} · {f.site}
          </p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline"><Wrench size={15} /> إنشاء أمر إصلاح</Btn>
          <Btn variant="primary"><CheckCircle2 size={15} /> حل البلاغ</Btn>
        </div>
      </div>

      {/* SLA banner */}
      <Card className={"mb-4 p-4 " + (f.slaDueMins < 0 ? "border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10" : "")}>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2 font-semibold"><Clock size={16} className={f.slaDueMins < 0 ? "text-rose-500" : "text-brand-500"} /> حالة SLA</div>
          {[["الاستجابة", "متحقق", "ok"], ["الوصول", f.slaDueMins < 0 ? "متأخر" : "متحقق", f.slaDueMins < 0 ? "crit" : "ok"], ["الإصلاح", f.slaDueMins < 0 ? `خرق ${Math.abs(f.slaDueMins)}د` : `متبقٍ ${f.slaDueMins}د`, f.slaDueMins < 0 ? "crit" : "info"]].map(([k, v, t]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-ink-faint">{k}:</span>
              <Badge value={t as string} label={v as string} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Timeline */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold">المسار الزمني</h3>
          <ol className="relative mr-3 space-y-4 border-r-2 border-slate-100 pr-5 dark:border-slate-800">
            {f.timeline.map((t, i) => (
              <li key={i} className="relative">
                <span className="absolute -right-[31px] grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white ring-2 ring-white dark:ring-slate-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t.label}</span>
                  <span className="tnum text-xs text-ink-faint">{t.at}</span>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><MessageSquare size={15} className="text-ink-faint" /> التعليقات</h4>
            {f.comments.length ? (
              <ul className="space-y-2">
                {f.comments.map((c, i) => (
                  <li key={i} className={"rounded-lg p-2.5 text-sm " + (c.visibility === "internal" ? "bg-slate-50 dark:bg-slate-800/50" : "bg-brand-50 dark:bg-brand-500/10")}>
                    <div className="mb-0.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold">
                        {c.by}
                        {c.visibility === "internal"
                          ? <span className="flex items-center gap-0.5 text-ink-faint"><Lock size={10} /> داخلي</span>
                          : <span className="text-brand-600">مرئي للعميل</span>}
                      </span>
                      <span className="tnum text-xs text-ink-faint">{c.at}</span>
                    </div>
                    {c.body}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-faint">لا توجد تعليقات.</p>
            )}
            <div className="mt-2 flex gap-2">
              <input placeholder="أضف تعليقاً…" className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" />
              <Btn variant="primary">إرسال</Btn>
            </div>
          </div>
        </Card>

        {/* Side info */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">تفاصيل البلاغ</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-faint">وقت البلاغ</dt><dd className="tnum">{f.reportedAt}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-faint">الفني</dt><dd>{f.tech}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-faint">المصعد</dt><dd className="font-mono text-xs">{el.assetNo}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-faint">العميل</dt><dd>{f.customer}</dd></div>
            </dl>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">تأكيد الإغلاق</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                <span className="text-ink-faint">رمز تأكيد العميل</span>
                <span className="tnum font-semibold">{f.status === "resolved" ? "4821" : "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                <span className="text-ink-faint">رمز تأكيد الفني</span>
                <span className="tnum font-semibold">{f.status === "resolved" ? "7390" : "—"}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
