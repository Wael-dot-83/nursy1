import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';

const eventTypeFilters = [
  { value: '', label: 'الكل' },
  { value: 'create', label: 'إنشاء' },
  { value: 'update', label: 'تحديث' },
  { value: 'delete', label: 'حذف' },
  { value: 'login', label: 'تسجيل دخول' },
];

export default function ManagerAudit() {
  const [filters, setFilters] = useState({
    userId: '',
    eventType: '',
    entity: '',
    limit: 50,
    offset: 0,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['manager-audit-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.userId) params.append('user_id', filters.userId);
      if (filters.eventType) params.append('event_type', filters.eventType);
      if (filters.entity) params.append('entity', filters.entity);
      params.append('limit', filters.limit.toString());
      params.append('offset', filters.offset.toString());

      const response = await apiClient.get(`/manager/audit/logs?${params}`);
      return response.data;
    },
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, offset: 0 })); // Reset pagination
  };

  const handlePageChange = (direction) => {
    setFilters(prev => ({
      ...prev,
      offset: Math.max(0, prev.offset + (direction * prev.limit))
    }));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">سجل التدقيق</h2>
        <p className="mt-1 text-sm text-slate-500">مراجعة جميع العمليات والتغييرات في النظام</p>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <h3 className="card-title">تصفية السجلات</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">معرف المستخدم</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              placeholder="أدخل معرف المستخدم"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">نوع العملية</label>
            <select
              value={filters.eventType}
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            >
              {eventTypeFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">الكيان</label>
            <select
              value={filters.entity}
              onChange={(e) => handleFilterChange('entity', e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="">الكل</option>
              <option value="user">مستخدم</option>
              <option value="child">طفل</option>
              <option value="parent">ولي أمر</option>
              <option value="report">تقرير</option>
              <option value="nursery">حضانة</option>
              <option value="document">مستند</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">عدد السجلات</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && <div className="card text-sm text-slate-500">جاري تحميل السجلات ...</div>}
      {isError && <div className="card text-sm text-red-500">{handleApiError(error)}</div>}

      {data && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="card-title">سجل العمليات</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(-1)}
                disabled={filters.offset === 0}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <button
                onClick={() => handlePageChange(1)}
                disabled={!data || data.length < filters.limit}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          </div>

          {data.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      التاريخ والوقت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      المستخدم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      العملية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      الكيان
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      التفاصيل
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {data.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {new Date(log.created_at).toLocaleString('ar-JO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {log.actor?.full_name || `معرف: ${log.actor_user_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          log.event_type === 'create' ? 'bg-green-100 text-green-800' :
                          log.event_type === 'update' ? 'bg-blue-100 text-blue-800' :
                          log.event_type === 'delete' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.event_type === 'create' ? 'إنشاء' :
                           log.event_type === 'update' ? 'تحديث' :
                           log.event_type === 'delete' ? 'حذف' :
                           log.event_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {log.entity} {log.entity_id && `(ID: ${log.entity_id})`}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 max-w-xs truncate">
                        {log.meta?.details || log.meta?.message || 'لا توجد تفاصيل'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              لا توجد سجلات تدقيق تطابق المعايير المحددة
            </div>
          )}
        </div>
      )}
    </div>
  );
}