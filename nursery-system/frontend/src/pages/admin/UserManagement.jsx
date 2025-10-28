import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError, extractErrorMessage, extractFieldErrors } from '../../lib/apiClient';
import { USER_ROLES } from '../../lib/constants';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import clsx from 'clsx';
import TempPasswordModal from '../../components/TempPasswordModal';

const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'مشرف عام',
  [USER_ROLES.MANAGER]: 'مدير حضانة',
  [USER_ROLES.SUPERVISOR]: 'مشرف',
  [USER_ROLES.PARENT]: 'ولي أمر',
};

const ROLE_COLORS = {
  [USER_ROLES.ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200',
  [USER_ROLES.MANAGER]: 'bg-blue-100 text-blue-800 border-blue-200',
  [USER_ROLES.SUPERVISOR]: 'bg-green-100 text-green-800 border-green-200',
  [USER_ROLES.PARENT]: 'bg-orange-100 text-orange-800 border-orange-200',
};

const ITEMS_PER_PAGE = 10;

function UserForm({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    role: user?.role || USER_ROLES.MANAGER,
    nurseryId: user?.nurseryId || '',
    branchId: user?.branchId || '',
    permissions: user?.permissions || [],
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const [showTempModal, setShowTempModal] = useState(false);
  const [tempModalData, setTempModalData] = useState({ user: null, tempPassword: '' });

  const queryClient = useQueryClient();

  // Fetch nurseries for dropdown
  const { data: nurseries } = useQuery({
    queryKey: ['nurseries'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/nurseries');
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      // Transform frontend field names to backend field names
      const backendData = {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        nursery_id: data.nurseryId ? Number(data.nurseryId) : null,
        branch_id: data.branchId ? Number(data.branchId) : null,
        permissions: data.permissions,
      };

      if (user) {
        // Update user
        return apiClient.put(`/admin/users/${user.id}`, backendData);
      } else {
        // Create new user
        return apiClient.post('/admin/users', backendData);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['admin-users']);
      setFieldErrors({});
      setGeneralError('');
      // Show temp password modal for new manager
      if (!user && response.data?.ephemeral?.temp_password && formData.role === USER_ROLES.MANAGER) {
        setTempModalData({ user: { email: formData.email }, tempPassword: response.data.ephemeral.temp_password });
        setShowTempModal(true);
      } else {
        onSuccess();
        onClose();
      }
    },
    onError: (error) => {
      // Extract field-specific errors
      const fieldErrs = extractFieldErrors(error);
      setFieldErrors(fieldErrs);

      // Extract general error message
      const generalErr = extractErrorMessage(error);
      setGeneralError(generalErr);

      // For debugging, log the full error
      console.error('User form error:', error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const selectedNursery = nurseries?.find(n => n.id === Number(formData.nurseryId));

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
          <h3 className="mb-6 text-xl font-semibold text-slate-800">
            {user ? 'تحديث المستخدم' : 'إضافة مستخدم جديد'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error Display */}
            {generalError && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="mr-3">
                    <p className="text-sm text-red-800 whitespace-pre-line">{generalError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  disabled={mutation.isPending}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                    fieldErrors.full_name ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                {fieldErrors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.full_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={mutation.isPending}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                    fieldErrors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">رقم الهاتف</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={mutation.isPending}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                    fieldErrors.phone ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">الدور</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  disabled={mutation.isPending}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                    fieldErrors.role ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value={USER_ROLES.MANAGER}>مدير حضانة</option>
                  <option value={USER_ROLES.SUPERVISOR}>مشرف</option>
                </select>
                {fieldErrors.role && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.role}</p>
                )}
              </div>
            </div>

            {/* Nursery and Branch Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">الحضانة</label>
                <select
                  value={formData.nurseryId}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nurseryId: e.target.value,
                    branchId: '', // Reset branch when nursery changes
                  }))}
                  disabled={mutation.isPending}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none ${
                    fieldErrors.nursery_id ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">اختر الحضانة</option>
                  {nurseries?.map(nursery => (
                    <option key={nursery.id} value={nursery.id}>{nursery.name}</option>
                  ))}
                </select>
                {fieldErrors.nursery_id && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.nursery_id}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">الفرع</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                  disabled={!selectedNursery?.branches?.length || mutation.isPending}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 ${
                    fieldErrors.branch_id ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-primary-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">اختر الفرع (اختياري)</option>
                  {selectedNursery?.branches?.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
                {fieldErrors.branch_id && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.branch_id}</p>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">الصلاحيات</label>
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  { key: 'manage_children', label: 'إدارة الأطفال' },
                  { key: 'manage_reports', label: 'إدارة التقارير' },
                  { key: 'manage_staff', label: 'إدارة الموظفين' },
                  { key: 'view_analytics', label: 'عرض الإحصائيات' },
                  { key: 'manage_schedule', label: 'إدارة الجدول الزمني' },
                  { key: 'manage_inventory', label: 'إدارة المخزون' },
                ].map(permission => (
                  <label key={permission.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission.key)}
                      onChange={(e) => {
                        const newPermissions = e.target.checked
                          ? [...formData.permissions, permission.key]
                          : formData.permissions.filter(p => p !== permission.key);
                        setFormData(prev => ({ ...prev, permissions: newPermissions }));
                      }}
                      disabled={mutation.isPending}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-slate-700">{permission.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={mutation.isPending}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {mutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {mutation.isPending ? 'جاري الحفظ...' : user ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <TempPasswordModal
        open={showTempModal}
        onClose={() => {
          setShowTempModal(false);
          onSuccess();
          onClose();
        }}
        user={tempModalData.user}
        tempPassword={tempModalData.tempPassword}
      />
    </>
  );
}

export default function UserManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filters, setFilters] = useState({
    role: '',
    nurseryId: '',
    isActive: '',
  });

  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.nurseryId) params.append('nurseryId', filters.nurseryId);
      if (filters.isActive) params.append('isActive', filters.isActive);

      const response = await apiClient.get(`/admin/users?${params}`);
      return response.data;
    },
  });

  const { data: nurseries } = useQuery({
    queryKey: ['nurseries'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/nurseries');
      return response.data;
    },
  });

  const queryClient = useQueryClient();

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    let filtered = users.filter(user => {
      const matchesSearch = !searchTerm ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'nurseryName') {
        aValue = nurseries?.find(n => n.id === a.nurseryId)?.name || '';
        bValue = nurseries?.find(n => n.id === b.nurseryId)?.name || '';
      }

      if (sortField === 'role') {
        aValue = ROLE_LABELS[a.role] || a.role;
        bValue = ROLE_LABELS[b.role] || b.role;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [users, searchTerm, sortField, sortDirection, nurseries]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId, checked) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const exportToCSV = () => {
    const headers = ['الاسم الكامل', 'البريد الإلكتروني', 'الدور', 'الحضانة', 'الحالة', 'آخر دخول'];
    const csvData = filteredUsers.map(user => [
      user.fullName,
      user.email,
      ROLE_LABELS[user.role] || user.role,
      nurseries?.find(n => n.id === user.nurseryId)?.name || 'غير محدد',
      user.isActive ? 'فعال' : 'غير فعال',
      user.lastLogin ? new Date(user.lastLogin).toLocaleString('ar-JO') : 'لم يسجل دخول'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      return apiClient.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }) => {
      return apiClient.patch(`/admin/users/${userId}/activation`, { active: isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
    },
    onError: (error) => {
      const getErr = (e) =>
        e?.response?.data?.message || e?.message || 'حدث خطأ غير معروف';
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
        alert(`${getErr(error)}\n${errorMessages}`);
      } else {
        alert(getErr(error));
      }
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds) => {
      return Promise.all(userIds.map(id => apiClient.delete(`/admin/users/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setSelectedUsers([]);
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ userIds, isActive }) => {
      return Promise.all(userIds.map(id => apiClient.put(`/admin/users/${id}`, { isActive })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setSelectedUsers([]);
    },
  });

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await deleteMutation.mutateAsync(userId);
      } catch (error) {
        alert('حدث خطأ أثناء حذف المستخدم');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    if (window.confirm(`هل أنت متأكد من حذف ${selectedUsers.length} مستخدم؟`)) {
      try {
        await bulkDeleteMutation.mutateAsync(selectedUsers);
      } catch (error) {
        alert('حدث خطأ أثناء حذف المستخدمين');
      }
    }
  };

  const handleBulkStatusChange = async (isActive) => {
    if (selectedUsers.length === 0) return;
    try {
      await bulkStatusMutation.mutateAsync({ userIds: selectedUsers, isActive });
    } catch (error) {
      alert('حدث خطأ أثناء تحديث حالة المستخدمين');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await toggleStatusMutation.mutateAsync({
        userId: user.id,
        isActive: !user.isActive,
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">إدارة المستخدمين والصلاحيات</h1>
          <p className="mt-1 text-slate-600">إدارة شاملة للمستخدمين والمديرين والمشرفين</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            تصدير CSV
          </button>
          <button
            onClick={() => {
              setEditingUser(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4" />
            إضافة مستخدم جديد
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="البحث في المستخدمين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pr-10 pl-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">جميع الأدوار</option>
              <option value={USER_ROLES.ADMIN}>مشرف عام</option>
              <option value={USER_ROLES.MANAGER}>مدير حضانة</option>
              <option value={USER_ROLES.SUPERVISOR}>مشرف</option>
              <option value={USER_ROLES.PARENT}>ولي أمر</option>
            </select>

            <select
              value={filters.nurseryId}
              onChange={(e) => setFilters(prev => ({ ...prev, nurseryId: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">جميع الحضانات</option>
              {nurseries?.map(nursery => (
                <option key={nursery.id} value={nursery.id}>{nursery.name}</option>
              ))}
            </select>

            <select
              value={filters.isActive}
              onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">جميع الحالات</option>
              <option value="true">فعال</option>
              <option value="false">غير فعال</option>
            </select>

            <button
              onClick={() => {
                setFilters({ role: '', nurseryId: '', isActive: '' });
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FunnelIcon className="h-4 w-4" />
              مسح المرشحات
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">
              تم تحديد {selectedUsers.length} مستخدم
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusChange(true)}
                className="inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200"
              >
                تفعيل الكل
              </button>
              <button
                onClick={() => handleBulkStatusChange(false)}
                className="inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200"
              >
                تعطيل الكل
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200"
              >
                حذف الكل
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="inline-flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
            <span className="text-slate-600">جاري تحميل المستخدمين...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">خطأ في تحميل البيانات</h3>
              <p className="mt-1 text-sm text-red-700">{handleApiError(error)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      {users && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                المستخدمين ({filteredUsers.length})
              </h3>
              <div className="text-sm text-slate-500">
                صفحة {currentPage} من {totalPages}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 responsive-table">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('fullName')}
                  >
                    <div className="flex items-center gap-1">
                      المستخدم
                      {sortField === 'fullName' && (
                        <ChevronLeftIcon className={clsx("h-4 w-4", sortDirection === 'asc' ? 'rotate-90' : '-rotate-90')} />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-1">
                      الدور
                      {sortField === 'role' && (
                        <ChevronLeftIcon className={clsx("h-4 w-4", sortDirection === 'asc' ? 'rotate-90' : '-rotate-90')} />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('nurseryName')}
                  >
                    <div className="flex items-center gap-1">
                      الحضانة
                      {sortField === 'nurseryName' && (
                        <ChevronLeftIcon className={clsx("h-4 w-4", sortDirection === 'asc' ? 'rotate-90' : '-rotate-90')} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('lastLogin')}
                  >
                    <div className="flex items-center gap-1">
                      آخر دخول
                      {sortField === 'lastLogin' && (
                        <ChevronLeftIcon className={clsx("h-4 w-4", sortDirection === 'asc' ? 'rotate-90' : '-rotate-90')} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <UserGroupIcon className="h-12 w-12 text-slate-400" />
                        <div>
                          <h3 className="text-sm font-medium text-slate-900">لا توجد مستخدمين</h3>
                          <p className="text-sm text-slate-500">لم يتم العثور على أي مستخدمين مطابقين لمعايير البحث</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td data-label="تحديد">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td data-label="المستخدم">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {user.fullName?.charAt(0)?.toUpperCase() || 'م'}
                              </span>
                            </div>
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-slate-900">{user.fullName}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                            {user.phone && <div className="text-xs text-slate-400">{user.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td data-label="الدور">
                        <span className={clsx(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800 border-gray-200'
                        )}>
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td data-label="الحضانة">
                        {user.nurseryId ? (
                          <div>
                            <div className="font-medium">
                              {nurseries?.find(n => n.id === user.nurseryId)?.name}
                            </div>
                            {user.branchId && (
                              <div className="text-xs text-slate-500">
                                {nurseries?.find(n => n.id === user.nurseryId)?.branches?.find(b => b.id === user.branchId)?.name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">غير محدد</span>
                        )}
                      </td>
                      <td data-label="الحالة">
                        <span className={clsx(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        )}>
                          <div className={clsx(
                            'w-2 h-2 rounded-full ml-2',
                            user.isActive ? 'bg-green-400' : 'bg-red-400'
                          )} />
                          {user.isActive ? 'فعال' : 'غير فعال'}
                        </span>
                      </td>
                      <td data-label="آخر دخول">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString('ar-JO') : 'لم يسجل دخول'}
                      </td>
                      <td data-label="الإجراءات">
                        <Menu as="div" className="relative">
                          <Menu.Button className="flex items-center text-slate-400 hover:text-slate-600">
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </Menu.Button>
                          <Menu.Items className="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleEdit(user)}
                                  className={clsx(
                                    'flex w-full items-center gap-2 px-4 py-2 text-sm',
                                    active ? 'bg-slate-100' : 'text-slate-700'
                                  )}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  تحديث
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleToggleStatus(user)}
                                  className={clsx(
                                    'flex w-full items-center gap-2 px-4 py-2 text-sm',
                                    active ? 'bg-slate-100' : 'text-slate-700'
                                  )}
                                >
                                  {user.isActive ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                  {user.isActive ? 'تعطيل' : 'تفعيل'}
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className={clsx(
                                    'flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600',
                                    active ? 'bg-red-50' : ''
                                  )}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  حذف
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">
                  عرض {((currentPage - 1) * ITEMS_PER_PAGE) + 1} إلى {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} من أصل {filteredUsers.length} نتيجة
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                    السابق
                  </button>

                  <div className="flex gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return pageNumber > totalPages ? null : (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={clsx(
                            'px-3 py-2 text-sm font-medium rounded-lg',
                            currentPage === pageNumber
                              ? 'bg-primary-600 text-white'
                              : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}