import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QrCode, Filter, Plus } from "lucide-react";
import { Card, PageHeader, Badge, Btn, cx } from "../lib/ui";
import { elevators, statusAr } from "../data/mock";

const statuses = ["all", "active", "under_maintenance", "out_of_service"] as const;

export default function Elevators() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");

  const rows = useMemo(
    () =>
      elevators.filter((e) => {
        const okS = status === "all" || e.status === status;
        const okQ =
          !q ||
          [e.assetNo, e.customer, e.site, e.brand, e.model, String(e.id)].some((f) =>
            f.toLowerCase().includes(q.toLowerCase())
          );
        return okS && okQ;
      }),
    [q, status]
  );

  return (
    <div>
      <PageHeader
        title="المصاعد (سجل الأصول)"
        subtitle={`${elevators.length} مصعد · كل مصعد أصل مُدار بسجل كامل عبر العقود`}
        actions={
          <>
            <Btn variant="outline"><QrCode size={15} /> مسح QR</Btn>
            <Btn variant="primary"><Plus size={15} /> أصل جديد</Btn>
          </>
        }
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث: رقم الأصل، العميل، الموقع، الماركة…"
            className="min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
          />
          <div className="flex items-center gap-1 text-sm">
            <Filter size={14} className="text-ink-faint" />
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cx(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                  status === s
                    ? "bg-brand-500 text-white"
                    : "text-ink-soft hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {s === "all" ? "الكل" : statusAr[s]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink-faint dark:bg-slate-800/60">
              <tr className="text-right">
                <th className="px-4 py-2.5 font-semibold">رقم الأصل</th>
                <th className="px-4 py-2.5 font-semibold">العميل</th>
                <th className="px-4 py-2.5 font-semibold">الموقع</th>
                <th className="px-4 py-2.5 font-semibold">الماركة / الموديل</th>
                <th className="px-4 py-2.5 font-semibold">الوقفات</th>
                <th className="px-4 py-2.5 font-semibold">العقد</th>
                <th className="px-4 py-2.5 font-semibold">الفني</th>
                <th className="px-4 py-2.5 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5">
                    <Link to={`/elevators/${e.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">
                      {e.assetNo}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{e.customer}</div>
                    <div className="text-[11px] text-ink-faint">{e.customerType}</div>
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">{e.site}</td>
                  <td className="px-4 py-2.5">{e.brand} · <span className="text-ink-faint">{e.model}</span></td>
                  <td className="tnum px-4 py-2.5">{e.stops}</td>
                  <td className="tnum px-4 py-2.5">
                    {e.contractNo} <Badge value={e.cover} />
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">{e.maintenanceTech}</td>
                  <td className="px-4 py-2.5"><Badge value={e.status} /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-ink-faint">لا توجد نتائج مطابقة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-2 text-xs text-ink-faint">الإجمالي: {rows.length} من {elevators.length}</p>
    </div>
  );
}
