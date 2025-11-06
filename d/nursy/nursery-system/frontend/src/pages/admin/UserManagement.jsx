
import React, { useState, useMemo, Fragment } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Dialog, Transition } from '@headlessui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import EmptyState from '../../components/ui/EmptyState';

// Helper components for table headers and cells
const TableHeader = ({ children, sortKey, currentSort, onSort, className = '' }) => {
  const isSorted = currentSort.key === sortKey;
  const directionIcon = isSorted ? (currentSort.direction === 'asc' ? '▲' : '▼') : '';

  return (
    <th scope="col" className={`py-3.5 pr-3 text-right text-sm font-semibold text-gray-900 ${className}`}>
      <button onClick={() => onSort(sortKey)} className="flex items-center gap-1 group">
        <span>{children}</span>
        <span className={`transition-opacity ${isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
          {directionIcon}
        </span>
      </button>
    </th>
  );
};

const USER_ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  PARENT: 'parent',
  STAFF: 'staff',
};

const USER_ROLE_NAMES = {
  [USER_ROLES.ADMIN]: 'مدير النظام',
  [USER_ROLES.SUPERVISOR]: 'مشرف',
  [USER_ROLES.PARENT]: 'ولي أمر',
  [USER_ROLES.STAFF]: 'موظف',
};

const ROLE_STYLES = {
  [USER_ROLES.ADMIN]: 'bg-purple-100 text-purple-800',
  [USER_ROLES.SUPERVISOR]: 'bg-blue-100 text-blue-800',
  [USER_ROLES.PARENT]: 'bg-yellow-100 text-yellow-800',
  [USER_ROLES.STAFF]: 'bg-gray-100 text-gray-800',
  default: 'bg-gray-100 text-gray-800',
};

// Helper component for user row actions
const UserRowActions = ({ user, onEdit, onToggleStatus, onDelete, canToggle, canDelete, isToggling, isDeleting }) => {
  return (
    <div className="flex justify-end gap-2">
      {canToggle && (
        <button
          onClick={onToggleStatus}
          disabled={isToggling}
          className={`text-${user.is_active ? 'red' : 'green'}-600 hover:text-${user.is_active ? 'red' : 'green'}-900`}
        >
          {isToggling ? (
            <span className="animate-pulse">جاري التحديث...</span>
          ) : user.is_active ? (
            <span>تعطيل</span>
          ) : (
            <span>تفعيل</span>
          )}
        </button>
      )}
      <button
        onClick={onEdit}
        className="text-primary-600 hover:text-primary-900"
      >
        <PencilIcon className="h-5 w-5" />
      </button>
      {canDelete && (
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-900"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(null);
  const [sort, setSort] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedPeople, setSelectedPeople] = useState([]);

  const currentUserId = currentUser?.id ?? currentUser?.sub ?? null;
  const canManageUsers = currentUser?.role === USER_ROLES.ADMIN;

  const handleSort = (key) => {
    setSort((prevSort) => {
      if (prevSort.key === key) {
        return { key, direction: prevSort.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };
  
  const sortedUsers = useMemo(() => {
    if (!users) return [];
    const direction = sort.direction === 'asc' ? 1 : -1;
    const sorted = [...users].sort((a, b) => {
      let valA = a[sort.key];
      let valB = b[sort.key];
      
      if (typeof valA === 'string') {
        return valA.localeCompare(valB) * direction;
      }
      if (key.includes('_at')) {
        return (new Date(valA).getTime() - new Date(valB).getTime()) * direction;
      }
      if (typeof valA === 'number') {
        return (valA - valB) * direction;
      }
      return 0;
    });
    return sorted;
  }, [users, sort]);

  const queryClient = useQueryClient();

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { mutate: deleteUser, isLoading: isDeletingUser } = useMutation({
    mutationFn: (userId) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      toast.success('تم حذف المستخدم بنجاح');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء حذف المستخدم');
    },
  });

  const { mutate: toggleUserStatus } = useMutation({
    mutationFn: (userId) => api.patch(`/users/${userId}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      toast.success('تم تحديث حالة المستخدم بنجاح');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء تحديث حالة المستخدم');
    },
  });

  const handleBulkAction = (action) => {
    if (selectedPeople.length === 0) {
      toast.error('يجب تحديد مستخدمين للتنفيذ');
      return;
    }

    setBulkLoading(action);
    if (action === 'activate') {
      selectedPeople.forEach(userId => toggleUserStatus(userId));
    } else if (action === 'deactivate') {
      selectedPeople.forEach(userId => toggleUserStatus(userId));
    } else if (action === 'delete') {
      setConfirmAction({
        title: 'هل أنت متأكد؟',
        message: `هل تريد حذف ${selectedPeople.length} مستخدم(ين)؟`,
        action: () => {
          selectedPeople.forEach(userId => deleteUser(userId));
          setSelectedPeople([]);
        },
      });
    }
    setBulkLoading(null);
  };

  // ... inside the UserManagement component's return statement
  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="relative">
            {/* ... bulk actions code */}
            <table role="grid" aria-label="Users" className="min-w-full table-fixed divide-y divide-gray-300">
              <thead>
                <tr role="row">
                  <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                    {/* ... checkbox */}
                  </th>
                  <TableHeader sortKey="name" currentSort={sort} onSort={handleSort}>
                    المستخدم
                  </TableHeader>
                  <TableHeader sortKey="role" currentSort={sort} onSort={handleSort}>
                    الدور
                  </TableHeader>
                  <TableHeader sortKey="status" currentSort={sort} onSort={handleSort}>
                    الحالة
                  </TableHeader>
                  <TableHeader sortKey="created_at" currentSort={sort} onSort={handleSort}>
                    تاريخ الإنشاء
                  </TableHeader>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">الإجراءات</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-500">
                      جاري تحميل المستخدمين...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-red-600">
                      حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.
                    </td>
                  </tr>
                ) : sortedUsers && sortedUsers.length > 0 ? (
                  sortedUsers.map((user) => (
                    <tr
                      key={user.id}
                      role="row"
                      className={selectedPeople.includes(user.id) ? 'bg-gray-50' : undefined}
                    >
                      <td role="gridcell" className="relative px-7 sm:w-12 sm:px-6">
                        {selectedPeople.includes(user.id) && (
                          <div className="absolute inset-y-0 right-0 w-0.5 bg-primary-600" />
                        )}
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                          value={user.id}
                          checked={selectedPeople.includes(user.id)}
                          onChange={(e) =>
                            setSelectedPeople(
                              e.target.checked
                                ? [...selectedPeople, user.id]
                                : selectedPeople.filter((p) => p !== user.id)
                            )
                          }
                        />
                      </td>
                      <td role="gridcell" className="whitespace-nowrap py-4 pr-3 text-sm text-right font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img className="h-10 w-10 rounded-full object-cover" src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="" />
                          </div>
                          <div>
                            <div className="font-bold">{user.name}</div>
                            <div className="text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td role="gridcell" className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[user.role] || ROLE_STYLES.default}`}>
                          {USER_ROLE_NAMES[user.role] || user.role}
                        </span>
                      </td>
                      <td role="gridcell" className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td role="gridcell" className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td role="gridcell" className="relative whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6">
                        <UserRowActions
                          user={user}
                          onEdit={() => {
                            setEditingUser(user);
                            setShowForm(true);
                          }}
                          onToggleStatus={() => toggleUserStatus.mutate(user)}
                          onDelete={() =>
                            setConfirmAction({
                              title: 'تأكيد الحذف',
                              message: `هل أنت متأكد من رغبتك في حذف المستخدم "${user.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
                              action: () => deleteUser(user.id),
                              confirmText: 'نعم، قم بالحذف',
                            })
                          }
                          canToggle={currentUser?.id !== user.id}
                          canDelete={currentUser?.id !== user.id}
                          isToggling={
                            toggleUserStatus.isLoading &&
                            toggleUserStatus.variables?.id === user.id
                          }
                          isDeleting={isDeletingUser && deleteUser.variables === user.id}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-10 text-center">
                      <EmptyState
                        title="لا توجد مستخدمين"
                        description="لا توجد أي مستخدمين في النظام حالياً."
                        icon={<UserIcon className="h-12 w-12 text-gray-400" />}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    {/* User Form Modal */}
    {showForm && (
      <UserForm
        user={editingUser}
        onClose={() => {
          setShowForm(false);
          setEditingUser(null);
        }}
      />
    )}

    {/* Confirmation Modal */}
    {confirmAction && (
      <ConfirmActionModal
        title={confirmAction.title}
        message={confirmAction.message}
        onConfirm={() => {
          confirmAction.action();
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
        confirmButtonText={confirmAction.confirmText || 'تأكيد'}
        cancelButtonText="إلغاء"
      />
    )}
  );
}

function UserForm({ user, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || USER_ROLES.STAFF,
    is_active: user?.is_active ?? true,
    nursery_id: user?.nursery_id || null,
  });
  const [errors, setErrors] = useState({});

  const { data: nurseries } = useQuery({
    queryKey: ['nurseries'],
    queryFn: () => api.get('/nurseries').then(res => res.data),
    staleTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: (userData) =>
      user
        ? api.put(`/users/${user.id}`, userData)
        : api.post('/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      toast.success(user ? 'تم تحديث المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح');
      onClose();
    },
    onError: (error) => {
      const apiErrors = error.response?.data?.errors || {};
      setErrors(apiErrors);
      toast.error(error.response?.data?.message || 'حدث خطأ ما');
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = { ...formData };
    if (!dataToSubmit.password) {
      delete dataToSubmit.password; // Don't send empty password on update
    }
    if (dataToSubmit.role !== USER_ROLES.SUPERVISOR) {
        dataToSubmit.nursery_id = null;
    } else if (dataToSubmit.nursery_id === "") {
        dataToSubmit.nursery_id = null;
    }

    mutation.mutate(dataToSubmit);
  };

  const isSupervisor = formData.role === USER_ROLES.SUPERVISOR;

  return (
    <Modal
      show={true}
      onClose={onClose}
      title={user ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isLoading}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={mutation.isLoading}
            disabled={mutation.isLoading}
          >
            {user ? 'حفظ التغييرات' : 'إنشاء مستخدم'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="الاسم الكامل"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
        <InputField
          label="البريد الإلكتروني"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        <InputField
          label="كلمة المرور"
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder={user ? 'اتركه فارغاً لعدم التغيير' : ''}
          required={!user}
        />
        <SelectField
          label="الدور"
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          error={errors.role}
          required
        >
          {Object.entries(USER_ROLE_NAMES).map(([key, name]) => (
            <option key={key} value={key}>{name}</option>
          ))}
        </SelectField>

        {isSupervisor && (
          <SelectField
            label="الحضانة"
            id="nursery_id"
            name="nursery_id"
            value={formData.nursery_id || ''}
            onChange={handleChange}
            error={errors.nursery_id}
          >
            <option value="">-- اختر حضانة --</option>
            {nurseries?.map(nursery => (
              <option key={nursery.id} value={nursery.id}>{nursery.name}</option>
            ))}
          </SelectField>
        )}

        <div className="flex items-center">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="is_active" className="mr-3 block text-sm font-medium text-gray-700">
            الحساب نشط
          </label>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmActionModal({ title, message, onConfirm, onCancel, confirmButtonText, cancelButtonText, isLoading }) {
  return (
    <Modal show={true} onClose={onCancel} title={title}>
      <p className="text-sm text-gray-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          {cancelButtonText}
        </Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
          {confirmButtonText}
        </Button>
      </div>
    </Modal>
  );
}

// This closing brace was missing for the main UserManagement component
}

export default UserManagement;
