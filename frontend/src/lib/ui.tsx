import { ReactNode } from "react";
import { statusAr } from "../data/mock";

export function cx(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// ---- Status / priority color mapping -------------------------------------
type Tone = "ok" | "warn" | "crit" | "info" | "muted";
const toneCls: Record<Tone, string> = {
  ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  warn: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  crit: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  info: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  muted: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300",
};

const statusTone: Record<string, Tone> = {
  active: "ok", completed: "ok", customer_signed: "ok", supervisor_approved: "ok", closed: "ok", resolved: "ok",
  under_maintenance: "warn", on_hold_parts: "warn", waiting_parts: "warn", testing: "warn", diagnosis: "warn",
  out_of_service: "crit", decommissioned: "muted",
  scheduled: "info", assigned: "info", en_route: "info", started: "info", acknowledged: "info", on_site: "info", open: "info", repairing: "info",
  low: "muted", normal: "info", high: "warn", critical: "crit", emergency: "crit",
  comprehensive: "ok", non_comprehensive: "muted",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  const tone = statusTone[value] ?? "muted";
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold", toneCls[tone])}>
      {label ?? statusAr[value] ?? value}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900", className)}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, tone = "muted", hint }: { label: string; value: ReactNode; tone?: Tone; hint?: string }) {
  const accent: Record<Tone, string> = {
    ok: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    crit: "text-rose-600 dark:text-rose-400",
    info: "text-sky-600 dark:text-sky-400",
    muted: "text-brand-600 dark:text-brand-300",
  };
  return (
    <Card className="p-4">
      <div className={cx("tnum text-2xl font-semibold leading-none", accent[tone])}>{value}</div>
      <div className="mt-2 text-xs text-ink-soft dark:text-slate-400">{label}</div>
      {hint && <div className="mt-1 text-[11px] text-ink-faint dark:text-slate-500">{hint}</div>}
    </Card>
  );
}

export function Btn({
  children, variant = "ghost", onClick, className,
}: { children: ReactNode; variant?: "primary" | "ghost" | "outline"; onClick?: () => void; className?: string }) {
  const v = {
    primary: "bg-brand-500 text-white hover:bg-brand-600",
    ghost: "text-ink-soft hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
    outline: "border border-slate-200 text-ink-soft hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
  }[variant];
  return (
    <button onClick={onClick} className={cx("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition", v, className)}>
      {children}
    </button>
  );
}

export function SearchInput({ placeholder }: { placeholder: string }) {
  return (
    <input
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none placeholder:text-ink-faint focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
    />
  );
}
