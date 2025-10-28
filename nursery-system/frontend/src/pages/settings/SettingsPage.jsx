import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient, handleApiError } from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [deviceToken, setDeviceToken] = useState('');

  const preferencesQuery = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications/preferences');
      return response.data;
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (payload) => apiClient.put('/notifications/preferences', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      setDeviceToken('');
    },
  });

  const togglePreference = (key) => {
    const current = preferencesQuery.data?.preferences?.[key] ?? (key !== 'email');
    updatePreferencesMutation.mutate({
      preferences: {
        ...preferencesQuery.data?.preferences,
        [key]: !current,
      },
    });
  };

  const registerDeviceToken = () => {
    if (!deviceToken.trim()) return;
    updatePreferencesMutation.mutate({
      deviceToken: deviceToken.trim(),
    });
  };

  const removeDeviceToken = (token) => {
    updatePreferencesMutation.mutate({
      removeDeviceToken: token,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">إعدادات الحساب</h2>
        <p className="mt-1 text-sm text-slate-500">قم بإدارة تفضيلات الإشعارات وربط الأجهزة الخاصة بك</p>
      </div>

      <section className="card space-y-4">
        <div>
          <h3 className="card-title">معلومات المستخدم</h3>
          <p className="card-subtitle">مرجع سريع لبيانات حسابك</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-400">الاسم</p>
            <p className="text-sm font-medium text-slate-700">{user?.fullName || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">الدور</p>
            <p className="text-sm font-medium text-slate-700">{role}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">البريد</p>
            <p className="text-sm font-medium text-slate-700">{user?.email || '—'}</p>
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <h3 className="card-title">تفضيلات الإشعارات</h3>
          <p className="card-subtitle">حدد القنوات المناسبة لتلقي التنبيهات</p>
        </div>
        {preferencesQuery.isLoading ? (
          <p className="text-sm text-slate-500">جاري تحميل التفضيلات ...</p>
        ) : preferencesQuery.isError ? (
          <p className="text-sm text-red-500">{handleApiError(preferencesQuery.error)}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {['in_app', 'push', 'email'].map((key) => {
              const isEnabled = preferencesQuery.data?.preferences?.[key] ?? (key !== 'email');
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePreference(key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isEnabled ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {key === 'in_app' && 'داخل النظام'}
                  {key === 'push' && 'إشعارات الجوال'}
                  {key === 'email' && 'البريد الإلكتروني'}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="card space-y-4">
        <div>
          <h3 className="card-title">أجهزة التنبيه</h3>
          <p className="card-subtitle">أدخل رمز جهاز FCM لربط الهاتف المحمول</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={deviceToken}
            onChange={(event) => setDeviceToken(event.target.value)}
            placeholder="أدخل رمز الجهاز"
            className="flex-1 rounded-2xl border-slate-200 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={registerDeviceToken}
            className="rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            disabled={updatePreferencesMutation.isLoading}
          >
            حفظ الجهاز
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">الأجهزة المسجلة</p>
          <div className="flex flex-wrap gap-2">
            {preferencesQuery.data?.deviceTokens?.length ? (
              preferencesQuery.data.deviceTokens.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => removeDeviceToken(token)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-red-100 hover:text-red-600"
                >
                  {`${token.slice(0, 6)}...`}
                </button>
              ))
            ) : (
              <span className="text-xs text-slate-400">لا توجد أجهزة مسجلة</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
