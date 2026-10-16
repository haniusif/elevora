import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingUp, AlertTriangle, CalendarClock } from "lucide-react";
import { Card, PageHeader, Stat, Badge } from "../lib/ui";
import { kpis, revenueTrend, costTrend, faults, elevators, workOrders, statusAr } from "../data/mock";

const months = ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"];

function TrendChart() {
  const W = 560, H = 180, pad = 28;
  const max = Math.max(...revenueTrend, ...costTrend) * 1.1;
  const x = (i: number) => pad + (i * (W - pad * 2)) / (revenueTrend.length - 1);
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const path = (arr: number[]) => arr.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const area = (arr: number[]) => `${path(arr)} L${x(arr.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="اتجاه الإيراد والتكلفة">
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line key={g} x1={pad} x2={W - pad} y1={H - pad - g * (H - pad * 2)} y2={H - pad - g * (H - pad * 2)}
          className="stroke-slate-200 dark:stroke-slate-800" strokeWidth={1} />
      ))}
      <path d={area(revenueTrend)} className="fill-brand-500/10" />
      <path d={path(revenueTrend)} className="fill-none stroke-brand-500" strokeWidth={2.5} />
      <path d={path(costTrend)} className="fill-none stroke-amber-500" strokeWidth={2} strokeDasharray="4 3" />
      {revenueTrend.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === revenueTrend.length - 1 ? 4 : 0} className="fill-brand-500" />
      ))}
      {months.map((m, i) => (
        <text key={m} x={x(i)} y={H - 8} textAnchor="middle" className="fill-slate-400 text-[9px]">{m}</text>
      ))}
    </svg>
  );
}

export default function Dashboard() {
  const pmOverdue = [
    { asset: "LFT-1003", cust: "سالم المعمر", zone: "نمار - غرب", days: -474 },
    { asset: "LFT-1115", cust: "عبدالعزيز الدغيثر", zone: "الملقا - شمال", days: -140 },
    { asset: "LFT-1083", cust: "هند السالم", zone: "لبن - غرب", days: -17 },
    { asset: "LFT-1046", cust: "عبدالله الفالح", zone: "السعادة - شرق", days: 12 },
    { asset: "LFT-1134", cust: "عمر الدرعية", zone: "الدرعية - غرب", days: 36 },
  ];
  const openFaults = faults.filter((f) => f.status !== "closed" && f.status !== "resolved").slice(0, 5);
  const today = workOrders.filter((w) => w.scheduledAt.startsWith("2026-10-16"));

  return (
    <div>
      <PageHeader
        title="لوحة المعلومات التنفيذية"
        subtitle="نظرة شاملة على الأسطول والعقود والخدمة والأداء المالي — فرع الرياض"
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="إجمالي المصاعد" value={kpis.elevators} />
        <Stat label="مصاعد تعمل" value={kpis.activeElevators} tone="ok" />
        <Stat label="خارج الخدمة" value={kpis.outOfService} tone="crit" />
        <Stat label="عقود نشطة" value={kpis.activeContracts} />
        <Stat label="عقود تنتهي قريباً" value={kpis.expiringContracts} tone="warn" />
        <Stat label="زيارات مستحقة" value={kpis.pmDue} tone="warn" hint={`منها ${kpis.pmOverdue} متأخرة`} />
        <Stat label="بلاغات مفتوحة" value={kpis.openTickets} tone="info" />
        <Stat label="بلاغات حرجة" value={kpis.criticalTickets} tone="crit" />
        <Stat label="خروقات SLA" value={kpis.slaBreaches} tone="crit" />
        <Stat label="فنيون متاحون" value={kpis.techsAvailable} tone="ok" />
        <Stat label="أوامر عمل اليوم" value={kpis.woToday} />
        <Stat label="أصناف منخفضة" value={kpis.lowStock} tone="warn" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Trend chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold"><TrendingUp size={17} className="text-brand-500" /> الإيراد مقابل التكلفة (ألف ريال)</div>
            <div className="flex items-center gap-4 text-xs text-ink-soft">
              <span className="flex items-center gap-1.5"><i className="h-2 w-3 rounded bg-brand-500" /> الإيراد</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-3 rounded bg-amber-500" /> التكلفة</span>
            </div>
          </div>
          <TrendChart />
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
            <div>الربح الإجمالي للشهر: <b className="tnum text-brand-600 dark:text-brand-300">{(kpis.monthlyRevenue - kpis.monthlyCost).toLocaleString()} ر.س</b></div>
            <div className="text-ink-faint">هامش {Math.round(((kpis.monthlyRevenue - kpis.monthlyCost) / kpis.monthlyRevenue) * 100)}%</div>
          </div>
        </Card>

        {/* Open faults */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={17} className="text-rose-500" /> بلاغات مفتوحة</div>
            <Link to="/faults" className="text-xs font-medium text-brand-600 hover:underline">عرض الكل</Link>
          </div>
          <ul className="space-y-2">
            {openFaults.map((f) => (
              <li key={f.id}>
                <Link to={`/faults/${f.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{f.fault}</div>
                    <div className="text-xs text-ink-faint">{f.ticketNo} · {f.site}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {f.slaDueMins < 0 ? <span className="tnum text-xs font-semibold text-rose-600">متأخر {Math.abs(f.slaDueMins)}د</span> : <span className="tnum text-xs text-ink-faint">{f.slaDueMins}د</span>}
                    <Badge value={f.priority} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* PM due */}
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-semibold"><CalendarClock size={17} className="text-amber-500" /> الصيانة الوقائية — المستحقة والمتأخرة</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-ink-faint">
                <tr className="text-right">
                  <th className="py-1 font-medium">المصعد</th><th className="py-1 font-medium">العميل</th>
                  <th className="py-1 font-medium">المنطقة</th><th className="py-1 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {pmOverdue.map((r) => (
                  <tr key={r.asset} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-1.5 font-mono text-xs">{r.asset}</td>
                    <td className="py-1.5">{r.cust}</td>
                    <td className="py-1.5 text-ink-soft">{r.zone}</td>
                    <td className="py-1.5">
                      {r.days < 0
                        ? <span className="tnum rounded-md bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">متأخر {Math.abs(r.days)} يوم</span>
                        : <span className="tnum rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">خلال {r.days} يوم</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Today's work orders */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold"><ArrowUpRight size={17} className="text-brand-500" /> أوامر العمل اليوم</div>
            <Link to="/work-orders" className="text-xs font-medium text-brand-600 hover:underline">عرض الكل</Link>
          </div>
          <ul className="space-y-2">
            {today.map((w) => {
              const el = elevators.find((e) => e.id === w.elevatorId)!;
              return (
                <li key={w.id}>
                  <Link to={`/work-orders/${w.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{w.woNo} · {w.type}</div>
                      <div className="text-xs text-ink-faint">{el.assetNo} · {w.site} · {w.scheduledAt.slice(11)}</div>
                    </div>
                    <Badge value={w.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
