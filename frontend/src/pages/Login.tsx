import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, Eye } from "lucide-react";
import { useAuth } from "../auth";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [u, setU] = useState("ghada");
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-brand-600 p-10 text-white lg:flex">
        <div className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">
            <ArrowUpDown size={18} />
          </span>
          Elevora
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-snug">منصة عمليات المصاعد</h2>
          <p className="mt-3 max-w-md text-white/80">
            من العميل والأصل إلى العقد وأمر العمل والفاتورة — منصة تشغيل واحدة لشركات المصاعد.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[["142", "مصعد"], ["125", "عقد صيانة"], ["99.5%", "جاهزية"]].map(([n, l]) => (
              <div key={l} className="rounded-xl bg-white/10 p-3">
                <div className="tnum text-2xl font-bold">{n}</div>
                <div className="text-xs text-white/70">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-white/60">© 2026 Elevora — مصادر غادة للتشغيل والصيانة</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 font-bold lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white">
              <ArrowUpDown size={18} />
            </span>
            Elevora
          </div>
          <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
          <p className="mt-1 text-sm text-ink-soft dark:text-slate-400">أدخل بياناتك للوصول إلى لوحة الإدارة</p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              login(u);
              nav("/");
            }}
          >
            <div>
              <label className="mb-1 block text-sm font-medium">اسم المستخدم</label>
              <input
                value={u}
                onChange={(e) => setU(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">كلمة المرور</label>
              <div className="relative">
                <input
                  type="password"
                  defaultValue="••••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
                />
                <Eye size={16} className="absolute left-3 top-2.5 text-ink-faint" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-soft dark:text-slate-400">
              <input type="checkbox" className="accent-brand-500" /> تذكّرني
            </label>
            <button className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
              تسجيل الدخول
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-ink-faint">
            نموذج أولي — أي بيانات تنقلك إلى اللوحة. كلمات المرور في النظام الفعلي مُشفّرة (لا تُعرض).
          </p>
        </div>
      </div>
    </div>
  );
}
