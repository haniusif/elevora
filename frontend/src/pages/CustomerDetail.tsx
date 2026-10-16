import { Link, useParams } from "react-router-dom";
import { ArrowRight, Phone, MapPin, Building2, User } from "lucide-react";
import { Card, Badge } from "../lib/ui";
import { useDB } from "../api/store";
import { contractStatusAr } from "../data/seed";

export default function CustomerDetail() {
  const { id } = useParams();
  const customers = useDB((d) => d.customers);
  const elevators = useDB((d) => d.elevators);
  const contracts = useDB((d) => d.contracts);
  const c = customers.find((x) => x.id === Number(id));
  if (!c) return <div className="text-ink-faint">غير موجود</div>;

  const myElevators = elevators.filter((e) => e.customer === c.name);
  const myContracts = contracts.filter((k) => k.customer === c.name);

  return (
    <div>
      <Link to="/customers" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-brand-600">
        <ArrowRight size={15} /> رجوع إلى العملاء
      </Link>

      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
          {c.type === "company" ? <Building2 size={22} /> : <User size={22} />}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{c.name}</h1>
          <p className="text-sm text-ink-soft dark:text-slate-400">{c.code} · {c.type === "company" ? "شركة" : "فرد"}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">البيانات</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-ink-faint"><Phone size={14} /> الجوال</dt><dd className="tnum">{c.phone}</dd></div>
            <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-ink-faint"><MapPin size={14} /> الحي</dt><dd>{c.district} — {c.city}</dd></div>
            {c.type === "company"
              ? <div className="flex justify-between"><dt className="text-ink-faint">الرقم الضريبي</dt><dd className="tnum">{c.vat || "—"}</dd></div>
              : <div className="flex justify-between"><dt className="text-ink-faint">السجل المدني</dt><dd className="tnum">{c.nationalId || "—"}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-faint">عدد المواقع</dt><dd className="tnum">{c.sites}</dd></div>
          </dl>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">المصاعد ({myElevators.length})</h3>
            {myElevators.length ? (
              <div className="space-y-1.5">
                {myElevators.map((e) => (
                  <Link key={e.id} to={`/elevators/${e.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-300">{e.assetNo}</span>
                    <span className="text-ink-soft">{e.brand} {e.model} · {e.site}</span>
                    <Badge value={e.status} />
                  </Link>
                ))}
              </div>
            ) : <p className="text-sm text-ink-faint">لا توجد مصاعد مسجّلة لهذا العميل في النظام التجريبي.</p>}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">العقود ({myContracts.length})</h3>
            {myContracts.length ? (
              <div className="space-y-1.5">
                {myContracts.map((k) => (
                  <Link key={k.id} to={`/contracts/${k.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className="tnum font-semibold">عقد {k.contractNo}</span>
                    <span className="text-ink-soft">{k.value.toLocaleString()} ر.س · {k.elevators} مصعد</span>
                    <Badge value={k.status} label={contractStatusAr[k.status]} />
                  </Link>
                ))}
              </div>
            ) : <p className="text-sm text-ink-faint">لا توجد عقود.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
