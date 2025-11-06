import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError, getEndpoint } from '../../lib/apiClient';
import { FEATURE_FLAGS } from '../../lib/constants';
import { PlusIcon, PencilIcon, TrashIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import CreateNurseryFlow from '../../components/CreateNurseryFlow';
import { getGovernorates } from '../../lib/api/settings';

const JORDAN_GOVERNORATES = [
  'Amman', 'Irbid', 'Zarqa', 'Balqa', 'Madaba', 'Mafraq',
  'Jerash', 'Ajloun', 'Karak', 'Tafilah', 'Maan', 'Aqaba'
];

const GOVERNORATE_DISPLAY_NAMES = {
  'Amman': 'Ø¹Ù…Ø§Ù†',
  'Irbid': 'Ø¥Ø±Ø¨Ø¯',
  'Zarqa': 'Ø§Ù„Ø²Ø±Ù‚Ø§Ø¡',
  'Balqa': 'Ø§Ù„Ø¨Ù„Ù‚Ø§Ø¡',
  'Madaba': 'Ù…Ø§Ø¯Ø¨Ø§',
  'Mafraq': 'Ø§Ù„Ù…ÙØ±Ù‚',
  'Jerash': 'Ø¬Ø±Ø´',
  'Ajloun': 'Ø¹Ø¬Ù„ÙˆÙ†',
  'Karak': 'Ø§Ù„ÙƒØ±Ùƒ',
  'Tafilah': 'Ø§Ù„Ø·ÙÙŠÙ„Ø©',
  'Maan': 'Ù…Ø¹Ø§Ù†',
  'Aqaba': 'Ø§Ù„Ø¹Ù‚Ø¨Ø©'
};

function NurseryForm({ nursery, onClose, onSuccess }) {
  const branchManagersEnabled = FEATURE_FLAGS['nursery.branchManagers.v1'];
  
  // Fetch governorates from backend
  const { data: governoratesData } = useQuery({
    queryKey: ['governorates'],
    queryFn: async () => {
      const response = await getGovernorates();
      return response.data;
    }
  });
  
  const governorates = governoratesData?.governorates || [];
  
  const [currentStep, setCurrentStep] = useState(1);
  const [hasBranches, setHasBranches] = useState(nursery?.branches?.length > 0 || false);
  const [numBranches, setNumBranches] = useState(nursery?.branches?.length || 0);
  const [showManagerCredentials, setShowManagerCredentials] = useState(false);
  const [managerCredentials, setManagerCredentials] = useState([]);
  const primaryManager = managerCredentials[0] || null;
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

  const handleCopyAllCredentials = async () => {
    if (!branchManagersEnabled || managerCredentials.length === 0) {
      return;
    }

    const rows = managerCredentials.map((manager, index) => {
      const scopeLabel =
        manager.scope ||
        (manager.branchId ? `Branch ${index}` : 'Main');
      const password = manager.tempPassword || manager.temporaryPassword || '';
      return `${scopeLabel}\t${manager.email}\t${password}`;
    });
    const header = 'Scope\tManager Email\tTemporary Password';
    const payload = [header, ...rows].join('\n');

    try {
      await navigator.clipboard.writeText(payload);
    } catch (error) {
      console.error('Failed to copy manager credentials', error);
      window.prompt('Ø§Ù†Ø³Ø® Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø¯ÙŠØ±ÙŠÙ† Ø§Ù„ØªØ§Ù„ÙŠØ©:', payload);
    }
  };

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (nursery) {
        return apiClient.put(getEndpoint(`/admin/nurseries/${nursery.id}`), data);
      } else {
        return apiClient.post(getEndpoint('/admin/nurseries'), data);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['nurseries']);
      queryClient.invalidateQueries(['admin-users']);
      
      const credentialPayload = Array.isArray(response.data?.managers)
        ? response.data.managers
        : response.data?.manager
          ? [response.data.manager]
          : [];

      if (!nursery && credentialPayload.length > 0) {
        if (branchManagersEnabled) {
          setManagerCredentials(credentialPayload);
        } else {
          setManagerCredentials([credentialPayload[0]]);
        }
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
                         document.querySelector(`input[placeholder*="Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ"]`) ||
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
          newErrors.name = 'Ø§Ø³Ù… Ø§Ù„Ø­Ø¶Ø§Ù†Ø© Ù…Ø·Ù„ÙˆØ¨';
        } else if (value.trim().length < 2) {
          newErrors.name = 'Ø§Ø³Ù… Ø§Ù„Ø­Ø¶Ø§Ù†Ø© ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„ Ø­Ø±ÙÙŠÙ†';
        } else if (value.trim().length > 120) {
          newErrors.name = 'Ø§Ø³Ù… Ø§Ù„Ø­Ø¶Ø§Ù†Ø© ÙŠØ¬Ø¨ Ø£Ù„Ø§ ÙŠØªØ¬Ø§ÙˆØ² 120 Ø­Ø±Ù';
        } else {
          delete newErrors.name;
        }
        break;

      case 'mainPhone':
        if (!value.trim()) {
          newErrors.mainPhone = 'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ Ù…Ø·Ù„ÙˆØ¨';
        } else if (!/^(07[789]\d{7}|0[2-6]\d{6,7})$/.test(value.replace(/\s+/g, ''))) {
          newErrors.mainPhone = 'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ØºÙŠØ± ØµØ­ÙŠØ­ (ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø±Ù‚Ù… Ø£Ø±Ø¯Ù†ÙŠ ØµØ­ÙŠØ­ Ù…Ø«Ù„ 077XXXXXXX Ø£Ùˆ 064291511)';
        } else {
          delete newErrors.mainPhone;
        }
        break;

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­';
        } else {
          delete newErrors.email;
        }
        break;

      case 'minAge':
        if (value < 0) {
          newErrors.minAge = 'Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ø¯Ù†Ù‰ Ù„Ù„Ø¹Ù…Ø± ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø±Ù‚Ù…Ø§Ù‹ Ù…ÙˆØ¬Ø¨Ø§Ù‹';
        } else if (value > 365 * 6) { // Max 6 years
          newErrors.minAge = 'Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ø¯Ù†Ù‰ Ù„Ù„Ø¹Ù…Ø± ÙŠØ¬Ø¨ Ø£Ù„Ø§ ÙŠØªØ¬Ø§ÙˆØ² 6 Ø³Ù†ÙˆØ§Øª';
        } else {
          delete newErrors.minAge;
        }
        break;

      case 'maxAge':
        if (value < 0) {
          newErrors.maxAge = 'Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„Ø¹Ù…Ø± ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø±Ù‚Ù…Ø§Ù‹ Ù…ÙˆØ¬Ø¨Ø§Ù‹';
        } else if (value > 72) { // Max 6 years
          newErrors.maxAge = 'Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„Ø¹Ù…Ø± ÙŠØ¬Ø¨ Ø£Ù„Ø§ ÙŠØªØ¬Ø§ÙˆØ² 6 Ø³Ù†ÙˆØ§Øª';
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
      if (!formData.name.trim()) newErrors.name = 'Ø§Ø³Ù… Ø§Ù„Ø­Ø¶Ø§Ù†Ø© Ù…Ø·Ù„ÙˆØ¨';
      if (!formData.mainPhone.trim()) newErrors.mainPhone = 'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ Ù…Ø·Ù„ÙˆØ¨';
      if (formData.mainPhone && !/^(07[789]\d{7}|0[2-6]\d{6,7})$/.test(formData.mainPhone.replace(/\s+/g, ''))) {
        newErrors.mainPhone = 'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ØºÙŠØ± ØµØ­ÙŠØ­ (ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø±Ù‚Ù… Ø£Ø±Ø¯Ù†ÙŠ ØµØ­ÙŠØ­ Ù…Ø«Ù„ 077XXXXXXX Ø£Ùˆ 064291511)';
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­';
      }
      if (formData.ageRange.minAge < 0) newErrors.minAge = 'Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ø¯Ù†Ù‰ Ù„Ù„Ø¹Ù…Ø± ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø±Ù‚Ù…Ø§Ù‹ Ù…ÙˆØ¬Ø¨Ø§Ù‹';
      if (formData.ageRange.maxAge < 0) newErrors.maxAge = 'Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„Ø¹Ù…Ø± ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø±Ù‚Ù…Ø§Ù‹ Ù…ÙˆØ¬Ø¨Ø§Ù‹';
    }

    if (step === 3 && hasBranches) {
      // Branch validation
      formData.branches.forEach((branch, index) => {
        if (!branchManagersEnabled && !branch.name?.trim()) {
          newErrors[`branch_${index}_name`] = `Ø§Ø³Ù… Ø§Ù„ÙØ±Ø¹ ${index + 1} Ù…Ø·Ù„ÙˆØ¨`;
        }
        if (branch.phone && !/^(07[789]\d{7}|0[2-6]\d{6,7})$/.test(branch.phone.replace(/\s+/g, ''))) {
          newErrors[`branch_${index}_phone`] = `Ø±Ù‚Ù… Ù‡Ø§ØªÙ Ø§Ù„ÙØ±Ø¹ ${index + 1} ØºÙŠØ± ØµØ­ÙŠØ­ (ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø±Ù‚Ù… Ø£Ø±Ø¯Ù†ÙŠ ØµØ­ÙŠØ­ Ù…Ø«Ù„ 077XXXXXXX Ø£Ùˆ 064291511)`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildNurseryPayload = (data) => {
    const trimmedName = data.name?.trim() || '';
    const hasBranchEntries = Array.isArray(data.branches) && data.branches.length > 0 && hasBranches;

    return {
      name: trimmedName,
      mainPhone: data.mainPhone?.trim() || '',
      email: data.email?.trim() || undefined,
      governorateId: data.mainAddress?.governorate || undefined,
      governorate: data.mainAddress?.governorate || '',
      city: data.mainAddress?.city?.trim() || '',
      postalCode: data.mainAddress?.postalCode?.trim() || '',
      addressLine: data.mainAddress?.street?.trim() || '',
      minAgeDays: Number.isInteger(data.ageRange?.minAge) ? data.ageRange.minAge : 70,
      maxAgeMonths: Number.isInteger(data.ageRange?.maxAge) ? data.ageRange.maxAge : 52,
      notes: data.notes?.trim() || undefined,
      hasBranches: hasBranchEntries,
      numberOfBranches: hasBranchEntries ? data.branches.length : 0,
      branches: hasBranchEntries
        ? data.branches.map((branch) => {
            const branchPhone = branch.phone?.trim() || '';
            return {
              ...(branch.id ? { id: branch.id } : {}),
              name: branch.name || trimmedName,
              phone: branchPhone || undefined,
              address: {
                street: branch.address?.street?.trim() || '',
                city: branch.address?.city?.trim() || '',
                governorate: branch.address?.governorate || '',
                postalCode: branch.address?.postalCode?.trim() || '',
              },
            };
          })
        : [],
      branchManagersEnabled: branchManagersEnabled
    };
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
    mutation.mutate(buildNurseryPayload(formData));
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
        name: branchManagersEnabled ? (formData.name || '') : '',
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
              <h4 className="text-lg font-medium text-slate-800">Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø­Ø¶Ø§Ù†Ø© Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©</h4>
              <p className="mt-1 text-sm text-slate-600">Ø£Ø¯Ø®Ù„ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© Ù„Ù„Ø­Ø¶Ø§Ù†Ø© Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©</p>
            </div>

            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="nursery-name" className="block text-sm font-medium text-slate-700">
                  Ø§Ø³Ù… Ø§Ù„Ø­Ø¶Ø§Ù†Ø© *
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
                  Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ *
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
                Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)
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
              <h4 className="mb-3 font-medium text-slate-800">Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="main-street" className="block text-sm font-medium text-slate-700">Ø§Ù„Ø´Ø§Ø±Ø¹</label>
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
                  <label htmlFor="main-city" className="block text-sm font-medium text-slate-700">Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©</label>
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
                  <label htmlFor="main-governorate" className="block text-sm font-medium text-slate-700">Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©</label>
                  <select
                    id="main-governorate"
                    name="mainGovernorate"
                    value={formData.mainAddress.governorate}
                    onChange={(e) => handleAddressChange('governorate', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                    autoComplete="address-level1"
                  >
                    <option value="">Ø§Ø®ØªØ± Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©</option>
                    {JORDAN_GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>{GOVERNORATE_DISPLAY_NAMES[gov]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="main-postal-code" className="block text-sm font-medium text-slate-700">Ø§Ù„Ø±Ù…Ø² Ø§Ù„Ø¨Ø±ÙŠØ¯ÙŠ</label>
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
                  Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ø¯Ù†Ù‰ Ù„Ù„Ø¹Ù…Ø± (Ø¨Ø§Ù„Ø£ÙŠØ§Ù…)
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
                <p className="mt-1 text-xs text-slate-500">Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ: 70 ÙŠÙˆÙ…</p>
              </div>
              <div>
                <label htmlFor="max-age" className="block text-sm font-medium text-slate-700">
                  Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„Ø¹Ù…Ø± (Ø¨Ø§Ù„Ø£Ø´Ù‡Ø±)
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
                <p className="mt-1 text-xs text-slate-500">Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ: 52 Ø´Ù‡Ø±</p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="nursery-notes" className="block text-sm font-medium text-slate-700">
                Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø®Ø§ØµØ©
              </label>
              <textarea
                id="nursery-notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                placeholder="Ø£ÙŠ Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø¥Ø¶Ø§ÙÙŠØ© Ø¹Ù† Ø§Ù„Ø­Ø¶Ø§Ù†Ø©..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-lg font-medium text-slate-800">Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø£ÙØ±Ø¹</h4>
              <p className="mt-1 text-sm text-slate-600">Ù‡Ù„ ØªØ±ÙŠØ¯ Ø¥Ø¶Ø§ÙØ© Ø£ÙØ±Ø¹ Ù„Ù‡Ø°Ù‡ Ø§Ù„Ø­Ø¶Ø§Ù†Ø©ØŸ</p>
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
                    Ù„Ø§ØŒ Ø§Ù„Ø­Ø¶Ø§Ù†Ø© Ù„Ù‡Ø§ Ù…ÙˆÙ‚Ø¹ ÙˆØ§Ø­Ø¯ ÙÙ‚Ø·
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
                    Ù†Ø¹Ù…ØŒ Ø§Ù„Ø­Ø¶Ø§Ù†Ø© Ù„Ù‡Ø§ Ø¹Ø¯Ø© Ø£ÙØ±Ø¹
                  </label>
                </div>
              </div>

              {hasBranches && (
                <div className="rounded-lg border border-slate-200 p-4">
                  <label htmlFor="num-branches" className="block text-sm font-medium text-slate-700 mb-2">
                    Ø¹Ø¯Ø¯ Ø§Ù„Ø£ÙØ±Ø¹
                  </label>
                  <select
                    id="num-branches"
                    name="numBranches"
                    value={numBranches}
                    onChange={(e) => setNumBranches(parseInt(e.target.value))}
                    className="block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  >
                    <option value={0}>Ø§Ø®ØªØ± Ø¹Ø¯Ø¯ Ø§Ù„Ø£ÙØ±Ø¹</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num} ÙØ±Ø¹{num > 1 ? '' : ''}</option>
                    ))}
                  </select>
                  {numBranches > 0 && (
                    <button
                      type="button"
                      onClick={addBranches}
                      className="mt-3 w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      Ø¥Ø¹Ø¯Ø§Ø¯ Ù†Ù…Ø§Ø°Ø¬ Ø§Ù„Ø£ÙØ±Ø¹ ({numBranches})
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
                {hasBranches ? 'Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø£ÙØ±Ø¹' : 'ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª'}
              </h4>
              <p className="mt-1 text-sm text-slate-600">
                {hasBranches ? 'Ø£Ø¯Ø®Ù„ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ÙƒÙ„ ÙØ±Ø¹' : 'ØªØ£ÙƒØ¯ Ù…Ù† ØµØ­Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø¯Ø®Ù„Ø©'}
              </p>
            </div>

            {hasBranches ? (
              <div className="space-y-6">
                {formData.branches.map((branch, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 p-4">
                    <h5 className="mb-4 font-medium text-slate-800">Ø§Ù„ÙØ±Ø¹ {index + 1}</h5>

                    <div className="grid gap-4 md:grid-cols-2">
                    {!branchManagersEnabled ? (
                      <div>
                        <label htmlFor={`branch-name-${index}`} className="block text-sm font-medium text-slate-700">
                          Ø§Ø³Ù… Ø§Ù„ÙØ±Ø¹ *
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
                    ) : (
                      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        Ø³ÙŠØªÙ… Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ø³Ù… Ø§Ù„Ø­Ø¶Ø§Ù†Ø© <span className="font-medium text-slate-800">{formData.name || '...'}</span> Ù„Ù‡Ø°Ø§ Ø§Ù„ÙØ±Ø¹ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹.
                      </div>
                    )}
                      <div>
                        <label htmlFor={`branch-phone-${index}`} className="block text-sm font-medium text-slate-700">
                          Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ
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
                        <label htmlFor={`branch-street-${index}`} className="block text-sm font-medium text-slate-700">Ø§Ù„Ø´Ø§Ø±Ø¹</label>
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
                        <label htmlFor={`branch-city-${index}`} className="block text-sm font-medium text-slate-700">Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©</label>
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
                        <label htmlFor={`branch-governorate-${index}`} className="block text-sm font-medium text-slate-700">Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©</label>
                        <select
                          id={`branch-governorate-${index}`}
                          name={`branchGovernorate-${index}`}
                          value={branch.address?.governorate || ''}
                          onChange={(e) => handleBranchChange(index, 'address.governorate', e.target.value)}
                          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                          autoComplete="address-level1"
                        >
                          <option value="">Ø§Ø®ØªØ± Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©</option>
                          {JORDAN_GOVERNORATES.map(gov => (
                            <option key={gov} value={gov}>{GOVERNORATE_DISPLAY_NAMES[gov]}</option>
                          ))}
                        </select>
                      </div>
                      {!branchManagersEnabled && (
                        <div>
                          <label htmlFor={`branch-postal-${index}`} className="block text-sm font-medium text-slate-700">Ø§Ù„Ø±Ù…Ø² Ø§Ù„Ø¨Ø±ÙŠØ¯ÙŠ</label>
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
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 p-6">
                <h5 className="mb-4 text-lg font-medium text-slate-800">Ù…Ù„Ø®Øµ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª</h5>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ø§Ø³Ù… Ø§Ù„Ø­Ø¶Ø§Ù†Ø©:</span>
                    <span className="font-medium text-slate-800">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ:</span>
                    <span className="font-medium text-slate-800">{formData.mainPhone}</span>
                  </div>
                  {formData.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ:</span>
                      <span className="font-medium text-slate-800">{formData.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ø¯Ù†Ù‰ Ù„Ù„Ø¹Ù…Ø±:</span>
                    <span className="font-medium text-slate-800">{formData.ageRange.minAge} ÙŠÙˆÙ…</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„Ø¹Ù…Ø±:</span>
                    <span className="font-medium text-slate-800">{formData.ageRange.maxAge} Ø´Ù‡Ø±</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ø§Ù„Ø£ÙØ±Ø¹:</span>
                    <span className="font-medium text-slate-800">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£ÙØ±Ø¹</span>
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
            {nursery ? 'ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø¶Ø§Ù†Ø©' : 'Ø¥Ø¶Ø§ÙØ© Ø­Ø¶Ø§Ù†Ø© Ø¬Ø¯ÙŠØ¯Ø©'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            âœ•
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
              Ø§Ù„Ø³Ø§Ø¨Ù‚
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Ø¥Ù„ØºØ§Ø¡
              </button>
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Ø§Ù„ØªØ§Ù„ÙŠ
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {mutation.isPending ? 'Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸...' : nursery ? 'ØªØ­Ø¯ÙŠØ«' : 'Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø­Ø¶Ø§Ù†Ø©'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Manager Credentials Modal */}
      {showManagerCredentials && managerCredentials.length > 0 && (
        branchManagersEnabled ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-slate-800">ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø¶Ø§Ù†Ø© Ø¨Ù†Ø¬Ø§Ø­!</h3>
                <p className="mt-2 text-sm text-slate-600">
                  ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ {managerCredentials.length} Ø­Ø³Ø§Ø¨ Ù…Ø¯ÙŠØ± Ù„Ù„Ø­Ø¶Ø§Ù†Ø© ÙˆØ§Ù„Ø£ÙØ±Ø¹ Ø§Ù„Ù…ØªØ¹Ù„Ù‚Ø© Ø¨Ù‡Ø§. ÙŠØ±Ø¬Ù‰ Ø­ÙØ¸ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø§Ù„ØªØ§Ù„ÙŠØ©:
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  ÙŠÙ…ÙƒÙ†Ùƒ Ù†Ø³Ø® Ø¬Ù…ÙŠØ¹ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£Ùˆ Ù†Ø³Ø® ÙƒÙ„ Ø­Ø³Ø§Ø¨ Ø¨Ø´ÙƒÙ„ Ù…Ù†ÙØµÙ„.
                </span>
                <button
                  type="button"
                  onClick={handleCopyAllCredentials}
                  className="rounded-md bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
                >
                  Ù†Ø³Ø® Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {managerCredentials.map((manager, index) => (
                  <div key={`${manager.email}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">
                          {manager.scope || (manager.branchName ? `ÙØ±Ø¹: ${manager.branchName}` : 'Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¹Ø§Ù…Ø© Ù„Ù„Ø­Ø¶Ø§Ù†Ø©')}
                        </h4>
                        <p className="text-xs text-slate-500">Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªØ§Ù„ÙŠØ© Ù„ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨ ÙÙŠ Ø£ÙˆÙ„ ØªØ³Ø¬ÙŠÙ„ Ø¯Ø®ÙˆÙ„.</p>
                      </div>
                      <span className="rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700">
                        {index + 1} / {managerCredentials.length}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700">Ø§Ù„Ù†Ø·Ø§Ù‚</label>
                        <div className="mt-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                          {manager.scope || (manager.branchName ? `Branch ${index}` : 'Main')}
                        </div>
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700">Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</label>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={manager.email}
                            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono"
                          />
                          <button
                            onClick={() => navigator.clipboard.writeText(manager.email)}
                            className="rounded-md bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300"
                            title="Ù†Ø³Ø® Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ"
                          >
                            ðŸ“‹
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-slate-700">ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ù…Ø¤Ù‚ØªØ©</label>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={manager.temporaryPassword || manager.tempPassword || ''}
                            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono"
                          />
                          <button
                            onClick={() => navigator.clipboard.writeText(manager.temporaryPassword || manager.tempPassword || '')}
                            className="rounded-md bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300"
                            title="Ù†Ø³Ø® ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±"
                          >
                            ðŸ“‹
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowManagerCredentials(false);
                    setManagerCredentials([]);
                    onSuccess();
                    onClose();
                  }}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  ØªÙ… Ø§Ù„ÙÙ‡Ù…
                </button>
              </div>
            </div>
          </div>
        ) : (
          primaryManager && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-slate-800">ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø¶Ø§Ù†Ø© Ø¨Ù†Ø¬Ø§Ø­!</h3>
                  <p className="mt-2 text-sm text-slate-600">ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨ Ù…Ø¯ÙŠØ± ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ù„Ù‡Ø°Ù‡ Ø§Ù„Ø­Ø¶Ø§Ù†Ø©. ÙŠØ±Ø¬Ù‰ Ø­ÙØ¸ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø§Ù„ØªØ§Ù„ÙŠØ©:</p>
                </div>

                <div className="mt-6 rounded-lg bg-slate-50 p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={primaryManager.username || primaryManager.email}
                          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(primaryManager.username || primaryManager.email)}
                          className="rounded-md bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300"
                          title="Ù†Ø³Ø®"
                        >
                          ðŸ“‹
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ù…Ø¤Ù‚ØªØ©</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="password"
                          readOnly
                          value={primaryManager.temporaryPassword || primaryManager.tempPassword || ''}
                          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(primaryManager.temporaryPassword || primaryManager.tempPassword || '')}
                          className="rounded-md bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300"
                          title="Ù†Ø³Ø®"
                        >
                          ðŸ“‹
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„</label>
                      <input
                        type="text"
                        readOnly
                        value={primaryManager.fullName}
                        className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    {primaryManager.email && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</label>
                        <input
                          type="email"
                          readOnly
                          value={primaryManager.email}
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
                      setManagerCredentials([]);
                      onSuccess();
                      onClose();
                    }}
                    className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    ØªÙ… Ø§Ù„ÙÙ‡Ù…
                  </button>
                </div>
              </div>
            </div>
          )
        )
      )}
    </div>
  );
}

export default function NurseryManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingNursery, setEditingNursery] = useState(null);
  const queryClient = useQueryClient();

  const { data: rawNurseryData, isLoading, isError, error } = useQuery({
    queryKey: ['nurseries'],
    queryFn: async () => {
      const response = await apiClient.get(getEndpoint('/admin/nurseries'));
      return response.data;
    },
  });

  const nurseriesCandidates = [
    rawNurseryData,
    rawNurseryData?.data,
    rawNurseryData?.nurseries,
    rawNurseryData?.items,
    rawNurseryData?.results,
  ];
  const nurseries = nurseriesCandidates.find(Array.isArray) ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (nurseryId) => {
      return apiClient.delete(getEndpoint(`/admin/nurseries/${nurseryId}`));
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
    if (window.confirm('Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ù‡ Ø§Ù„Ø­Ø¶Ø§Ù†Ø©ØŸ')) {
      try {
        await deleteMutation.mutateAsync(nurseryId);
      } catch (error) {
        alert('Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­Ø°Ù Ø§Ù„Ø­Ø¶Ø§Ù†Ø©');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø­Ø¶Ø§Ù†Ø§Øª</h2>
          <p className="mt-1 text-sm text-slate-500">Ø¥Ø¯Ø§Ø±Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø¶Ø§Ù†Ø§Øª ÙˆØ§Ù„Ø£ÙØ±Ø¹</p>
        </div>
        <button
          onClick={() => {
            setEditingNursery(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          إضافة حضانة
        </button>
      </div>

      {isLoading && (
        <div className="card text-center text-sm text-slate-500">Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª...</div>
      )}

      {isError && (
        <div className="card text-sm text-red-500">
          {handleApiError(error)}
        </div>
      )}

      {nurseries.length > 0 && (
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
                    title="ØªØ­Ø¯ÙŠØ«"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(nursery.id)}
                    className="rounded p-1 text-red-400 hover:bg-red-100 hover:text-red-600"
                    title="Ø­Ø°Ù"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">ðŸ“</span>
                  <span className="text-slate-600">
                    {nursery.mainCity}, {GOVERNORATE_DISPLAY_NAMES[nursery.mainGovernorate] || nursery.mainGovernorate}
                  </span>
                </div>
                {nursery.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ðŸ“§</span>
                    <span className="text-slate-600">{nursery.email}</span>
                  </div>
                )}
                {nursery.minAgeDays && nursery.maxAgeMonths && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ðŸ‘¶</span>
                    <span className="text-slate-600">
                      Ù…Ù† {nursery.minAgeDays} ÙŠÙˆÙ… Ø¥Ù„Ù‰ {nursery.maxAgeMonths} Ø´Ù‡Ø±
                    </span>
                  </div>
                )}
                {nursery.branches?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">ðŸ¢</span>
                    <span className="text-slate-600">{nursery.branches.length} ÙØ±Ø¹</span>
                  </div>
                )}
                {nursery.branches?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <h4 className="text-sm font-medium text-slate-700">Ø§Ù„Ø£ÙØ±Ø¹:</h4>
                    {nursery.branches.map((branch, index) => (
                      <div key={index} className="rounded-md bg-slate-50 p-2 text-xs">
                        <div className="font-medium text-slate-700">{branch.name}</div>
                        <div className="text-slate-600">
                          ðŸ“ {branch.address?.street}, {branch.address?.city}, {GOVERNORATE_DISPLAY_NAMES[branch.address?.governorate] || branch.address?.governorate}
                        </div>
                        <div className="text-slate-600">ðŸ“ž {branch.phone}</div>
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
                  {nursery.isActive ? 'ÙØ¹Ø§Ù„Ø©' : 'ØºÙŠØ± ÙØ¹Ø§Ù„Ø©'}
                </span>
                <span className="text-xs text-slate-500">
                  ØªÙ… Ø§Ù„Ø¥Ù†Ø´Ø§Ø¡: {new Date(nursery.createdAt).toLocaleDateString('ar-JO')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        editingNursery ? (
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
        ) : (
          <CreateNurseryFlow
            onClose={() => {
              setShowForm(false);
              setEditingNursery(null);
            }}
          />
        )
      )}
    </div>
  );
}
