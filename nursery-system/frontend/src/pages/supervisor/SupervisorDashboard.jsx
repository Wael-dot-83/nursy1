import { useQuery } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';

export default function SupervisorDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['supervisor-children'],
    queryFn: async () => {
      const response = await apiClient.get('/api/supervisor/children');
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-800">لوحة تحكم المشرف</h2>
        <p className="mt-1 text-sm text-slate-500">تابع الأطفال المكلف بهم وأنشئ التقارير اليومية بسهولة</p>
      </header>

      {isLoading && <div className="card text-sm text-slate-500">جاري تحميل البيانات ...</div>}
      {isError && <div className="card text-sm text-red-500">{handleApiError(error)}</div>}

      {Array.isArray(data) && data.length ? (
        <div className="grid gap-4">
          {data.map((child) => (
            <div key={child.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-800">{child.fullName}</p>
                <span className="text-xs text-slate-500">
                  تاريخ الميلاد:
                  {' '}
                  {child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('ar-JO') : 'غير محدد'}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                أولياء الأمور:
                {' '}
                {Array.isArray(child.parents) && child.parents.length
                  ? child.parents.map((link) => link.parent?.fullName).join('، ')
                  : '—'}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  القسم:
                  {' '}
                  {child.classroom?.name || 'غير محدد'}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  الفرع:
                  {' '}
                  {child.branch?.name || '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && <div className="card text-sm text-slate-500">لم يتم تكليفك بأي أطفال حالياً.</div>
      )}
    </div>
  );
}
