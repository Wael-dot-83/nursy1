import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';

const statusFilters = [
  { value: 'submitted,approved', label: 'الكل' },
  { value: 'submitted', label: 'بانتظار الاعتماد' },
  { value: 'approved', label: 'معتمدة' },
  { value: 'revision_needed', label: 'تحتاج تعديل' },
];

export default function ManagerReports() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(statusFilters[0].value);
  const [editingReport, setEditingReport] = useState(null);
  const [editFormData, setEditFormData] = useState({
    activities: [],
    meals: { breakfast: '', lunch: '', snacks: [] },
    healthObservations: { notes: '' },
    behaviorNotes: '',
    managerNotes: '',
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['manager-reports', status],
    queryFn: async () => {
      const response = await apiClient.get('/api/manager/reports', {
        params: { status },
      });
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id }) => apiClient.put(`/api/manager/reports/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-reports'] });
    },
  });

  const reviseMutation = useMutation({
    mutationFn: ({ id, managerNotes }) => apiClient.put(`/api/manager/reports/${id}/revise`, { managerNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-reports'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/api/manager/reports/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-reports'] });
      setEditingReport(null);
      resetEditForm();
    },
  });

  const resetEditForm = () => {
    setEditFormData({
      activities: [],
      meals: { breakfast: '', lunch: '', snacks: [] },
      healthObservations: { notes: '' },
      behaviorNotes: '',
      managerNotes: '',
    });
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setEditFormData({
      activities: report.activities || [],
      meals: report.meals || { breakfast: '', lunch: '', snacks: [] },
      healthObservations: report.healthObservations || { notes: '' },
      behaviorNotes: report.behaviorNotes || '',
      managerNotes: report.managerNotes || '',
    });
  };

  const handleUpdateReport = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: editingReport.id, data: editFormData });
  };

  const addActivity = () => {
    setEditFormData({
      ...editFormData,
      activities: [...editFormData.activities, { title: '', description: '' }],
    });
  };

  const updateActivity = (index, field, value) => {
    const updatedActivities = [...editFormData.activities];
    updatedActivities[index] = { ...updatedActivities[index], [field]: value };
    setEditFormData({ ...editFormData, activities: updatedActivities });
  };

  const removeActivity = (index) => {
    const updatedActivities = editFormData.activities.filter((_, i) => i !== index);
    setEditFormData({ ...editFormData, activities: updatedActivities });
  };

  const updateMeal = (mealType, value) => {
    setEditFormData({
      ...editFormData,
      meals: { ...editFormData.meals, [mealType]: value },
    });
  };

  const addSnack = () => {
    setEditFormData({
      ...editFormData,
      meals: {
        ...editFormData.meals,
        snacks: [...editFormData.meals.snacks, ''],
      },
    });
  };

  const updateSnack = (index, value) => {
    const updatedSnacks = [...editFormData.meals.snacks];
    updatedSnacks[index] = value;
    setEditFormData({
      ...editFormData,
      meals: { ...editFormData.meals, snacks: updatedSnacks },
    });
  };

  const removeSnack = (index) => {
    const updatedSnacks = editFormData.meals.snacks.filter((_, i) => i !== index);
    setEditFormData({
      ...editFormData,
      meals: { ...editFormData.meals, snacks: updatedSnacks },
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">التقارير اليومية</h2>
          <p className="mt-1 text-sm text-slate-500">راجع واعتمد تقارير المشرفين اليومية</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                status === filter.value ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-600 hover:bg-primary-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {isLoading && <div className="card text-sm text-slate-500">جاري تحميل التقارير ...</div>}
      {isError && <div className="card text-sm text-red-500">{handleApiError(error)}</div>}

      {data?.length ? (
        <div className="space-y-4">
          {data.map((report) => (
            <div key={report.id} className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-800">{report.child?.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(report.reportDate).toLocaleDateString('ar-JO')}
                    {' • '}
                    {report.supervisor?.fullName}
                  </p>
                </div>
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">
                  {report.status === 'approved'
                    ? 'معتمد'
                    : report.status === 'submitted'
                      ? 'بانتظار الاعتماد'
                      : report.status === 'revision_needed'
                        ? 'مطلوب تعديل'
                        : 'مسودة'}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h4 className="text-sm font-semibold text-slate-600">النشاطات</h4>
                  <ul className="mt-2 list-disc space-y-1 pr-4 text-sm text-slate-600">
                    {Array.isArray(report.activities) && report.activities.length
                      ? report.activities.map((activity, index) => <li key={index}>{activity.title || activity.name || activity}</li>)
                      : <li>لا توجد نشاطات مسجلة</li>}
                  </ul>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <h4 className="text-sm font-semibold text-slate-600">الملاحظات الصحية</h4>
                  <p className="mt-2 text-sm text-slate-600">
                    {report?.healthObservations?.notes || report.behaviorNotes || 'لا توجد ملاحظات'}
                  </p>
                </div>
              </div>

              {report.status === 'submitted' && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleEdit(report)}
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    تعديل التقرير
                  </button>
                  <button
                    type="button"
                    onClick={() => approveMutation.mutate({ id: report.id })}
                    className="rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    disabled={approveMutation.isLoading}
                  >
                    {approveMutation.isLoading ? 'جاري الاعتماد...' : 'اعتماد التقرير'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const managerNotes = window.prompt('أدخل ملاحظات لطلب التعديل:', report.managerNotes || '');
                      if (managerNotes !== null) {
                        reviseMutation.mutate({ id: report.id, managerNotes });
                      }
                    }}
                    className="rounded-full border border-primary-600 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
                    disabled={reviseMutation.isLoading}
                  >
                    {reviseMutation.isLoading ? '...جاري الإرسال' : 'طلب تعديل'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !isLoading && <div className="card text-sm text-slate-500">لا توجد تقارير ضمن هذا الفلتر حالياً.</div>
      )}

      {/* Edit Report Modal */}
      {editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">
                تعديل تقرير {editingReport.child?.fullName}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingReport(null);
                  resetEditForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateReport} className="space-y-6">
              {/* Activities Section */}
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-semibold text-slate-700">النشاطات</h4>
                  <button
                    type="button"
                    onClick={addActivity}
                    className="rounded bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-700"
                  >
                    إضافة نشاط
                  </button>
                </div>
                <div className="space-y-3">
                  {editFormData.activities.map((activity, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="عنوان النشاط"
                          value={activity.title}
                          onChange={(e) => updateActivity(index, 'title', e.target.value)}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="وصف النشاط"
                          value={activity.description}
                          onChange={(e) => updateActivity(index, 'description', e.target.value)}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeActivity(index)}
                        className="text-red-500 hover:text-red-700 mt-2"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meals Section */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="text-md font-semibold text-slate-700 mb-4">الوجبات</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الفطور</label>
                    <input
                      type="text"
                      value={editFormData.meals.breakfast}
                      onChange={(e) => updateMeal('breakfast', e.target.value)}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الغداء</label>
                    <input
                      type="text"
                      value={editFormData.meals.lunch}
                      onChange={(e) => updateMeal('lunch', e.target.value)}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">الوجبات الخفيفة</label>
                    <button
                      type="button"
                      onClick={addSnack}
                      className="rounded bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-700"
                    >
                      إضافة وجبة خفيفة
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editFormData.meals.snacks.map((snack, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="اسم الوجبة الخفيفة"
                          value={snack}
                          onChange={(e) => updateSnack(index, e.target.value)}
                          className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeSnack(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Health Observations */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="text-md font-semibold text-slate-700 mb-4">الملاحظات الصحية</h4>
                <textarea
                  value={editFormData.healthObservations.notes}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    healthObservations: { ...editFormData.healthObservations, notes: e.target.value }
                  })}
                  rows={3}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="أدخل الملاحظات الصحية..."
                />
              </div>

              {/* Behavior Notes */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="text-md font-semibold text-slate-700 mb-4">ملاحظات السلوك</h4>
                <textarea
                  value={editFormData.behaviorNotes}
                  onChange={(e) => setEditFormData({ ...editFormData, behaviorNotes: e.target.value })}
                  rows={3}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="أدخل ملاحظات السلوك..."
                />
              </div>

              {/* Manager Notes */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="text-md font-semibold text-slate-700 mb-4">ملاحظات المدير</h4>
                <textarea
                  value={editFormData.managerNotes}
                  onChange={(e) => setEditFormData({ ...editFormData, managerNotes: e.target.value })}
                  rows={3}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="أدخل ملاحظاتك كمدير..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setEditingReport(null);
                    resetEditForm();
                  }}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isLoading}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {updateMutation.isLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
