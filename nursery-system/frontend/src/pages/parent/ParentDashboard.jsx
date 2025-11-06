import { useQuery } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';

export default function ParentDashboard() {
  const childrenQuery = useQuery({
    queryKey: ['parent-children'],
    queryFn: async () => {
      const response = await apiClient.get('/api/parent/children');
      return response.data;
    },
  });

  const notificationsQuery = useQuery({
    queryKey: ['parent-notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/api/parent/notifications');
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">لوحة ولي الأمر</h2>
        <p className="mt-1 text-sm text-slate-500">تابع أحدث التقارير والإشعارات الخاصة بأطفالك</p>
      </div>

      {childrenQuery.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {childrenQuery.data.map((child) => (
            <div key={child.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-800">{child.fullName}</p>
                <span className="text-xs text-slate-500">
                  {child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('ar-JO') : 'غير محدد'}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                آخر تقرير:
                {' '}
                {child.updatedAt ? new Date(child.updatedAt).toLocaleDateString('ar-JO') : 'لم يصدر تقرير بعد'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-sm text-slate-500">
          {childrenQuery.isLoading ? 'جاري تحميل بيانات الأطفال ...' : 'لم يتم تسجيل أطفال حتى الآن.'}
        </div>
      )}

      <div className="card space-y-4">
        <div>
          <h3 className="card-title">الإشعارات الأخيرة</h3>
          <p className="card-subtitle">ابقَ على اطلاع على التحديثات المهمة</p>
        </div>
        {notificationsQuery.isLoading && <p className="text-sm text-slate-500">جاري تحميل الإشعارات ...</p>}
        {notificationsQuery.isError && (
          <p className="text-sm text-red-500">{handleApiError(notificationsQuery.error)}</p>
        )}
        <div className="space-y-3">
          {notificationsQuery.data?.length ? (
            notificationsQuery.data.slice(0, 5).map((notification) => (
              <div key={notification.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-700">{notification.title}</p>
                  <span className="text-xs text-slate-400">
                    {new Date(notification.createdAt).toLocaleString('ar-JO')}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
              </div>
            ))
          ) : (
            !notificationsQuery.isLoading && <p className="text-sm text-slate-500">لا توجد إشعارات جديدة.</p>
          )}
        </div>
      </div>
    </div>
  );
}
