import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { handleApiError } from '../../lib/apiClient';
import { PASSWORD_MIN_LENGTH } from '../../constants/passwordRules';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { actions, user } = useAuth();
  const { t, locale, switchLocale, isRTL } = useI18n();
  
  const isFirstLogin = location.state?.isFirstLogin || false;
  const from = location.state?.from || '/';

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const currentPasswordRef = useRef(null);

  useEffect(() => {
    // Focus first input on mount
    if (currentPasswordRef.current) {
      currentPasswordRef.current.focus();
    }
  }, []);

  const changePasswordMutation = useMutation({
    mutationFn: () => actions.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    }),
    onSuccess: () => {
      setErrorMessage('');
      setSuccessMessage(t('password.change_success'));
      
      // Redirect after 2 seconds
      setTimeout(() => {
        if (isFirstLogin) {
          navigate(from, { replace: true });
        } else {
          navigate(-1); // Go back
        }
      }, 2000);
    },
    onError: (err) => {
      setSuccessMessage('');
      setErrorMessage(handleApiError(err, t));
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (form.newPassword.length < PASSWORD_MIN_LENGTH) {
      setErrorMessage(t('password.min_length', { min: PASSWORD_MIN_LENGTH }));
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setErrorMessage(t('password.mismatch'));
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setErrorMessage(t('password.same_as_current'));
      return;
    }

    changePasswordMutation.mutate();
  };

  const isLoading = changePasswordMutation.isLoading;

  return (
    <div 
      className={`flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-indigo-50 px-4 py-12 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Language Toggle */}
      <div className="absolute top-6 right-6">
        <button
          type="button"
          onClick={() => switchLocale(locale === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white hover:shadow transition"
          aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isFirstLogin ? t('password.first_login_title') : t('password.change_title')}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isFirstLogin ? t('password.first_login_subtitle') : t('password.change_subtitle')}
          </p>
          {user && (
            <p className="mt-1 text-xs text-slate-500">
              {user.full_name} ({user.email})
            </p>
          )}
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
          {isFirstLogin && (
            <div
              className="mb-6 rounded-2xl px-4 py-3 text-sm bg-blue-50 border border-blue-200"
              role="status"
            >
              <div className="flex items-start gap-2">
                <svg className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-blue-700">{t('password.first_login_notice')}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div>
              <label 
                className="block text-sm font-medium text-slate-600 mb-1" 
                htmlFor="currentPassword"
              >
                {t('password.current_label')}
              </label>
              <input
                ref={currentPasswordRef}
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                disabled={isLoading}
                value={form.currentPassword}
                onChange={(e) => setForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                placeholder={t('password.current_placeholder')}
                dir="ltr"
                autoComplete="current-password"
              />
            </div>

            {/* New Password */}
            <div>
              <label 
                className="block text-sm font-medium text-slate-600 mb-1" 
                htmlFor="newPassword"
              >
                {t('password.new_label')}
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                disabled={isLoading}
                value={form.newPassword}
                onChange={(e) => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                placeholder={t('password.new_placeholder')}
                dir="ltr"
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
              />
              <p className="mt-1 text-xs text-slate-500">
                {t('password.requirements')}
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label 
                className="block text-sm font-medium text-slate-600 mb-1" 
                htmlFor="confirmPassword"
              >
                {t('password.confirm_label')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                disabled={isLoading}
                value={form.confirmPassword}
                onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                placeholder={t('password.confirm_placeholder')}
                dir="ltr"
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            {/* Success Message */}
            {successMessage && (
              <div
                className="rounded-2xl px-4 py-3 text-sm bg-emerald-50 border border-emerald-200"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-emerald-700">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div
                className="rounded-2xl px-4 py-3 text-sm bg-red-50 border border-red-200"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || successMessage}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {isLoading && (
                <svg 
                  className="animate-spin h-4 w-4" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              <span>
                {isLoading ? t('password.submitting') : t('password.submit_button')}
              </span>
            </button>

            {/* Cancel Button (only if not first login) */}
            {!isFirstLogin && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={isLoading}
                className="w-full text-center text-sm font-medium text-slate-600 hover:text-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed transition"
              >
                {t('common.cancel')}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
