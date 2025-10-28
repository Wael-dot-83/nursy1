import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';
import {
  CogIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const JORDAN_GOVERNORATES = [
  'عمان',
  'إربد',
  'الزرقاء',
  'المفرق',
  'الطفيلة',
  'معان',
  'العقبة',
  'الكرك',
  'مادبا',
  'عجلون',
  'جرش',
  'السلط',
];

const AGE_CATEGORIES = [
  { id: 'infant', name: 'رضع (0-1 سنة)', minDays: 0, maxMonths: 12 },
  { id: 'toddler', name: 'أطفال صغار (1-2 سنوات)', minDays: 365, maxMonths: 24 },
  { id: 'preschool', name: 'مرحلة ما قبل المدرسة (2-5 سنوات)', minDays: 730, maxMonths: 60 },
  { id: 'school_age', name: 'عمر المدرسة (5 سنوات فما فوق)', minDays: 1825, maxMonths: null },
];

function GovernoratesSettings() {
  const [newGovernorate, setNewGovernorate] = useState('');
  const [editingGovernorate, setEditingGovernorate] = useState(null);
  const [editValue, setEditValue] = useState('');

  const queryClient = useQueryClient();

  // Mock data - in real implementation, this would come from API
  const { data: governorates, isLoading } = useQuery({
    queryKey: ['governorates'],
    queryFn: async () => {
      // This would be replaced with actual API call
      return JORDAN_GOVERNORATES;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (governorate) => {
      // Mock API call
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['governorates']);
      setNewGovernorate('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ oldName, newName }) => {
      // Mock API call
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['governorates']);
      setEditingGovernorate(null);
      setEditValue('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (governorate) => {
      // Mock API call
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['governorates']);
    },
  });

  const handleAdd = () => {
    if (newGovernorate.trim()) {
      addMutation.mutate(newGovernorate.trim());
    }
  };

  const handleEdit = (governorate) => {
    setEditingGovernorate(governorate);
    setEditValue(governorate);
  };

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue !== editingGovernorate) {
      updateMutation.mutate({ oldName: editingGovernorate, newName: editValue.trim() });
    } else {
      setEditingGovernorate(null);
      setEditValue('');
    }
  };

  const handleDelete = (governorate) => {
    if (window.confirm(`هل أنت متأكد من حذف محافظة "${governorate}"؟`)) {
      deleteMutation.mutate(governorate);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <MapPinIcon className="h-6 w-6 text-primary-600" />
        <h3 className="text-lg font-semibold text-slate-800">إدارة المحافظات</h3>
      </div>

      {/* Add New Governorate */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="اسم المحافظة الجديدة"
          value={newGovernorate}
          onChange={(e) => setNewGovernorate(e.target.value)}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={!newGovernorate.trim() || addMutation.isPending}
          className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          إضافة
        </button>
      </div>

      {/* Governorates List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center text-sm text-slate-500">جاري التحميل...</div>
        ) : (
          governorates?.map((governorate) => (
            <div key={governorate} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              {editingGovernorate === governorate ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 rounded-md border border-slate-300 px-3 py-1 text-sm focus:border-primary-500 focus:outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="rounded p-1 text-green-600 hover:bg-green-50"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingGovernorate(null);
                      setEditValue('');
                    }}
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-slate-800">{governorate}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(governorate)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="تحديث"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(governorate)}
                      className="rounded p-1 text-red-400 hover:bg-red-100 hover:text-red-600"
                      title="حذف"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AgeCategoriesSettings() {
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', minDays: '', maxMonths: '' });

  const queryClient = useQueryClient();

  // Mock data - in real implementation, this would come from API
  const { data: ageCategories, isLoading } = useQuery({
    queryKey: ['age-categories'],
    queryFn: async () => {
      // This would be replaced with actual API call
      return AGE_CATEGORIES;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (category) => {
      // Mock API call
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['age-categories']);
      setEditingCategory(null);
      setEditForm({ name: '', minDays: '', maxMonths: '' });
    },
  });

  const handleEdit = (category) => {
    setEditingCategory(category.id);
    setEditForm({
      name: category.name,
      minDays: category.minDays?.toString() || '',
      maxMonths: category.maxMonths?.toString() || '',
    });
  };

  const handleSaveEdit = () => {
    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory,
        ...editForm,
        minDays: editForm.minDays ? parseInt(editForm.minDays) : null,
        maxMonths: editForm.maxMonths ? parseInt(editForm.maxMonths) : null,
      });
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <CalendarIcon className="h-6 w-6 text-primary-600" />
        <h3 className="text-lg font-semibold text-slate-800">إدارة الفئات العمرية</h3>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-sm text-slate-500">جاري التحميل...</div>
        ) : (
          ageCategories?.map((category) => (
            <div key={category.id} className="rounded-lg border border-slate-100 p-4">
              {editingCategory === category.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="اسم الفئة العمرية"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">الحد الأدنى (بالأيام)</label>
                      <input
                        type="number"
                        value={editForm.minDays}
                        onChange={(e) => setEditForm(prev => ({ ...prev, minDays: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">الحد الأقصى (بالأشهر)</label>
                      <input
                        type="number"
                        value={editForm.maxMonths}
                        onChange={(e) => setEditForm(prev => ({ ...prev, maxMonths: e.target.value }))}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setEditForm({ name: '', minDays: '', maxMonths: '' });
                      }}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                      className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      حفظ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800">{category.name}</h4>
                    <p className="text-sm text-slate-500">
                      من {category.minDays || 0} يوم إلى {category.maxMonths ? `${category.maxMonths} شهر` : 'غير محدود'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEdit(category)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    title="تحديث"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ReportTemplatesSettings() {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'تقرير شهري للحضانة',
      description: 'تقرير شامل يشمل إحصائيات الأطفال والحضور والأنشطة',
      type: 'monthly',
      isActive: true,
    },
    {
      id: 2,
      name: 'تقرير أداء المشرفين',
      description: 'تقييم أداء المشرفين والمديرين',
      type: 'performance',
      isActive: true,
    },
    {
      id: 3,
      name: 'تقرير مالي',
      description: 'التقرير المالي الشهري للحضانة',
      type: 'financial',
      isActive: false,
    },
  ]);

  const toggleTemplate = (id) => {
    setTemplates(prev =>
      prev.map(template =>
        template.id === id ? { ...template, isActive: !template.isActive } : template
      )
    );
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <DocumentTextIcon className="h-6 w-6 text-primary-600" />
        <h3 className="text-lg font-semibold text-slate-800">قوالب التقارير</h3>
      </div>

      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-4">
            <div className="flex-1">
              <h4 className="font-medium text-slate-800">{template.name}</h4>
              <p className="text-sm text-slate-500">{template.description}</p>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 mt-2">
                {template.type}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                template.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {template.isActive ? 'فعال' : 'غير فعال'}
              </span>
              <button
                onClick={() => toggleTemplate(template.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  template.isActive ? 'bg-primary-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    template.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('governorates');

  const tabs = [
    { id: 'governorates', label: 'المحافظات', icon: MapPinIcon },
    { id: 'age-categories', label: 'الفئات العمرية', icon: CalendarIcon },
    { id: 'report-templates', label: 'قوالب التقارير', icon: DocumentTextIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">الإعدادات</h2>
        <p className="mt-1 text-sm text-slate-500">إدارة المحافظات والفئات العمرية وقوالب التقارير</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'governorates' && <GovernoratesSettings />}
        {activeTab === 'age-categories' && <AgeCategoriesSettings />}
        {activeTab === 'report-templates' && <ReportTemplatesSettings />}
      </div>
    </div>
  );
}