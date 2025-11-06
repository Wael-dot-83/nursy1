import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';

export default function ParentNotifications() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['parent-notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/api/parent/notifications');
      return response.data;
    },
  });

  const preferencesQuery = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await apiClient.get('/api/notifications/preferences');
      return response.data;
    },
  });

  const preferencesMutation = useMutation({
    mutationFn: (preferences) => apiClient.put('/api/notifications/preferences', { preferences }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-800">الإشعارات</h2>
        <p className="mt-1 text-sm text-slate-500">استعرض جميع التنبيهات وقم بإدارة تفضيلات التنبيه</p>
      </header>

      <section className="card space-y-4">
        <div>
          <h3 className="card-title">تفضيلات الإشعارات</h3>
          <p className="card-subtitle">اختر القنوات التي ترغب باستلام التنبيهات عبرها</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {['in_app', 'push', 'email'].map((channel) => {
            const isEnabled = preferencesQuery.data?.preferences?.[channel] ?? channel !== 'email';
            return (
              <button
                key={channel}
                type="button"
                onClick={() => preferencesMutation.mutate({
                  ...preferencesQuery.data?.preferences,
                  [channel]: !isEnabled,
                })}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isEnabled ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {channel === 'in_app' && 'داخل النظام'}
                {channel === 'push' && 'إشعارات الجوال'}
                {channel === 'email' && 'البريد الإلكتروني'}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <h3 className="card-title">جميع الإشعارات</h3>
          <p className="card-subtitle">أحدث الرسائل المرسلة إلى حسابك</p>
        </div>

        {isLoading && <p className="text-sm text-slate-500">جاري التحميل ...</p>}
        {isError && <p className="text-sm text-red-500">{handleApiError(error)}</p>}

        <div className="space-y-3">
          {data?.length ? (
            data.map((notification) => (
              <div key={notification.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-700">{notification.title}</p>
                  <span className="text-xs text-slate-400">
                    {new Date(notification.createdAt).toLocaleString('ar-JO')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
              </div>
            ))
          ) : (
            !isLoading && <p className="text-sm text-slate-500">لا توجد إشعارات حالياً.</p>
          )}
        </div>
      </section>
    </div>
  );
}
