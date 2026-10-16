import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Card, PageHeader, Badge, Btn, cx } from "../lib/ui";
import { workOrders, elevators, statusAr } from "../data/mock";

const typeFilters = ["الكل", "صيانة دورية", "إصلاح عطل", "فحص", "تركيب"] as const;

export default function WorkOrders() {
  const [t, setT] = useState<(typeof typeFilters)[number]>("الكل");
  const [q, setQ] = useState("");
  const rows = useMemo(
    () =>
      workOrders.filter((w) => {
        const okT = t === "الكل" || w.type === t;
        const okQ = !q || [w.woNo, w.customer, w.site].some((f) => f.includes(q));
        return okT && okQ;
      }),
    [t, q]
  );

  return (
    <div>
      <PageHeader
        title="أوامر العمل"
        subtitle="العمود الفقري التشغيلي — كل زيارة أو إصلاح أو تركيب هو أمر عمل واحد"
        actions={<Btn variant="primary"><Plus size={15} /> أمر عمل جديد</Btn>}
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث: رقم الأمر، العميل، الموقع…"
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
          />
          <div className="flex flex-wrap items-center gap-1">
            {typeFilters.map((f) => (
              <button
                key={f}
                onClick={() => setT(f)}
                className={cx(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                  t === f ? "bg-brand-500 text-white" : "text-ink-soft hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink-faint dark:bg-slate-800/60">
              <tr className="text-right">
                <th className="px-4 py-2.5 font-semibold">رقم الأمر</th>
                <th className="px-4 py-2.5 font-semibold">النوع</th>
                <th className="px-4 py-2.5 font-semibold">المصعد</th>
                <th className="px-4 py-2.5 font-semibold">العميل / الموقع</th>
                <th className="px-4 py-2.5 font-semibold">الموعد</th>
                <th className="px-4 py-2.5 font-semibold">الفنيون</th>
                <th className="px-4 py-2.5 font-semibold">الأولوية</th>
                <th className="px-4 py-2.5 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => {
                const el = elevators.find((e) => e.id === w.elevatorId)!;
                return (
                  <tr key={w.id} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5">
                      <Link to={`/work-orders/${w.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">{w.woNo}</Link>
                    </td>
                    <td className="px-4 py-2.5">{w.type}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{el.assetNo}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{w.customer}</div>
                      <div className="text-[11px] text-ink-faint">{w.site}</div>
                    </td>
                    <td className="tnum px-4 py-2.5 text-ink-soft">{w.scheduledAt}</td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {w.technicians.map((t) => t.name).join("، ")}
                    </td>
                    <td className="px-4 py-2.5"><Badge value={w.priority} /></td>
                    <td className="px-4 py-2.5"><Badge value={w.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-2 text-xs text-ink-faint">الإجمالي: {rows.length}</p>
    </div>
  );
}
