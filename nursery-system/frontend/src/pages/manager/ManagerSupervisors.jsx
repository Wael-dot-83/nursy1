import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';

export default function ManagerSupervisors() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    branchId: null,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['manager-supervisors'],
    queryFn: async () => {
      const response = await apiClient.get('/api/manager/supervisors');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (supervisorData) => apiClient.post('/api/manager/supervisors', supervisorData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-supervisors'] });
      setShowAddModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/manager/supervisors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-supervisors'] });
      setEditingSupervisor(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/manager/supervisors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-supervisors'] });
    },
  });

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      branchId: null,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSupervisor) {
      updateMutation.mutate({ id: editingSupervisor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (supervisor) => {
    setEditingSupervisor(supervisor);
    setFormData({
      fullName: supervisor.fullName,
      email: supervisor.email,
      phone: supervisor.phone || '',
      branchId: supervisor.branchId,
    });
  };

  const handleDelete = (supervisor) => {
    if (window.confirm(`هل أنت متأكد من حذف المشرف ${supervisor.fullName}؟`)) {
      deleteMutation.mutate(supervisor.id);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">المشرفون</h2>
          <p className="mt-1 text-sm text-slate-500">متابعة أداء فريق الإشراف وأحدث نشاطاتهم</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          إضافة مشرف جديد
        </button>
      </header>

      {isLoading && <div className="card text-sm text-slate-500">جاري تحميل البيانات ...</div>}
      {isError && <div className="card text-sm text-red-500">{handleApiError(error)}</div>}

      {data?.length ? (
        <div className="space-y-4">
          {data.map((supervisor) => (
            <div key={supervisor.id} className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-800">{supervisor.fullName}</p>
                  <p className="text-xs text-slate-500">{supervisor.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">
                    آخر دخول:
                    {' '}
                    {supervisor.lastLogin ? new Date(supervisor.lastLogin).toLocaleDateString('ar-JO') : 'لم يسجل بعد'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleEdit(supervisor)}
                    className="rounded px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(supervisor)}
                    className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    حذف
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-500">إجمالي التقارير</p>
                  <p className="mt-1 text-xl font-semibold text-slate-800">{supervisor.performance.total ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-500">المعتمدة</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-600">{supervisor.performance.approved ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-500">بانتظار الاعتماد</p>
                  <p className="mt-1 text-xl font-semibold text-amber-600">{supervisor.performance.pending ?? 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && <div className="card text-sm text-slate-500">لا يوجد مشرفون مسجلون.</div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingSupervisor) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">
              {editingSupervisor ? 'تعديل المشرف' : 'إضافة مشرف جديد'}
            </h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">الاسم الكامل</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">رقم الهاتف</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSupervisor(null);
                    resetForm();
                  }}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {createMutation.isLoading || updateMutation.isLoading ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
