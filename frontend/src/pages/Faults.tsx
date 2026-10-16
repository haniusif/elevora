import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, LayoutGrid, List } from "lucide-react";
import { Card, PageHeader, Badge, Btn, cx } from "../lib/ui";
import { faults, elevators, statusAr } from "../data/mock";

const columns: { key: string; label: string }[] = [
  { key: "open", label: "مفتوح / مُسند" },
  { key: "on_site", label: "في الموقع / تشخيص" },
  { key: "repairing", label: "إصلاح / بانتظار قطع" },
  { key: "testing", label: "اختبار / تم الحل" },
];
const colOf = (s: string) =>
  ["open", "assigned", "acknowledged", "en_route"].includes(s) ? "open" :
  ["on_site", "diagnosis"].includes(s) ? "on_site" :
  ["repairing", "waiting_parts"].includes(s) ? "repairing" : "testing";

function SlaPill({ mins }: { mins: number }) {
  if (mins < 0) return <span className="tnum rounded-md bg-rose-100 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">خرق SLA {Math.abs(mins)}د</span>;
  if (mins <= 30) return <span className="tnum rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">تحذير {mins}د</span>;
  return <span className="tnum rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-ink-soft dark:bg-slate-800">{mins}د</span>;
}

export default function Faults() {
  const [view, setView] = useState<"board" | "list">("board");

  return (
    <div>
      <PageHeader
        title="البلاغات والأعطال"
        subtitle="الصيانة التصحيحية — بلاغات بأولوية ومؤقتات SLA وسير حالة منضبط"
        actions={
          <>
            <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
              <button onClick={() => setView("board")} className={cx("rounded-md p-1.5", view === "board" ? "bg-brand-500 text-white" : "text-ink-soft")}><LayoutGrid size={15} /></button>
              <button onClick={() => setView("list")} className={cx("rounded-md p-1.5", view === "list" ? "bg-brand-500 text-white" : "text-ink-soft")}><List size={15} /></button>
            </div>
            <Btn variant="primary"><Plus size={15} /> تسجيل بلاغ</Btn>
          </>
        }
      />

      {view === "board" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((c) => {
            const items = faults.filter((f) => colOf(f.status) === c.key);
            return (
              <div key={c.key} className="rounded-2xl bg-slate-100/60 p-2 dark:bg-slate-800/40">
                <div className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold">
                  {c.label}
                  <span className="tnum rounded-md bg-white px-1.5 text-xs text-ink-soft dark:bg-slate-900">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((f) => {
                    const el = elevators.find((e) => e.id === f.elevatorId)!;
                    return (
                      <Link key={f.id} to={`/faults/${f.id}`}>
                        <Card className="p-3 transition hover:border-brand-300">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-300">{f.ticketNo}</span>
                            <Badge value={f.priority} />
                          </div>
                          <div className="text-sm font-medium leading-snug">{f.fault}</div>
                          <div className="mt-1 text-xs text-ink-faint">{el.assetNo} · {f.site}</div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-ink-faint">{f.tech}</span>
                            <SlaPill mins={f.slaDueMins} />
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                  {items.length === 0 && <div className="px-2 py-6 text-center text-xs text-ink-faint">لا يوجد</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink-faint dark:bg-slate-800/60">
                <tr className="text-right">
                  <th className="px-4 py-2.5 font-semibold">رقم البلاغ</th>
                  <th className="px-4 py-2.5 font-semibold">العطل</th>
                  <th className="px-4 py-2.5 font-semibold">المصعد</th>
                  <th className="px-4 py-2.5 font-semibold">الفني</th>
                  <th className="px-4 py-2.5 font-semibold">SLA</th>
                  <th className="px-4 py-2.5 font-semibold">الأولوية</th>
                  <th className="px-4 py-2.5 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {faults.map((f) => {
                  const el = elevators.find((e) => e.id === f.elevatorId)!;
                  return (
                    <tr key={f.id} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5"><Link to={`/faults/${f.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">{f.ticketNo}</Link></td>
                      <td className="px-4 py-2.5">{f.fault}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{el.assetNo}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{f.tech}</td>
                      <td className="px-4 py-2.5"><SlaPill mins={f.slaDueMins} /></td>
                      <td className="px-4 py-2.5"><Badge value={f.priority} /></td>
                      <td className="px-4 py-2.5"><Badge value={f.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
