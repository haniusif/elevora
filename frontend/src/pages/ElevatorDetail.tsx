import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, QrCode, Wrench, AlertTriangle, Package, ClipboardCheck, FileText } from "lucide-react";
import { Card, Badge, Btn } from "../lib/ui";
import { elevatorHistory, HistoryEvent, type Elevator } from "../data/mock";
import { useDB } from "../api/store";
import { useAuth } from "../auth";

const specRows = (e: Elevator) => [
  ["الرقم التسلسلي", e.assetNo.replace("LFT", "SN")],
  ["رمز QR", e.qr],
  ["الماركة", e.brand],
  ["الموديل", e.model],
  ["النوع", e.type],
  ["الحمولة", `${e.capacityKg} كجم`],
  ["السرعة", `${e.speed} م/ث`],
  ["عدد الوقفات", String(e.stops)],
  ["نوع الماكينة", e.drive],
  ["نوع الباب", e.doorType],
  ["تاريخ التشغيل", e.commissioned],
  ["انتهاء الضمان", e.warrantyEnd],
];

const histIcon: Record<HistoryEvent["kind"], typeof Wrench> = {
  visit: Wrench, fault: AlertTriangle, part: Package, inspection: ClipboardCheck,
};
const histTone: Record<HistoryEvent["kind"], string> = {
  visit: "text-brand-500", fault: "text-rose-500", part: "text-amber-500", inspection: "text-sky-500",
};

export default function ElevatorDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const elevators = useDB((d) => d.elevators);
  const e = elevators.find((x) => x.id === Number(id));
  const [tab, setTab] = useState<"history" | "spec" | "docs">("history");
  if (!e) return <div>غير موجود</div>;
  const history = elevatorHistory[e.id] ?? [];

  return (
    <div>
      <Link to="/elevators" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-brand-600">
        <ArrowRight size={15} /> رجوع إلى المصاعد
      </Link>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold">{e.assetNo}</h1>
            <Badge value={e.status} />
            <Badge value={e.cover} />
          </div>
          <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">
            {e.brand} {e.model} · {e.customer} · {e.site} / {e.building}
          </p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline"><QrCode size={15} /> {e.qr}</Btn>
          {can("work_orders", "create") && <Btn variant="primary"><Wrench size={15} /> إنشاء أمر عمل</Btn>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: quick facts */}
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">بطاقة الأصل</h3>
          <dl className="space-y-2 text-sm">
            {specRows(e).slice(0, 8).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-ink-faint">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
            <div className="flex justify-between"><span className="text-ink-faint">الفني المسؤول</span><span className="font-medium">{e.maintenanceTech}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-ink-faint">رقم العقد</span><span className="tnum font-medium">{e.contractNo}</span></div>
          </div>
        </Card>

        {/* Right: tabs */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex gap-1 border-b border-slate-100 dark:border-slate-800">
            {([["history", "السجل الكامل"], ["spec", "المواصفات الفنية"], ["docs", "المستندات"]] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={
                  "relative px-3 pb-2.5 text-sm font-medium transition " +
                  (tab === k ? "text-brand-600 dark:text-brand-300" : "text-ink-soft hover:text-ink")
                }
              >
                {l}
                {tab === k && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded bg-brand-500" />}
              </button>
            ))}
          </div>

          {tab === "history" && (
            history.length ? (
              <ol className="relative mr-3 space-y-4 border-r-2 border-slate-100 pr-5 dark:border-slate-800">
                {history.map((h, i) => {
                  const Icon = histIcon[h.kind];
                  return (
                    <li key={i} className="relative">
                      <span className={"absolute -right-[33px] grid h-6 w-6 place-items-center rounded-full bg-white ring-2 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800 " + histTone[h.kind]}>
                        <Icon size={13} />
                      </span>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{h.title}</div>
                        <div className="tnum text-xs text-ink-faint">{h.date}</div>
                      </div>
                      <div className="text-xs text-ink-faint">بواسطة {h.by}{h.note ? ` — ${h.note}` : ""}</div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="py-10 text-center text-sm text-ink-faint">لا يوجد سجل بعد لهذا الأصل</div>
            )
          )}

          {tab === "spec" && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              {specRows(e).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-slate-50 py-1 dark:border-slate-800">
                  <dt className="text-ink-faint">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {tab === "docs" && (
            <div className="space-y-2">
              {["عقد الصيانة.pdf", "شهادة الفحص السنوي.pdf", "المخطط الفني.dwg", "صور غرفة الماكينة"].map((d) => (
                <div key={d} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800">
                  <span className="flex items-center gap-2"><FileText size={15} className="text-ink-faint" /> {d}</span>
                  <Badge value="comprehensive" label="مرئي للعميل" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
