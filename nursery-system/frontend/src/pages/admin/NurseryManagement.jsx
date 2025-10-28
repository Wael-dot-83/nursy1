import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';
import { PlusIcon, PencilIcon, TrashIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';

const JORDAN_GOVERNORATES = [
  'Amman', 'Irbid', 'Zarqa', 'Balqa', 'Madaba', 'Mafraq',
  'Jerash', 'Ajloun', 'Karak', 'Tafilah', 'Maan', 'Aqaba'
];

const GOVERNORATE_DISPLAY_NAMES = {
  'Amman': 'عمان',
  'Irbid': 'إربد',
  'Zarqa': 'الزرقاء',
  'Balqa': 'البلقاء',
  'Madaba': 'مادبا',
  'Mafraq': 'المفرق',
  'Jerash': 'جرش',
  'Ajloun': 'عجلون',
  'Karak': 'الكرك',
  'Tafilah': 'الطفيلة',
  'Maan': 'معان',
  'Aqaba': 'العقبة'
};

function NurseryForm({ nursery, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [hasBranches, setHasBranches] = useState(nursery?.branches?.length > 0 || false);
  const [numBranches, setNumBranches] = useState(nursery?.branches?.length || 0);
  const [showManagerCredentials, setShowManagerCredentials] = useState(false);
  const [managerCredentials, setManagerCredentials] = useState(null);
  const [formData, setFormData] = useState({
    name: nursery?.name || '',
    mainPhone: nursery?.mainPhone || '',
    email: nursery?.email || '',
    mainAddress: {
      street: nursery?.mainStreet || '',
      city: nursery?.mainCity || '',
      governorate: nursery?.mainGovernorate || '',
      postalCode: nursery?.mainPostalCode || '',
    },
    ageRange: {
      minAge: nursery?.minAgeDays || 70, // Default 70 days
      maxAge: nursery?.maxAgeMonths || 52, // Default 52 months
    },
    notes: nursery?.notes || '',
    branches: nursery?.branches || [],
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (nursery) {
        return apiClient.put(`/admin/nurseries/${nursery.id}`, data);
      } else {
        return apiClient.post('/admin/nurseries', data);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['nurseries']);
      queryClient.invalidateQueries(['users']);
      
      if (!nursery && response.data.manager) {
        // Show manager credentials for new nursery
        setManagerCredentials(response.data.manager);
        setShowManagerCredentials(true);
      } else {
        onSuccess();
        onClose();
      }
    },
    onError: (error) => {
      // Handle backend validation errors
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          const field = err.path?.join('.') || err.context?.key;
          if (field) {
            // Convert backend field names to frontend field names
            let frontendField = field;
            if (field === 'mainPhone') frontendField = 'mainPhone';
            else if (field === 'email') frontendField = 'email';
            else if (field === 'name') frontendField = 'name';
            else if (field === 'ageRange.minAge') frontendField = 'minAge';
            else if (field === 'ageRange.maxAge') frontendField = 'maxAge';
            else if (field.startsWith('branches[')) {
              // Handle branch validation errors
              const match = field.match(/branches\[(\d+)\]\.(.+)/);
              if (match) {
                const index = parseInt(match[1]);
                const branchField = match[2];
                frontendField = `branch_${index}_${branchField}`;
              }
            }

            backendErrors[frontendField] = err.message;
          }
        });
        setErrors(backendErrors);
        // Scroll to the first error
        const firstErrorField = Object.keys(backendErrors)[0];
        if (firstErrorField) {
          const element = document.querySelector(`[name="${firstErrorField}"]`) || 
                         document.querySelector(`input[placeholder*="رقم الهاتف"]`) ||
                         document.querySelector(`input[type="text"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
          }
        }
      } else {
        // Handle other errors
        alert(handleApiError(error));
      }
    },
  });

  // Validation rules
  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'اسم الحضانة مطلوب';
        } else if (value.trim().length < 2) {
          newErrors.name = 'اسم الحضانة يجب أن يكون على الأقل حرفين';
        } else if (value.trim().length > 120) {
          newErrors.name = 'اسم الحضانة يجب ألا يتجاوز 120 حرف';
        } else {
          delete newErrors.name;
        }
        break;

      case 'mainPhone':
        if (!value.trim()) {
          newErrors.mainPhone = 'رقم الهاتف الرئيسي مطلوب';
        } else if (!/^(07[789]\d{7}|0[2-6]\d{6,7})$/.test(value.replace(/\s+/g, ''))) {
          newErrors.mainPhone = 'رقم الهاتف غير صحيح (يجب أن يكون رقم أردني صحيح مثل 077XXXXXXX أو 064291511)';
        } else {
          delete newErrors.mainPhone;
        }
        break;

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'البريد الإلكتروني غير صحيح';
        } else {
          delete newErrors.email;
        }
        break;

      case 'minAge':
        if (value < 0) {
          newErrors.minAge = 'الحد الأدنى للعمر يجب أن يكون رقماً موجباً';
        } else if (value > 365 * 6) { // Max 6 years
          newErrors.minAge = 'الحد الأدنى للعمر يجب ألا يتجاوز 6 سنوات';
        } else {
          delete newErrors.minAge;
        }
        break;

      case 'maxAge':
        if (value < 0) {
          newErrors.maxAge = 'الحد الأقصى للعمر يجب أن يكون رقماً موجباً';
        } else if (value > 72) { // Max 6 years
          newErrors.maxAge = 'الحد الأقصى للعمر يجب ألا يتجاوز 6 سنوات';
        } else {
          delete newErrors.maxAge;
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Basic info validation
      if (!formData.name.trim()) newErrors.name = 'اسم الحضانة مطلوب';
      if (!formData.mainPhone.trim()) newErrors.mainPhone = 'رقم الهاتف الرئيسي مطلوب';
      if (formData.mainPhone && !/^(07[789]\d{7}|0[2-6]\d{6,7})$/.test(formData.mainPhone.replace(/\s+/g, ''))) {
        newErrors.mainPhone = 'رقم الهاتف غير صحيح (يجب أن يكون رقم أردني صحيح مثل 077XXXXXXX أو 064291511)';
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'البريد الإلكتروني غير صحيح';
      }
      if (formData.ageRange.minAge < 0) newErrors.minAge = 'الحد الأدنى للعمر يجب أن يكون رقماً موجباً';
      if (formData.ageRange.maxAge < 0) newErrors.maxAge = 'الحد الأقصى للعمر يجب أن يكون رقماً موجباً';
    }

    if (step === 3 && hasBranches) {
      // Branch validation
      formData.branches.forEach((branch, index) => {
        if (!branch.name?.trim()) {
          newErrors[`branch_${index}_name`] = `اسم الفرع ${index + 1} مطلوب`;
        }
        if (branch.phone && !/^(07[789]\d{7}|0[2-6]\d{6,7})$/.test(branch.phone.replace(/\s+/g, ''))) {
          newErrors[`branch_${index}_phone`] = `رقم هاتف الفرع ${index + 1} غير صحيح (يجب أن يكون رقم أردني صحيح مثل 077XXXXXXX أو 064291511)`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final submission
    mutation.mutate(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      mainAddress: { ...prev.mainAddress, [field]: value }
    }));
  };

  const handleAgeRangeChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      ageRange: { ...prev.ageRange, [field]: numValue }
    }));
    if (touched[field]) {
      validateField(field, numValue);
    }
  };

  const handleBranchChange = (index, field, value) => {
    const newBranches = [...formData.branches];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newBranches[index] = {
        ...newBranches[index],
        [parent]: { ...newBranches[index][parent], [child]: value }
      };
    } else {
      newBranches[index] = { ...newBranches[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, branches: newBranches }));
  };

  const addBranches = () => {
    const newBranches = [];
    for (let i = 0; i < numBranches; i++) {
      newBranches.push({
        name: '',
        address: { street: '', city: '', governorate: '', postalCode: '' },
        phone: '',
      });
    }
    setFormData(prev => ({ ...prev, branches: newBranches }));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const renderStepIndicator = () => (
    <div className="mb-8 flex items-center justify-center">
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              currentStep >= step
                ? 'bg-primary-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`mx-2 h-1 w-8 ${
                currentStep > step ? 'bg-primary-600' : 'bg-slate-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-lg font-medium text-slate-800">معلومات الحضانة الأساسية</h4>
              <p className="mt-1 text-sm text-slate-600">أدخل المعلومات الأساسية للحضانة الجديدة</p>
            </div>

            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="nursery-name" className="block text-sm font-medium text-slate-700">
                  اسم الحضانة *
                </label>
                <input
                  id="nursery-name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, name: true }));
                    validateField('name', formData.name);
                  }}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                    errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                  }`}
                  autoComplete="organization"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="main-phone" className="block text-sm font-medium text-slate-700">
                  رقم الهاتف الرئيسي *
                </label>
                <input
                  id="main-phone"
                  name="mainPhone"
                  type="tel"
                  required
                  value={formData.mainPhone}
                  onChange={(e) => handleInputChange('mainPhone', e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, mainPhone: true }));
                    validateField('mainPhone', formData.mainPhone);
                  }}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                    errors.mainPhone ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                  }`}
                  placeholder="07XXXXXXXX"
                  autoComplete="tel"
                />
                {errors.mainPhone && <p className="mt-1 text-sm text-red-600">{errors.mainPhone}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="nursery-email" className="block text-sm font-medium text-slate-700">
                البريد الإلكتروني (اختياري)
              </label>
              <input
                id="nursery-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, email: true }));
                  validateField('email', formData.email);
                }}
                className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                  errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                }`}
                placeholder="example@nursery.com"
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Main Address */}
            <div className="rounded-lg border border-slate-200 p-4">
              <h4 className="mb-3 font-medium text-slate-800">العنوان الرئيسي</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="main-street" className="block text-sm font-medium text-slate-700">الشارع</label>
                  <input
                    id="main-street"
                    name="mainStreet"
                    type="text"
                    value={formData.mainAddress.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                    autoComplete="address-line1"
                  />
                </div>
                <div>
                  <label htmlFor="main-city" className="block text-sm font-medium text-slate-700">المدينة</label>
                  <input
                    id="main-city"
                    name="mainCity"
                    type="text"
                    value={formData.mainAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                    autoComplete="address-level2"
                  />
                </div>
                <div>
                  <label htmlFor="main-governorate" className="block text-sm font-medium text-slate-700">المحافظة</label>
                  <select
                    id="main-governorate"
                    name="mainGovernorate"
                    value={formData.mainAddress.governorate}
                    onChange={(e) => handleAddressChange('governorate', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                    autoComplete="address-level1"
                  >
                    <option value="">اختر المحافظة</option>
                    {JORDAN_GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>{GOVERNORATE_DISPLAY_NAMES[gov]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="main-postal-code" className="block text-sm font-medium text-slate-700">الرمز البريدي</label>
                  <input
                    id="main-postal-code"
                    name="mainPostalCode"
                    type="text"
                    value={formData.mainAddress.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                    autoComplete="postal-code"
                  />
                </div>
              </div>
            </div>

            {/* Age Range */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="min-age" className="block text-sm font-medium text-slate-700">
                  الحد الأدنى للعمر (بالأيام)
                </label>
                <input
                  id="min-age"
                  name="minAge"
                  type="number"
                  min="0"
                  value={formData.ageRange.minAge}
                  onChange={(e) => handleAgeRangeChange('minAge', e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, minAge: true }));
                    validateField('minAge', formData.ageRange.minAge);
                  }}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                    errors.minAge ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                  }`}
                />
                {errors.minAge && <p className="mt-1 text-sm text-red-600">{errors.minAge}</p>}
                <p className="mt-1 text-xs text-slate-500">الافتراضي: 70 يوم</p>
              </div>
              <div>
                <label htmlFor="max-age" className="block text-sm font-medium text-slate-700">
                  الحد الأقصى للعمر (بالأشهر)
                </label>
                <input
                  id="max-age"
                  name="maxAge"
                  type="number"
                  min="0"
                  value={formData.ageRange.maxAge}
                  onChange={(e) => handleAgeRangeChange('maxAge', e.target.value)}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, maxAge: true }));
                    validateField('maxAge', formData.ageRange.maxAge);
                  }}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                    errors.maxAge ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                  }`}
                />
                {errors.maxAge && <p className="mt-1 text-sm text-red-600">{errors.maxAge}</p>}
                <p className="mt-1 text-xs text-slate-500">الافتراضي: 52 شهر</p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="nursery-notes" className="block text-sm font-medium text-slate-700">
                ملاحظات خاصة
              </label>
              <textarea
                id="nursery-notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                placeholder="أي ملاحظات إضافية عن الحضانة..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-lg font-medium text-slate-800">إعداد الأفرع</h4>
              <p className="mt-1 text-sm text-slate-600">هل تريد إضافة أفرع لهذه الحضانة؟</p>
            </div>

            <div className="mx-auto max-w-md space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <input
                    id="no-branches"
                    name="hasBranches"
                    type="radio"
                    checked={!hasBranches}
                    onChange={() => {
                      setHasBranches(false);
                      setNumBranches(0);
                      setFormData(prev => ({ ...prev, branches: [] }));
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="no-branches" className="text-sm font-medium text-slate-700">
                    لا، الحضانة لها موقع واحد فقط
                  </label>
                </div>
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <input
                    id="has-branches"
                    name="hasBranches"
                    type="radio"
                    checked={hasBranches}
                    onChange={() => setHasBranches(true)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="has-branches" className="text-sm font-medium text-slate-700">
                    نعم، الحضانة لها عدة أفرع
                  </label>
                </div>
              </div>

              {hasBranches && (
                <div className="rounded-lg border border-slate-200 p-4">
                  <label htmlFor="num-branches" className="block text-sm font-medium text-slate-700 mb-2">
                    عدد الأفرع
                  </label>
                  <select
                    id="num-branches"
                    name="numBranches"
                    value={numBranches}
                    onChange={(e) => setNumBranches(parseInt(e.target.value))}
                    className="block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  >
                    <option value={0}>اختر عدد الأفرع</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num} فرع{num > 1 ? '' : ''}</option>
                    ))}
                  </select>
                  {numBranches > 0 && (
                    <button
                      type="button"
                      onClick={addBranches}
                      className="mt-3 w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      إعداد نماذج الأفرع ({numBranches})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-lg font-medium text-slate-800">
                {hasBranches ? 'معلومات الأفرع' : 'تأكيد البيانات'}
              </h4>
              <p className="mt-1 text-sm text-slate-600">
                {hasBranches ? 'أدخل معلومات كل فرع' : 'تأكد من صحة البيانات المدخلة'}
              </p>
            </div>

            {hasBranches ? (
              <div className="space-y-6">
                {formData.branches.map((branch, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 p-4">
                    <h5 className="mb-4 font-medium text-slate-800">الفرع {index + 1}</h5>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor={`branch-name-${index}`} className="block text-sm font-medium text-slate-700">
                          اسم الفرع *
                        </label>
                        <input
                          id={`branch-name-${index}`}
                          name={`branchName-${index}`}
                          type="text"
                          required
                          value={branch.name}
                          onChange={(e) => handleBranchChange(index, 'name', e.target.value)}
                          className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                            errors[`branch_${index}_name`] ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                          }`}
                          autoComplete="organization"
                        />
                        {errors[`branch_${index}_name`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`branch_${index}_name`]}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor={`branch-phone-${index}`} className="block text-sm font-medium text-slate-700">
                          رقم الهاتف
                        </label>
                        <input
                          id={`branch-phone-${index}`}
                          name={`branchPhone-${index}`}
                          type="tel"
                          value={branch.phone}
                          onChange={(e) => handleBranchChange(index, 'phone', e.target.value)}
                          className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                            errors[`branch_${index}_phone`] ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                          }`}
                          placeholder="07XXXXXXXX"
                          autoComplete="tel"
                        />
                        {errors[`branch_${index}_phone`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`branch_${index}_phone`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor={`branch-street-${index}`} className="block text-sm font-medium text-slate-700">الشارع</label>
                        <input
                          id={`branch-street-${index}`}
                          name={`branchStreet-${index}`}
                          type="text"
                          value={branch.address?.street || ''}
                          onChange={(e) => handleBranchChange(index, 'address.street', e.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                          autoComplete="address-line1"
                        />
                      </div>
                      <div>
                        <label htmlFor={`branch-city-${index}`} className="block text-sm font-medium text-slate-700">المدينة</label>
                        <input
                          id={`branch-city-${index}`}
                          name={`branchCity-${index}`}
                          type="text"
                          value={branch.address?.city || ''}
                          onChange={(e) => handleBranchChange(index, 'address.city', e.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                          autoComplete="address-level2"
                        />
                      </div>
                      <div>
                        <label htmlFor={`branch-governorate-${index}`} className="block text-sm font-medium text-slate-700">المحافظة</label>
                        <select
                          id={`branch-governorate-${index}`}
                          name={`branchGovernorate-${index}`}
                          value={branch.address?.governorate || ''}
                          onChange={(e) => handleBranchChange(index, 'address.governorate', e.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                          autoComplete="address-level1"
                        >
                          <option value="">اختر المحافظة</option>
                          {JORDAN_GOVERNORATES.map(gov => (
                            <option key={gov} value={gov}>{GOVERNORATE_DISPLAY_NAMES[gov]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`branch-postal-${index}`} className="block text-sm font-medium text-slate-700">الرمز البريدي</label>
                        <input
                          id={`branch-postal-${index}`}
                          name={`branchPostal-${index}`}
                          type="text"
                          value={branch.address?.postalCode || ''}
                          onChange={(e) => handleBranchChange(index, 'address.postalCode', e.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                          autoComplete="postal-code"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 p-6">
                <h5 className="mb-4 text-lg font-medium text-slate-800">ملخص البيانات</h5>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">اسم الحضانة:</span>
                    <span className="font-medium text-slate-800">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">رقم الهاتف:</span>
                    <span className="font-medium text-slate-800">{formData.mainPhone}</span>
                  </div>
                  {formData.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">البريد الإلكتروني:</span>
                      <span className="font-medium text-slate-800">{formData.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">الحد الأدنى للعمر:</span>
                    <span className="font-medium text-slate-800">{formData.ageRange.minAge} يوم</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">الحد الأقصى للعمر:</span>
                    <span className="font-medium text-slate-800">{formData.ageRange.maxAge} شهر</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">الأفرع:</span>
                    <span className="font-medium text-slate-800">لا توجد أفرع</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-800">
            {nursery ? 'تحديث بيانات الحضانة' : 'إضافة حضانة جديدة'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {renderStepIndicator()}

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderStepContent()}

          {/* Form Actions */}
          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                إلغاء
              </button>
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  التالي
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {mutation.isPending ? 'جاري الحفظ...' : nursery ? 'تحديث' : 'إضافة الحضانة'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Manager Credentials Modal */}
      {showManagerCredentials && managerCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-slate-800">تم إنشاء الحضانة بنجاح!</h3>
              <p className="mt-2 text-sm text-slate-600">
                تم إنشاء حساب مدير تلقائياً لهذه الحضانة. يرجى حفظ بيانات الدخول التالية:
              </p>
            </div>

            <div className="mt-6 rounded-lg bg-slate-50 p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">اسم المستخدم</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={managerCredentials.username}
                      className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(managerCredentials.username)}
                      className="rounded-md bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300"
                      title="نسخ"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">كلمة المرور المؤقتة</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="password"
                      readOnly
                      value={managerCredentials.temporaryPassword}
                      className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(managerCredentials.temporaryPassword)}
                      className="rounded-md bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300"
                      title="نسخ"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">الاسم الكامل</label>
                  <input
                    type="text"
                    readOnly
                    value={managerCredentials.fullName}
                    className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                {managerCredentials.email && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700">البريد الإلكتروني</label>
                    <input
                      type="email"
                      readOnly
                      value={managerCredentials.email}
                      className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowManagerCredentials(false);
                  setManagerCredentials(null);
                  onSuccess();
                  onClose();
                }}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                تم الفهم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NurseryManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingNursery, setEditingNursery] = useState(null);

  const { data: nurseries, isLoading, isError, error } = useQuery({
    queryKey: ['nurseries'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/nurseries');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (nurseryId) => {
      return apiClient.delete(`/admin/nurseries/${nurseryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['nurseries']);
    },
  });

  const handleEdit = (nursery) => {
    setEditingNursery(nursery);
    setShowForm(true);
  };

  const handleDelete = async (nurseryId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الحضانة؟')) {
      try {
        await deleteMutation.mutateAsync(nurseryId);
      } catch (error) {
        alert('حدث خطأ أثناء حذف الحضانة');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">إدارة الحضانات</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة بيانات الحضانات والأفرع</p>
        </div>
        <button
          onClick={() => {
            setEditingNursery(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          إضافة حضانة جديدة
        </button>
      </div>

      {isLoading && (
        <div className="card text-center text-sm text-slate-500">جاري تحميل البيانات...</div>
      )}

      {isError && (
        <div className="card text-sm text-red-500">
          {handleApiError(error)}
        </div>
      )}

      {nurseries && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {nurseries.map((nursery) => (
            <div key={nursery.id} className="card space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <BuildingStorefrontIcon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{nursery.name}</h3>
                    <p className="text-sm text-slate-500">{nursery.mainPhone}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(nursery)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    title="تحديث"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(nursery.id)}
                    className="rounded p-1 text-red-400 hover:bg-red-100 hover:text-red-600"
                    title="حذف"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">📍</span>
                  <span className="text-slate-600">
                    {nursery.mainCity}, {GOVERNORATE_DISPLAY_NAMES[nursery.mainGovernorate] || nursery.mainGovernorate}
                  </span>
                </div>
                {nursery.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">📧</span>
                    <span className="text-slate-600">{nursery.email}</span>
                  </div>
                )}
                {nursery.minAgeDays && nursery.maxAgeMonths && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">👶</span>
                    <span className="text-slate-600">
                      من {nursery.minAgeDays} يوم إلى {nursery.maxAgeMonths} شهر
                    </span>
                  </div>
                )}
                {nursery.branches?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">🏢</span>
                    <span className="text-slate-600">{nursery.branches.length} فرع</span>
                  </div>
                )}
                {nursery.branches?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <h4 className="text-sm font-medium text-slate-700">الأفرع:</h4>
                    {nursery.branches.map((branch, index) => (
                      <div key={index} className="rounded-md bg-slate-50 p-2 text-xs">
                        <div className="font-medium text-slate-700">{branch.name}</div>
                        <div className="text-slate-600">
                          📍 {branch.address?.street}, {branch.address?.city}, {GOVERNORATE_DISPLAY_NAMES[branch.address?.governorate] || branch.address?.governorate}
                        </div>
                        <div className="text-slate-600">📞 {branch.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {nursery.notes && (
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-sm text-slate-600">{nursery.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  nursery.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {nursery.isActive ? 'فعالة' : 'غير فعالة'}
                </span>
                <span className="text-xs text-slate-500">
                  تم الإنشاء: {new Date(nursery.createdAt).toLocaleDateString('ar-JO')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <NurseryForm
          nursery={editingNursery}
          onClose={() => {
            setShowForm(false);
            setEditingNursery(null);
          }}
          onSuccess={() => {
            // Success handled by mutation
          }}
        />
      )}
    </div>
  );
}