import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { handleApiError } from '../../lib/apiClient';

const LoginStep = {
  PASSWORD: 'PASSWORD',
  OTP_REQUEST: 'OTP_REQUEST',
  OTP_VERIFY: 'OTP_VERIFY',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { actions, error } = useAuth();
  const [step, setStep] = useState(LoginStep.PASSWORD);
  const [form, setForm] = useState({
    email: '',
    password: '',
    otp: '',
  });
  const [infoMessage, setInfoMessage] = useState('');

  const from = location.state?.from?.pathname || '/';

  const passwordMutation = useMutation({
    mutationFn: () => actions.loginWithPassword({ email: form.email, password: form.password }),
    onSuccess: () => {
      navigate(from, { replace: true });
    },
    onError: (err) => {
      setInfoMessage(handleApiError(err));
    },
  });

  const requestOtpMutation = useMutation({
    mutationFn: () => actions.requestOtp({ email: form.email, purpose: 'login' }),
    onSuccess: () => {
      setInfoMessage('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      setStep(LoginStep.OTP_VERIFY);
    },
    onError: (err) => {
      setInfoMessage(handleApiError(err));
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => actions.verifyOtp({ email: form.email, code: form.otp, purpose: 'login' }),
    onSuccess: () => {
      navigate(from, { replace: true });
    },
    onError: (err) => {
      setInfoMessage(handleApiError(err));
    },
  });

  const isLoading = passwordMutation.isLoading || requestOtpMutation.isLoading || verifyOtpMutation.isLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white px-8 py-10 shadow-xl ring-1 ring-slate-100">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-primary-700">مرحباً بكم في نظام إدارة الحضانات</h1>
          <p className="text-sm text-slate-500">سجل الدخول للمتابعة باستخدام كلمة المرور أو رمز التحقق عبر البريد الإلكتروني</p>
        </div>

        <div className="flex justify-center gap-2 rounded-full bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setInfoMessage('');
              setStep(LoginStep.PASSWORD);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              step === LoginStep.PASSWORD ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500'
            }`}
          >
            كلمة المرور
          </button>
          <button
            type="button"
            onClick={() => {
              setInfoMessage('');
              setStep(LoginStep.OTP_REQUEST);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              step !== LoginStep.PASSWORD ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500'
            }`}
          >
            رمز التحقق عبر البريد الإلكتروني
          </button>
        </div>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (step === LoginStep.PASSWORD) {
              passwordMutation.mutate();
            } else if (step === LoginStep.OTP_REQUEST) {
              requestOtpMutation.mutate();
            } else {
              verifyOtpMutation.mutate();
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600" htmlFor="email">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-1 block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="example@email.com"
                dir="ltr"
                autoComplete="email"
              />
              <p className="mt-1 text-xs text-slate-500">
                أدخل بريدك الإلكتروني المسجل في النظام
              </p>
            </div>

            {step === LoginStep.PASSWORD && (
              <div>
                <label className="block text-sm font-medium text-slate-600" htmlFor="password">
                  كلمة المرور
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="mt-1 block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="••••••••"
                  dir="ltr"
                  autoComplete="current-password"
                />
              </div>
            )}

            {step === LoginStep.OTP_VERIFY && (
              <div>
                <label className="block text-sm font-medium text-slate-600" htmlFor="otp">
                  رمز التحقق من البريد الإلكتروني
                </label>
                <input
                  id="otp"
                  type="text"
                  required
                  value={form.otp}
                  onChange={(event) => setForm((prev) => ({ ...prev, otp: event.target.value }))}
                  className="mt-1 block w-full rounded-2xl border-slate-200 text-sm tracking-[0.5em] shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="000000"
                  dir="ltr"
                  autoComplete="one-time-code"
                />
              </div>
            )}
          </div>

          {(infoMessage || error) && (
            <p
              className={`rounded-2xl px-4 py-2 text-sm ${
                infoMessage ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}
            >
              {infoMessage || error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-full bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
          >
            {isLoading ? 'جاري المعالجة...' : step === LoginStep.PASSWORD ? 'تسجيل الدخول' : 'متابعة'}
          </button>

          {step === LoginStep.OTP_VERIFY && (
            <button
              type="button"
              onClick={() => requestOtpMutation.mutate()}
              className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              إعادة إرسال الرمز
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
