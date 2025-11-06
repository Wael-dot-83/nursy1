
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
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';

function GovernoratesSettings() {
  const [newGovernorate, setNewGovernorate] = useState('');
  const [editingGovernorate, setEditingGovernorate] = useState(null); // Will hold the governorate object {id, name}
  const [editValue, setEditValue] = useState('');

  const queryClient = useQueryClient();

  const { data: governorates, isLoading } = useQuery({
    queryKey: ['governorates'],
    queryFn: async () => {
      const response = await api.get('/settings/governorates');
      return response.data.governorates;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (governorateName) => {
      return api.post('/settings/governorates', { name: governorateName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governorates'] });
      setNewGovernorate('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }) => {
      return api.put(`/settings/governorates/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governorates'] });
      setEditingGovernorate(null);
      setEditValue('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (governorateId) => {
      return api.delete(`/settings/governorates/${governorateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governorates'] });
    },
  });

  const handleAdd = () => {
    if (newGovernorate.trim()) {
      addMutation.mutate(newGovernorate.trim());
    }
  };

  const handleEdit = (governorate) => {
    setEditingGovernorate(governorate);
    setEditValue(governorate.name);
  };

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue.trim() !== editingGovernorate.name) {
      updateMutation.mutate({ id: editingGovernorate.id, name: editValue.trim() });
    } else {
      setEditingGovernorate(null);
      setEditValue('');
    }
  };

  const handleDelete = (governorate) => {
    if (window.confirm(`هل أنت متأكد من حذف محافظة "${governorate.name}"؟`)) {
      deleteMutation.mutate(governorate.id);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <MapPinIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-slate-800">إدارة المحافظات</h3>
      </div>

      {/* Add New Governorate */}
      <div className="mb-6 flex gap-2">
        <label htmlFor="new-governorate-input" className="sr-only">
          اسم المحافظة الجديدة
        </label>
        <input
          id="new-governorate-input"
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
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          إضافة
        </button>
      </div>

      {/* Governorates List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center text-slate-500">جاري التحميل...</div>
        ) : governorates && governorates.length > 0 ? (
          governorates.map((governorate) => (
            <div
              key={governorate.id}
              className="flex items-center justify-between rounded-md border border-slate-200 p-3 hover:bg-slate-50"
            >
              {editingGovernorate?.id === governorate.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 rounded-md border border-slate-300 px-3 py-1 focus:border-primary-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editValue.trim() || updateMutation.isPending}
                    className="rounded-md bg-green-600 p-1 text-white hover:bg-green-700 disabled:opacity-50"
                    aria-label="حفظ التعديل"
                  >
                    <CheckIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingGovernorate(null);
                      setEditValue('');
                    }}
                    className="rounded-md bg-slate-600 p-1 text-white hover:bg-slate-700"
                    aria-label="إلغاء التعديل"
                  >
                    <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-3">
                  <span className="flex-1">{governorate.name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(governorate)}
                      className="rounded-md p-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      aria-label="تعديل"
                    >
                      <PencilIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(governorate)}
                      className="rounded-md p-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      aria-label="حذف"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-slate-500">لا توجد محافظات</div>
        )}
      </div>
    </div>
  );
}

export default GovernoratesSettings;
