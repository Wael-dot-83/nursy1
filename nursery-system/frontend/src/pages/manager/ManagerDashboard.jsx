import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';
import { useState } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ManagerDashboard() {
  const [isEditingNursery, setIsEditingNursery] = useState(false);
  const [nurseryForm, setNurseryForm] = useState({
    main_phone: '',
    email: '',
    main_street: '',
    main_city: '',
    main_governorate: '',
    main_postal_code: ''
  });
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['manager-dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/api/manager/dashboard');
      return response.data;
    },
  });

  const { data: nurseryData } = useQuery({
    queryKey: ['manager-nursery'],
    queryFn: async () => {
      const response = await apiClient.get('/api/manager/nurseries');
      return response.data[0]; // Manager manages only one nursery
    },
  });

  const updateNurseryMutation = useMutation({
    mutationFn: async (updateData) => {
      const nurseryId = nurseryData?.id;
      if (!nurseryId) {
        throw new Error('Nursery ID is not available.');
      }
      return apiClient.put(`/manager/nurseries/${nurseryId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['manager-nursery']);
      setIsEditingNursery(false);
      setGeneralError('');
      setFieldErrors({});
    },
    onError: (error) => {
      const fieldErrs = error?.response?.data?.errors || {};
      setFieldErrors(fieldErrs);
      const generalErr = error?.response?.data?.message || error?.message || 'حدث خطأ غير معروف';
      setGeneralError(generalErr);
    },
  });

  const handleEditNursery = () => {
    if (nurseryData) {
      setNurseryForm({
        main_phone: nurseryData.main_phone || '',
        email: nurseryData.email || '',
        main_street: nurseryData.main_street || '',
        main_city: nurseryData.main_city || '',
        main_governorate: nurseryData.main_governorate || '',
        main_postal_code: nurseryData.main_postal_code || ''
      });
    }
    setIsEditingNursery(true);
    setGeneralError('');
    setFieldErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditingNursery(false);
    setGeneralError('');
    setFieldErrors({});
  };

  const handleSaveNursery = () => {
    // Only send fields that have values
    const updateData = {};
    Object.keys(nurseryForm).forEach(key => {
      if (nurseryForm[key] !== '') {
        updateData[key] = nurseryForm[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      setGeneralError('يجب تحديث حقل واحد على الأقل');
      return;
    }

    updateNurseryMutation.mutate(updateData);
  };

  const handleInputChange = (field, value) => {
    setNurseryForm(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">لوحة تحكم المدير</h2>
        <p className="mt-1 text-sm text-slate-500">نظرة سريعة على أداء الحضانة اليومية</p>
      </div>

      {isLoading && <div className="card text-sm text-slate-500">جاري التحميل ...</div>}
      {isError && <div className="card text-sm text-red-500">{handleApiError(error)}</div>}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <p className="text-sm text-slate-500">عدد الأطفال</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{data.totals?.children ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">عدد المشرفين</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{data.totals?.supervisors ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">تقارير قيد المراجعة</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{data.totals?.pendingReports ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">تقارير معتمدة</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{data.totals?.approvedReports ?? 0}</p>
          </div>
        </div>
      )}

      {/* Nursery Settings */}
      {nurseryData && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title">إعدادات الحضانة</h3>
              <p className="card-subtitle">تحديث معلومات الحضانة الأساسية</p>
            </div>
            {!isEditingNursery && (
              <button
                onClick={handleEditNursery}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <PencilIcon className="h-4 w-4" />
                تحديث المعلومات
              </button>
            )}
          </div>

          {generalError && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-800">{generalError}</p>
            </div>
          )}

          {!isEditingNursery ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-700">اسم الحضانة</p>
                <p className="mt-1 text-sm text-slate-900">{nurseryData.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">رقم الهاتف</p>
                <p className="mt-1 text-sm text-slate-900">{nurseryData.main_phone || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">البريد الإلكتروني</p>
                <p className="mt-1 text-sm text-slate-900">{nurseryData.email || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">العنوان</p>
                <p className="mt-1 text-sm text-slate-900">
                  {nurseryData.main_street && nurseryData.main_city && nurseryData.main_governorate
                    ? `${nurseryData.main_street}, ${nurseryData.main_city}, ${nurseryData.main_governorate}`
                    : 'غير محدد'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={nurseryForm.main_phone}
                    onChange={(e) => handleInputChange('main_phone', e.target.value)}
                    disabled={updateNurseryMutation.isPending}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
                      fieldErrors.main_phone ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="أدخل رقم الهاتف"
                  />
                  {fieldErrors.main_phone && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.main_phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={nurseryForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={updateNurseryMutation.isPending}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
                      fieldErrors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="أدخل البريد الإلكتروني"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">الشارع</label>
                  <input
                    type="text"
                    value={nurseryForm.main_street}
                    onChange={(e) => handleInputChange('main_street', e.target.value)}
                    disabled={updateNurseryMutation.isPending}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
                      fieldErrors.main_street ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="أدخل اسم الشارع"
                  />
                  {fieldErrors.main_street && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.main_street}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">المدينة</label>
                  <input
                    type="text"
                    value={nurseryForm.main_city}
                    onChange={(e) => handleInputChange('main_city', e.target.value)}
                    disabled={updateNurseryMutation.isPending}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
                      fieldErrors.main_city ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="أدخل اسم المدينة"
                  />
                  {fieldErrors.main_city && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.main_city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">المحافظة</label>
                  <select
                    value={nurseryForm.main_governorate}
                    onChange={(e) => handleInputChange('main_governorate', e.target.value)}
                    disabled={updateNurseryMutation.isPending}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
                      fieldErrors.main_governorate ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">اختر المحافظة</option>
                    <option value="Amman">عمان</option>
                    <option value="Irbid">إربد</option>
                    <option value="Zarqa">الزرقاء</option>
                    <option value="Balqa">البلقاء</option>
                    <option value="Madaba">مادبا</option>
                    <option value="Mafraq">المفرق</option>
                    <option value="Jerash">جرش</option>
                    <option value="Ajloun">عجلون</option>
                    <option value="Karak">الكرك</option>
                    <option value="Tafilah">الطفيلة</option>
                    <option value="Maan">معان</option>
                    <option value="Aqaba">العقبة</option>
                  </select>
                  {fieldErrors.main_governorate && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.main_governorate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">الرمز البريدي</label>
                  <input
                    type="text"
                    value={nurseryForm.main_postal_code}
                    onChange={(e) => handleInputChange('main_postal_code', e.target.value)}
                    disabled={updateNurseryMutation.isPending}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
                      fieldErrors.main_postal_code ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="أدخل الرمز البريدي"
                  />
                  {fieldErrors.main_postal_code && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.main_postal_code}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={updateNurseryMutation.isPending}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <XMarkIcon className="h-4 w-4" />
                  إلغاء
                </button>
                <button
                  onClick={handleSaveNursery}
                  disabled={updateNurseryMutation.isPending}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updateNurseryMutation.isPending && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <CheckIcon className="h-4 w-4" />
                  {updateNurseryMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {data?.recentReports?.length ? (
        <div className="card space-y-4">
          <div>
            <h3 className="card-title">أحدث التقارير</h3>
            <p className="card-subtitle">اخر خمسة تقارير تم رفعها من فريق الإشراف</p>
          </div>
          <div className="flow-root">
            <ul className="divide-y divide-slate-100">
              {data.recentReports.map((report) => (
                <li key={report.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-700">{report.child?.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(report.reportDate).toLocaleDateString('ar-JO')}
                      {' • '}
                      {report.supervisor?.fullName}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">
                    {report.status === 'approved' ? 'معتمد' : report.status === 'submitted' ? 'قيد المراجعة' : 'مسودة'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
