import { useQuery } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';

export default function ParentReports() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['parent-reports'],
    queryFn: async () => {
      const response = await apiClient.get('/api/parent/reports');
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">تقارير الأطفال</h2>
        <p className="mt-1 text-sm text-slate-500">عرض التقارير اليومية المعتمدة من إدارة الحضانة</p>
      </div>

      {isLoading && <div className="card text-sm text-slate-500">جاري تحميل التقارير ...</div>}
      {isError && <div className="card text-sm text-red-500">{handleApiError(error)}</div>}

      {data?.length ? (
        <div className="space-y-4">
          {data.map((report) => (
            <div key={report.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-800">{report.child?.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {report.supervisor?.fullName}
                    {' • '}
                    {report.reportDate ? new Date(report.reportDate).toLocaleDateString('ar-JO') : '—'}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                  {report.status === 'approved' ? 'معتمد' : 'اطلع عليه'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  الوجبات:
                  {' '}
                  {Array.isArray(report.meals) && report.meals.length
                    ? report.meals.map((meal) => meal.type || meal).join('، ')
                    : '—'}
                </p>
                <p>
                  النشاطات:
                  {' '}
                  {Array.isArray(report.activities) && report.activities.length
                    ? report.activities.map((activity) => activity.name || activity).join('، ')
                    : '—'}
                </p>
                <p>
                  الملاحظات:
                  {' '}
                  {report.behaviorNotes || report.managerNotes || 'لا توجد ملاحظات مسجلة'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && <div className="card text-sm text-slate-500">لا توجد تقارير معتمدة حتى الآن.</div>
      )}
    </div>
  );
}
