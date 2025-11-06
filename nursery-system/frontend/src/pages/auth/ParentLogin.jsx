import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { handleApiError, checkBackendHealth, API_BASE_URL } from '../../lib/apiClient';
import { useConnection } from '../../contexts/ConnectionContext';

const LoginStep = {
  PASSWORD: 'PASSWORD',
};

export default function ParentLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { actions, error: authError } = useAuth();
  const { t, locale, switchLocale, isRTL } = useI18n();
  const [step, setStep] = useState(LoginStep.PASSWORD);
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { isCheckingConnection, backendStatus, setBackendStatus, setIsCheckingConnection } = useConnection();
  const [retryCount, setRetryCount] = useState(0);
  const backendUrlForDisplay =
    API_BASE_URL ||
    (typeof window !== 'undefined'
      ? `${window.location.origin.replace(/\/$/, '')}/api`
      : '/api');
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const from = location.state?.from?.pathname || '/parent/dashboard';

  // Auto-focus email field on mount
  useEffect(() => {
    setRetryCount(0);
    const checkConnection = async () => {
      setIsCheckingConnection(true);
      const isHealthy = await checkBackendHealth();
      setBackendStatus(isHealthy);
      setIsCheckingConnection(false);

      if (!isHealthy) {
        setErrorMessage(t('error.network_detail', { url: backendUrlForDisplay }));
      }
    };

    // Check immediately on mount
    checkConnection();

    // Auto-focus email field on mount
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [t, backendUrlForDisplay]);

  // Login mutation
  const passwordMutation = useMutation({
    mutationFn: () => actions.loginWithPassword({
      email: form.email,
      password: form.password,
      role: 'parent',
    }),
    onSuccess: (data) => {
      setErrorMessage('');
      setInfoMessage('');
      setRetryCount(0);

      // Check if user needs to change password (first login)
      if (data?.user?.temp_password || data?.user?.requires_password_change) {
        // Redirect to password change page
        navigate('/change-password', {
          replace: true,
          state: { isFirstLogin: true, from }
        });
      } else {
        navigate(from, { replace: true });
      }
    },
    onError: (error) => {
      setRetryCount(prev => prev + 1);
      setErrorMessage(handleApiError(error, t));
    },
  });

  const isLoading = passwordMutation.isPending;
  const handleRetry = async () => {
    setIsCheckingConnection(true);
    setErrorMessage('');
    // You may want to debounce this in the provider for production
    const isHealthy = await checkBackendHealth();
    setBackendStatus(isHealthy);
    setIsCheckingConnection(false);

    if (!isHealthy) {
      setErrorMessage(t('error.network_detail', { url: backendUrlForDisplay }));
    } else {
      setInfoMessage(t('connection.success'));
      setTimeout(() => setInfoMessage(''), 3000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-violet-100 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white px-8 py-10 shadow-xl ring-1 ring-slate-100">
        {/* Language Switcher */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => switchLocale(locale === 'ar' ? 'en' : 'ar')}
            className="text-xs text-slate-500 hover:text-primary-600 transition"
            aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            {locale === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        {/* Parent Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Parent Portal
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-purple-700">
            {t('login.parent_title', 'Parent Login')}
          </h1>
          <p className="text-sm text-slate-500">
            {t('login.parent_subtitle', 'Stay connected with your child\'s progress')}
          </p>
        </div>

        {/* Connection Status */}
        {(isCheckingConnection || backendStatus === false) && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              backendStatus === false
                ? 'bg-red-50 border border-red-200'
                : 'bg-blue-50 border border-blue-200'
            }`}
            role="alert"
            aria-live="polite"
            aria-label={t('aria.error_message')}
          >
            <div className="flex items-center gap-2">
              {isCheckingConnection ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-blue-700">{t('connection.checking')}</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-700 font-medium">{t('connection.failed')}</p>
                    <p className="text-red-600 text-xs mt-1">{t('connection.backend_url', { url: backendUrlForDisplay })}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="text-red-700 hover:text-red-800 font-medium text-xs underline"
                    aria-label={t('aria.retry_button')}
                  >
                    {t('login.retry')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <form
          id="parent-login-form"
          className="space-y-5"
          aria-label={t('aria.login_form')}
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage('');
            passwordMutation.mutate();
          }}
        >
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium text-slate-600"
                htmlFor="email"
              >
                {t('login.email_label')}
              </label>
              <input
                ref={emailInputRef}
                id="email"
                name="email"
                type="email"
                required
                disabled={isLoading}
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-1 block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                placeholder={t('login.email_placeholder')}
                dir="ltr"
                autoComplete="email"
                aria-label={t('aria.email_field')}
                aria-required="true"
                aria-describedby="email-hint"
              />
              <p id="email-hint" className="mt-1 text-xs text-slate-500">
                {t('login.email_hint')}
              </p>
            </div>

            {step === LoginStep.PASSWORD && (
              <div>
                <label
                  className="block text-sm font-medium text-slate-600"
                  htmlFor="password"
                >
                  {t('login.password_label')}
                </label>
                <input
                  ref={passwordInputRef}
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isLoading}
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="mt-1 block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  placeholder={t('login.password_placeholder')}
                  dir="ltr"
                  autoComplete="current-password"
                  aria-label={t('aria.password_field')}
                  aria-required="true"
                />
              </div>
            )}
          </div>

          {/* Success Message */}
          {infoMessage && (
            <div
              className="rounded-2xl px-4 py-3 text-sm bg-emerald-50 border border-emerald-200"
              role="status"
              aria-live="polite"
              aria-label={t('aria.success_message')}
            >
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-emerald-700">{infoMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {(errorMessage || authError) && (
            <div
              className="rounded-2xl px-4 py-3 text-sm bg-red-50 border border-red-200"
              role="alert"
              aria-live="assertive"
              aria-label={t('aria.error_message')}
            >
              <div className="flex items-start gap-2">
                <svg className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-700">{errorMessage || authError}</p>
                  {retryCount > 2 && (
                    <p className="text-red-600 text-xs mt-1">
                      {t('error.too_many_attempts', { minutes: Math.ceil(retryCount / 2) })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || backendStatus === false}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            aria-label={t('aria.submit_button')}
            aria-busy={isLoading}
          >
            {isLoading && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>
              {isLoading
                ? t('login.loading')
                : step === LoginStep.PASSWORD
                ? t('login.submit_login')
                : t('login.submit_continue')
              }
            </span>
          </button>

          {/* Links */}
          <div className="text-center space-y-2">
            <a
              href="/forgot-password"
              className="text-sm text-purple-600 hover:text-purple-800 transition"
            >
              {t('login.forgot_password', 'Forgot Password?')}
            </a>
            <div className="flex justify-center space-x-4 text-xs text-slate-500">
              <a href="/login" className="hover:text-slate-700 transition">Admin</a>
              <span>|</span>
              <a href="/manager-login" className="hover:text-slate-700 transition">Manager</a>
              <span>|</span>
              <a href="/supervisor-login" className="hover:text-slate-700 transition">Supervisor</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}