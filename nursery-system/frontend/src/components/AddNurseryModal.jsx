import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, getEndpoint } from '../lib/apiClient';

export default function AddNurseryModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    mainPhone: '',
    isBranch: false,
    branchName: '',
    email: '',
    governorate: '',
    city: '',
    postalCode: '',
    addressLine: '',
    minAgeDays: 70,
    maxAgeMonths: 52,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [managerData, setManagerData] = useState(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post(getEndpoint('/admin/nurseries/new'), data);
      return response.data;
    },
    onSuccess: (data) => {
      setManagerData(data);
      setShowSuccess(true);
      queryClient.invalidateQueries(['nurseries']);
    },
    onError: (error) => {
      const detail = error.response?.data?.detail;
      if (detail?.code === 'NURSERY_NAME_TAKEN') {
        setErrors({ name: detail.message });
      } else if (detail?.code === 'NURSERY_PHONE_TAKEN') {
        setErrors({ mainPhone: detail.message });
      } else if (detail?.code === 'INVALID_PHONE') {
        setErrors({ mainPhone: detail.message });
      } else if (detail?.code === 'INVALID_BRANCH_NAME') {
        setErrors({ branchName: detail.message });
      } else {
        setErrors({ general: detail?.message || 'حدث خطأ غير متوقع، حاول لاحقًا' });
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    mutation.mutate(formData);
  };

  const handleCopyAll = () => {
    if (!managerData?.manager) return;
    const text = `النطاق: ${managerData.scope}\nالبريد الإلكتروني: ${managerData.manager.email}\nكلمة المرور المؤقتة: ${managerData.manager.tempPassword}`;
    navigator.clipboard.writeText(text);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (showSuccess && managerData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-800">تم إنشاء الحضانة بنجاح!</h3>
            <p className="mt-2 text-sm text-slate-600">
              تم إنشاء حساب مدير تلقائياً. يرجى حفظ بيانات الدخول التالية:
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex justify-end">
              <button
                onClick={handleCopyAll}
                className="rounded-md bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
              >
                نسخ جميع البيانات
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">النطاق</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={managerData.scope}
                      className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => handleCopy(managerData.scope)}
                      className="rounded-md bg-slate-200 px-3 py-2 text-xs hover:bg-slate-300"
                    >
                      نسخ
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">البريد الإلكتروني</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={managerData.manager.email}
                      className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono"
                    />
                    <button
                      onClick={() => handleCopy(managerData.manager.email)}
                      className="rounded-md bg-slate-200 px-3 py-2 text-xs hover:bg-slate-300"
                    >
                      نسخ
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">كلمة المرور المؤقتة</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={managerData.manager.tempPassword}
                      className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono"
                    />
                    <button
                      onClick={() => handleCopy(managerData.manager.tempPassword)}
                      className="rounded-md bg-slate-200 px-3 py-2 text-xs hover:bg-slate-300"
                    >
                      نسخ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setShowSuccess(false);
                onSuccess();
                onClose();
              }}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              إنشاء
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-800">إضافة حضانة جديدة</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{errors.general}</div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">اسم الحضانة *</label>
              <input
                type="text"
                required
                minLength={3}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                  errors.name ? 'border-red-300' : 'border-slate-300'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">رقم الهاتف الرئيسي *</label>
              <input
                type="tel"
                required
                placeholder="07XXXXXXXX"
                value={formData.mainPhone}
                onChange={(e) => setFormData({ ...formData, mainPhone: e.target.value })}
                className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                  errors.mainPhone ? 'border-red-300' : 'border-slate-300'
                }`}
              />
              {errors.mainPhone && <p className="mt-1 text-sm text-red-600">{errors.mainPhone}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isBranch"
              checked={formData.isBranch}
              onChange={(e) => setFormData({ ...formData, isBranch: e.target.checked })}
              className="h-4 w-4 text-primary-600"
            />
            <label htmlFor="isBranch" className="text-sm font-medium text-slate-700">
              هذا فرع لحضانة موجودة
            </label>
          </div>

          {formData.isBranch && (
            <div>
              <label className="block text-sm font-medium text-slate-700">اسم الفرع *</label>
              <input
                type="text"
                required={formData.isBranch}
                minLength={3}
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                  errors.branchName ? 'border-red-300' : 'border-slate-300'
                }`}
              />
              {errors.branchName && <p className="mt-1 text-sm text-red-600">{errors.branchName}</p>}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">المحافظة</label>
              <input
                type="text"
                value={formData.governorate}
                onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">المدينة</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">الرمز البريدي</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">العنوان</label>
            <input
              type="text"
              value={formData.addressLine}
              onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">الحد الأدنى للعمر (أيام)</label>
              <input
                type="number"
                min="0"
                value={formData.minAgeDays}
                onChange={(e) => setFormData({ ...formData, minAgeDays: parseInt(e.target.value) || 70 })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">الحد الأقصى للعمر (أشهر)</label>
              <input
                type="number"
                min="0"
                value={formData.maxAgeMonths}
                onChange={(e) => setFormData({ ...formData, maxAgeMonths: parseInt(e.target.value) || 52 })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">ملاحظات</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'جاري الإنشاء...' : 'إنشاء'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
