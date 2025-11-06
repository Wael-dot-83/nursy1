import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { handleApiError, checkBackendHealth, API_BASE_URL } from '../../lib/apiClient';
import { useConnection } from '../../contexts/ConnectionContext';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, locale, switchLocale } = useI18n();
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
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
  const passwordInputRef = useRef(null);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  // Auto-focus password field on mount
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

    // Auto-focus password field on mount
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }

    // Validate token and email are present
    if (!token || !email) {
      setErrorMessage(t('reset_password.invalid_link', 'Invalid or expired reset link. Please request a new password reset.'));
    }
  }, [t, backendUrlForDisplay, token, email]);

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (form.password !== form.confirmPassword) {
        throw new Error(t('reset_password.password_mismatch', 'Passwords do not match'));
      }

      if (form.password.length < 8) {
        throw new Error(t('reset_password.password_too_short', 'Password must be at least 8 characters long'));
      }

      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          new_password: form.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reset password');
      }

      return response.json();
    },
    onSuccess: () => {
      setErrorMessage('');
      setInfoMessage(t('reset_password.success_message', 'Password has been reset successfully. You can now log in with your new password.'));
      setRetryCount(0);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    },
    onError: (error) => {
      setRetryCount(prev => prev + 1);
      setErrorMessage(handleApiError(error, t));
    },
  });

  const isLoading = resetPasswordMutation.isPending;
  const handleRetry = async () => {
    setIsCheckingConnection(true);
    setErrorMessage('');
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

  const isValidToken = token && email;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
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

        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-700">
            {t('reset_password.title', 'Reset Password')}
          </h1>
          <p className="text-sm text-slate-500">
            {t('reset_password.subtitle', 'Enter your new password below')}
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
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

        {!isValidToken ? (
          <div className="space-y-4">
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
                  <p className="text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-sm text-slate-600 hover:text-slate-800 transition underline"
              >
                {t('reset_password.request_new_link', 'Request a new password reset link')}
              </a>
            </div>
          </div>
        ) : (
          <form
            className="space-y-5"
            aria-label={t('aria.reset_password_form')}
            onSubmit={(event) => {
              event.preventDefault();
              setErrorMessage('');
              resetPasswordMutation.mutate();
            }}
          >
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium text-slate-600"
                    htmlFor="password"
                  >
                    {t('reset_password.new_password_label', 'New Password')}
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
                    className="mt-1 block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-slate-500 focus:ring-slate-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    placeholder={t('reset_password.password_placeholder', 'Enter your new password')}
                    dir="ltr"
                    autoComplete="new-password"
                    aria-label={t('aria.password_field')}
                    aria-required="true"
                    aria-describedby="password-hint"
                  />
                  <p id="password-hint" className="mt-1 text-xs text-slate-500">
                    {t('reset_password.password_hint', 'Must be at least 8 characters long')}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-slate-600"
                    htmlFor="confirmPassword"
                  >
                    {t('reset_password.confirm_password_label', 'Confirm New Password')}
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    disabled={isLoading}
                    value={form.confirmPassword}
                    onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    className="mt-1 block w-full rounded-2xl border-slate-200 text-sm shadow-sm focus:border-slate-500 focus:ring-slate-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    placeholder={t('reset_password.confirm_placeholder', 'Confirm your new password')}
                    dir="ltr"
                    autoComplete="new-password"
                    aria-label={t('aria.confirm_password_field')}
                    aria-required="true"
                  />
                </div>
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
            {errorMessage && (
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
                    <p className="text-red-700">{errorMessage}</p>
                    {retryCount > 2 && (
                      <p className="text-red-600 text-xs mt-1">
                        {t('error.too_many_attempts', { minutes: Math.ceil(retryCount / 2) })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}              <button
                type="submit"
                disabled={isLoading || backendStatus === false}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
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
                    ? t('reset_password.loading', 'Resetting...')
                    : t('reset_password.submit', 'Reset Password')
                  }
                </span>
              </button>

              {/* Links */}
              <div className="text-center space-y-2">
                <div className="flex justify-center space-x-4 text-xs text-slate-500">
                  <a href="/login" className="hover:text-slate-700 transition">Admin Login</a>
                  <span>|</span>
                  <a href="/manager-login" className="hover:text-slate-700 transition">Manager Login</a>
                  <span>|</span>
                  <a href="/supervisor-login" className="hover:text-slate-700 transition">Supervisor Login</a>
                  <span>|</span>
                  <a href="/parent-login" className="hover:text-slate-700 transition">Parent Login</a>
                </div>
              </div>
            </form>
        )}
      </div>
    </div>
  );
}