import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-500">404</p>
        <h1 className="mt-4 text-3xl font-bold text-slate-800">عذراً، الصفحة غير متوفرة</h1>
        <p className="mt-3 text-slate-500">
          الرابط الذي تحاول الوصول إليه غير موجود. تحقق من العنوان أو عد إلى لوحة التحكم للمتابعة.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-primary-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600"
          >
            العودة للوحة التحكم
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-primary-500 px-6 py-2 text-sm font-medium text-primary-600 transition hover:bg-primary-50"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
