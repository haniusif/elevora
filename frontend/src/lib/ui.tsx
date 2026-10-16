import {
  ReactNode,
  useEffect,
  useSyncExternalStore,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";
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
  renewal_due: "warn", expired: "crit", draft: "muted", suspended: "warn",
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

// ---- Toasts --------------------------------------------------------------
type ToastItem = { id: number; msg: string; kind: "ok" | "err" };
let _toasts: ToastItem[] = [];
const _tl = new Set<() => void>();
export function toast(msg: string, kind: "ok" | "err" = "ok") {
  const id = Date.now() + Math.random();
  _toasts = [..._toasts, { id, msg, kind }];
  _tl.forEach((l) => l());
  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id);
    _tl.forEach((l) => l());
  }, 2600);
}
export function Toaster() {
  const ts = useSyncExternalStore(
    (l) => {
      _tl.add(l);
      return () => _tl.delete(l);
    },
    () => _toasts,
    () => _toasts
  );
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {ts.map((t) => (
        <div
          key={t.id}
          className={cx(
            "rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg",
            t.kind === "ok" ? "bg-brand-600" : "bg-rose-600"
          )}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ---- Modal ---------------------------------------------------------------
export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[8vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cx(
          "w-full rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900",
          wide ? "max-w-2xl" : "max-w-lg"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <h3 className="font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-ink-faint hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[68vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-start gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Form controls -------------------------------------------------------
const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900";

export function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={cx("block", full && "sm:col-span-2")}>
      <span className="mb-1 block text-xs font-medium text-ink-soft dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}
export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputCls, "min-h-[72px]", props.className)} />;
}
export function Select({ children, className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cx(inputCls, className)}>
      {children}
    </select>
  );
}
export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
