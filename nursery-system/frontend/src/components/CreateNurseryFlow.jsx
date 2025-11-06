import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

import { apiClient, getEndpoint } from '../lib/apiClient';

const INITIAL_FORM = {
  name: '',
  mainPhone: '',
  email: '',
  governorate: '',
  city: '',
  postalCode: '',
  addressLine: '',
  minAgeDays: 70,
  maxAgeMonths: 52,
  notes: '',
};

const ERROR_MESSAGES = {
  nameRequired: 'اسم الحضانة مطلوب (٣ أحرف على الأقل)',
  phoneInvalid: 'رقم الهاتف الأردني غير صحيح (مثال: 07XXXXXXXX)',
  unknown: 'حدث خطأ غير متوقع، حاول لاحقًا.',
};

const API_ERROR_MAP = {
  NURSERY_NAME_TAKEN: { field: 'name', message: 'اسم الحضانة مستخدم بالفعل.' },
  NURSERY_PHONE_TAKEN: { field: 'mainPhone', message: 'رقم الهاتف الرئيسي مستخدم بالفعل.' },
  INVALID_PHONE: { field: 'mainPhone', message: ERROR_MESSAGES.phoneInvalid },
  INVALID_NAME: { field: 'name', message: ERROR_MESSAGES.nameRequired },
};

const STEPS = [
  { id: 1, label: 'المعلومات الأساسية' },
  { id: 2, label: 'التفاصيل الإضافية' },
  { id: 3, label: 'تم الإنشاء' },
];

const phoneDigits = (value) => (value || '').replace(/\D/g, '');

const buildPayload = (data) => ({
  name: data.name.trim(),
  mainPhone: data.mainPhone.trim(),
  isBranch: false,
  branchName: null,
  email: (data.email || '').trim() || null,
  governorate: (data.governorate || '').trim() || null,
  city: (data.city || '').trim() || null,
  postalCode: (data.postalCode || '').trim() || null,
  addressLine: (data.addressLine || '').trim() || null,
  minAgeDays: Number.isFinite(Number(data.minAgeDays)) ? Number(data.minAgeDays) : 70,
  maxAgeMonths: Number.isFinite(Number(data.maxAgeMonths)) ? Number(data.maxAgeMonths) : 52,
  notes: (data.notes || '').trim() || null,
});

const StepIndicator = ({ currentStep }) => (
  <ol className="flex items-center gap-4">
    {STEPS.map((step) => {
      const isActive = step.id === currentStep;
      const isCompleted = step.id < currentStep;
      return (
        <li key={step.id} className="flex items-center gap-2 text-sm">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium ${
              isActive
                ? 'border-primary-600 bg-primary-600 text-white'
                : isCompleted
                  ? 'border-primary-200 bg-primary-50 text-primary-600'
                  : 'border-slate-300 bg-white text-slate-500'
            }`}
          >
            {step.id}
          </span>
          <span className={isActive ? 'text-primary-700 font-semibold' : 'text-slate-500'}>
            {step.label}
          </span>
        </li>
      );
    })}
  </ol>
);

export default function CreateNurseryFlow({ onClose, onCreated }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState(null);

  // Fetch governorates list
  const { data: governoratesData } = useQuery({
    queryKey: ['governorates'],
    queryFn: async () => {
      const response = await apiClient.get(getEndpoint('/admin/settings/governorates'));
      return response.data?.governorates || [];
    },
  });

  const governorates = Array.isArray(governoratesData) ? governoratesData : [];

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiClient.post(getEndpoint('/admin/nurseries'), payload);
      return response.data;
    },
    onSuccess: (data) => {
      setResult(data);
      setCurrentStep(3);
      setErrors({});
      setServerError('');
      setFormData(INITIAL_FORM);
      queryClient.invalidateQueries(['nurseries']);
      queryClient.invalidateQueries(['admin-users']);
      if (typeof onCreated === 'function') {
        onCreated(data);
      }
    },
    onError: (error) => {
      console.error('Error creating nursery:', error);
      console.log('Error response:', error.response?.data);
      
      const detail = error.response?.data?.detail;
      
      // Check if detail is an object with code
      if (detail && typeof detail === 'object' && detail.code) {
        if (API_ERROR_MAP[detail.code]) {
          const mapping = API_ERROR_MAP[detail.code];
          setErrors((prev) => ({ ...prev, [mapping.field]: mapping.message }));
          setServerError('');
        } else if (detail.message) {
          setServerError(detail.message);
        } else {
          setServerError(ERROR_MESSAGES.unknown);
        }
      } 
      // Check if detail is a string
      else if (typeof detail === 'string') {
        setServerError(detail);
      } 
      // Check for error message in response
      else if (error.response?.data?.error?.message) {
        setServerError(error.response.data.error.message);
      }
      // Fallback
      else {
        setServerError(ERROR_MESSAGES.unknown);
      }
    },
  });

  const resetAndClose = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setServerError('');
    setResult(null);
    setCurrentStep(1);
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const validateStep = (step) => {
    const nextErrors = {};
    const trimmedName = (formData.name || '').trim();
    const phone = phoneDigits(formData.mainPhone);

    if (step === 1) {
      if (trimmedName.length < 3) {
        nextErrors.name = ERROR_MESSAGES.nameRequired;
      }
      if (!/^0?7\d{8}$/.test(phone)) {
        nextErrors.mainPhone = ERROR_MESSAGES.phoneInvalid;
      }
    }

    if (step === 2) {
      const minAge = Number(formData.minAgeDays);
      const maxAge = Number(formData.maxAgeMonths);
      if (!Number.isFinite(minAge) || minAge < 0) {
        nextErrors.minAgeDays = 'أدخل حدًا أدنى صالحًا للأعمار (بالأيام).';
      }
      if (!Number.isFinite(maxAge) || maxAge <= 0) {
        nextErrors.maxAgeMonths = 'أدخل حدًا أقصى صالحًا للأعمار (بالأشهر).';
      }
    }

    setErrors(nextErrors);
    setServerError('');
    return Object.keys(nextErrors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
    setServerError('');
  };



  const handleNext = () => {
    if (validateStep(1)) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateStep(2)) {
      return;
    }
    mutation.mutate(buildPayload(formData));
  };

  const handleCopyAll = () => {
    if (!result) return;
    const payload = [
      `اسم الحضانة: ${result.nursery?.name || ''}`,
      `رقم الهاتف (اسم المستخدم): ${result.nursery?.mainPhone || ''}`,
      `البريد الإلكتروني للمدير: ${result.director?.email || ''}`,
      `كلمة المرور المؤقتة: ${result.director?.temporaryPassword || ''}`,
    ].join('\n');
    navigator.clipboard.writeText(payload).catch(() => {});
  };

  const handleCopy = (value) => {
    navigator.clipboard.writeText(value).catch(() => {});
  };

  const isLoading = mutation.isLoading;
  const stepTitle = useMemo(() => {
    switch (currentStep) {
      case 1:
        return 'إنشاء حضانة جديدة';
      case 2:
        return 'تفاصيل إضافية';
      case 3:
        return 'تم إنشاء الحضانة';
      default:
        return 'إنشاء حضانة';
    }
  }, [currentStep]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">{stepTitle}</h3>
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <StepIndicator currentStep={currentStep} />

          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {currentStep === 1 && (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label htmlFor="nursery-name" className="block text-sm font-medium text-slate-700">
                  اسم الحضانة*
                </label>
                <input
                  id="nursery-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="مثال: حضانة الزيتونة"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="main-phone" className="block text-sm font-medium text-slate-700">
                  رقم الهاتف الرئيسي*
                </label>
                <input
                  id="main-phone"
                  type="tel"
                  value={formData.mainPhone}
                  onChange={(e) => handleFieldChange('mainPhone', e.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="07XXXXXXXX"
                />
                <p className="mt-1 text-xs text-slate-500">يُقبل الشكل 07XXXXXXXX فقط.</p>
                {errors.mainPhone && <p className="mt-1 text-xs text-red-600">{errors.mainPhone}</p>}
              </div>

              <div>
                <label htmlFor="nursery-email" className="block text-sm font-medium text-slate-700">
                  البريد الإلكتروني (اختياري)
                </label>
                <input
                  id="nursery-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="example@domain.com"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-md bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  التالي
                </button>
              </div>
            </form>
          )}

          {currentStep === 2 && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="governorate" className="block text-sm font-medium text-slate-700">
                    المحافظة
                  </label>
                  <select
                    id="governorate"
                    value={formData.governorate}
                    onChange={(e) => handleFieldChange('governorate', e.target.value)}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">اختر المحافظة</option>
                    {governorates.map((gov) => (
                      <option key={gov.id} value={gov.name_ar}>
                        {gov.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                    المدينة
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    placeholder="مثال: عمان"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="postal-code" className="block text-sm font-medium text-slate-700">
                    الرمز البريدي
                  </label>
                  <input
                    id="postal-code"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    placeholder="مثال: 11118"
                  />
                </div>
                <div>
                  <label htmlFor="address-line" className="block text-sm font-medium text-slate-700">
                    العنوان التفصيلي
                  </label>
                  <input
                    id="address-line"
                    type="text"
                    value={formData.addressLine}
                    onChange={(e) => handleFieldChange('addressLine', e.target.value)}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    placeholder="اسم الشارع، العلامة المميزة..."
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="min-age" className="block text-sm font-medium text-slate-700">
                    الحد الأدنى للعمر (بالأيام)
                  </label>
                  <input
                    id="min-age"
                    type="number"
                    min="0"
                    value={formData.minAgeDays}
                    onChange={(e) => handleFieldChange('minAgeDays', e.target.value)}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                  {errors.minAgeDays && <p className="mt-1 text-xs text-red-600">{errors.minAgeDays}</p>}
                </div>
                <div>
                  <label htmlFor="max-age" className="block text-sm font-medium text-slate-700">
                    الحد الأقصى للعمر (بالأشهر)
                  </label>
                  <input
                    id="max-age"
                    type="number"
                    min="1"
                    value={formData.maxAgeMonths}
                    onChange={(e) => handleFieldChange('maxAgeMonths', e.target.value)}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                  {errors.maxAgeMonths && (
                    <p className="mt-1 text-xs text-red-600">{errors.maxAgeMonths}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  placeholder="أضف أي ملاحظات مهمة للمدير أو الفريق."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  disabled={isLoading}
                >
                  رجوع
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-md bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-70"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  إنشاء
                </button>
              </div>
            </form>
          )}

          {currentStep === 3 && result && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                  ✓
                </div>
                <h4 className="mt-3 text-lg font-semibold text-slate-800">
                  تم إنشاء الحضانة والمدير بنجاح
                </h4>
                <p className="mt-2 text-sm text-slate-600">
                  شارك بيانات المدير مع الفريق، وسيُطلب منه تغيير كلمة المرور عند أول تسجيل دخول.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="rounded-md bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
                >
                  نسخ جميع البيانات
                </button>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">اسم الحضانة</p>
                    <p className="font-semibold text-slate-800">{result.nursery?.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.nursery?.name || '')}
                    className="rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    نسخ
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">رقم الهاتف (اسم المستخدم)</p>
                    <p className="font-mono text-sm text-slate-800">{result.nursery?.mainPhone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.nursery?.mainPhone || '')}
                    className="rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    نسخ
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">البريد الإلكتروني للمدير</p>
                    <p className="font-mono text-sm text-slate-800">{result.director?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.director?.email || '')}
                    className="rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    نسخ
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">كلمة المرور المؤقتة</p>
                    <p className="font-mono text-sm text-slate-800">{result.director?.temporaryPassword}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.director?.temporaryPassword || '')}
                    className="rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    نسخ
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="rounded-md bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
