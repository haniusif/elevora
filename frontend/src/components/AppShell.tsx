import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ArrowUpDown, ClipboardList, AlertTriangle, FileText,
  Boxes, Users, Settings, Moon, Sun, LogOut, ChevronDown, Menu, Search,
} from "lucide-react";
import { cx } from "../lib/ui";
import { branches } from "../data/mock";

const nav = [
  { to: "/", label: "لوحة المعلومات", icon: LayoutDashboard, end: true },
  { to: "/elevators", label: "المصاعد (الأصول)", icon: ArrowUpDown },
  { to: "/work-orders", label: "أوامر العمل", icon: ClipboardList },
  { to: "/faults", label: "البلاغات والأعطال", icon: AlertTriangle },
];
const navSoon = [
  { label: "العقود و SLA", icon: FileText },
  { label: "المخزون وقطع الغيار", icon: Boxes },
  { label: "العملاء", icon: Users },
  { label: "الإعدادات والصلاحيات", icon: Settings },
];

function toggleTheme() {
  const el = document.documentElement;
  const dark = el.classList.toggle("dark");
  try {
    localStorage.setItem("ll-theme", dark ? "dark" : "light");
  } catch {
    /* ignore */
  }
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const nver = useNavigate();

  return (
    <div className="min-h-full">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4">
          <button className="shrink-0 rounded-lg p-2 text-ink-soft hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" onClick={() => setOpen(!open)} aria-label="القائمة">
            <Menu size={18} />
          </button>
          <div className="flex shrink-0 items-center gap-2 font-bold">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500 text-white">
              <ArrowUpDown size={17} />
            </span>
            <span className="text-[15px]">Elevora</span>
            <span className="hidden truncate text-xs font-medium text-ink-faint lg:inline">منصة عمليات المصاعد</span>
          </div>

          {/* search grows to fill the middle; no auto-margin so layout holds at every width */}
          <div className="relative hidden min-w-0 flex-1 items-center md:flex">
            <Search size={15} className="pointer-events-none absolute right-2.5 text-ink-faint" />
            <input
              placeholder="بحث عن مصعد، عميل، أمر عمل…"
              className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-8 pl-3 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          {/* trailing controls: pinned to the inline-end (left in RTL) regardless of search visibility */}
          <div className="ms-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <label className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 sm:flex">
              <span className="text-ink-faint">الفرع</span>
              <select className="bg-transparent text-sm font-medium outline-none">
                {branches.map((b) => <option key={b}>{b}</option>)}
              </select>
            </label>

            <button onClick={toggleTheme} className="rounded-lg p-2 text-ink-soft hover:bg-slate-100 dark:hover:bg-slate-800" title="تبديل السمة" aria-label="تبديل السمة">
              <Sun size={18} className="hidden dark:block" />
              <Moon size={18} className="dark:hidden" />
            </button>

            <div className="flex items-center gap-2 rounded-lg px-1 py-1 sm:px-1.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">غ</div>
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-xs font-semibold">غادة الشمري</div>
                <div className="text-[11px] text-ink-faint">مدير عام</div>
              </div>
              <ChevronDown size={14} className="hidden text-ink-faint sm:block" />
            </div>
            <button onClick={() => nver("/login")} className="shrink-0 rounded-lg p-2 text-ink-soft hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" title="تسجيل الخروج" aria-label="تسجيل الخروج">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cx(
          "fixed inset-y-0 right-0 top-14 z-20 w-64 shrink-0 border-l border-slate-200 bg-white p-3 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:top-0 lg:translate-x-0",
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          <nav className="flex flex-col gap-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cx(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                      : "text-ink-soft hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )
                }
              >
                <n.icon size={18} />
                {n.label}
              </NavLink>
            ))}
            <div className="mt-4 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">المراحل القادمة</div>
            {navSoon.map((n) => (
              <div key={n.label} className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-faint">
                <n.icon size={18} />
                {n.label}
                <span className="mr-auto rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-800">قريباً</span>
              </div>
            ))}
          </nav>
          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-ink-soft dark:bg-slate-800/50 dark:text-slate-400">
            نموذج أولي قابل للنقر — بيانات تجريبية. المرحلة R2 من خطة التنفيذ (العمود الفقري التشغيلي).
          </div>
        </aside>

        {open && <div className="fixed inset-0 top-14 z-10 bg-black/20 lg:hidden" onClick={() => setOpen(false)} />}

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
