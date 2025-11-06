import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  BarsArrowDownIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';
import TempPasswordModal from '../../components/TempPasswordModal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { apiClient, handleApiError, extractErrorMessage, extractFieldErrors, getEndpoint } from '../../lib/apiClient';
import { USER_ROLES } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';

const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'مشرف عام',
  [USER_ROLES.MANAGER]: 'مدير حضانة',
  [USER_ROLES.SUPERVISOR]: 'مشرف',
  [USER_ROLES.PARENT]: 'ولي أمر',
};

const ROLE_BADGE_VARIANT = {
  [USER_ROLES.ADMIN]: 'primary',
  [USER_ROLES.MANAGER]: 'success',
  [USER_ROLES.SUPERVISOR]: 'warning',
  [USER_ROLES.PARENT]: 'gray',
};

const STATUS_LABELS = {
  active: 'فعال',
  inactive: 'معطل',
};

const STATUS_BADGE_VARIANT = {
  active: 'success',
  inactive: 'gray',
};

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'جميع الأدوار' },
  { value: USER_ROLES.ADMIN, label: 'مشرف عام' },
  { value: USER_ROLES.MANAGER, label: 'مدير حضانة' },
  { value: USER_ROLES.SUPERVISOR, label: 'مشرف' },
  { value: USER_ROLES.PARENT, label: 'ولي أمر' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'كل الحالات' },
  { value: 'active', label: 'فعال' },
  { value: 'inactive', label: 'معطل' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const SORT_OPTIONS = [
  { field: 'fullName', label: 'المستخدم', defaultDirection: 'asc' },
  { field: 'role', label: 'الدور', defaultDirection: 'asc' },
  { field: 'nursery', label: 'الحضانة', defaultDirection: 'asc' },
  { field: 'isActive', label: 'الحالة', defaultDirection: 'desc' },
  { field: 'lastLogin', label: 'آخر دخول', defaultDirection: 'desc' },
  { field: 'createdAt', label: 'تاريخ الإنشاء', defaultDirection: 'desc' },
];

const SORT_FIELD_MAP = {
  fullName: 'full_name',
  role: 'role',
  nursery: 'nursery',
  isActive: 'is_active',
  lastLogin: 'last_login',
  createdAt: 'created_at',
};

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

function getInitials(fullName = '', email = '') {
  const source = fullName?.trim() || email?.trim();
  if (!source) {
    return '';
  }

  const parts = source.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function formatDateTime(value, { fallback = 'غير متوفر', withTime = true } = {}) {
  if (!value) {
    return fallback;
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return fallback;
    }
    return date.toLocaleString('ar-JO', {
      dateStyle: 'short',
      timeStyle: withTime ? 'short' : undefined,
    });
  } catch (error) {
    return fallback;
  }
}

function normalizeUsersResponse(payload, fallbackPage, fallbackPageSize) {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.results)
          ? payload.results
          : [];

  const total = typeof payload?.total === 'number'
    ? payload.total
    : typeof payload?.count === 'number'
      ? payload.count
      : payload?.pagination?.total ?? items.length;

  const page = payload?.page ?? payload?.pagination?.page ?? fallbackPage;
  const pageSize = payload?.pageSize ?? payload?.pagination?.pageSize ?? fallbackPageSize;

  return {
    items,
    total,
    page,
    pageSize,
  };
}

function normalizeNurseriesResponse(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  return [];
}

function resolveNurseryLabel(user, nurseryMap, branchMap) {
  if (!user) {
    return 'غير محدد';
  }

  const branchId = user.branchId ?? user.branch_id ?? user.branch?.id;
  if (branchId && branchMap.has(Number(branchId))) {
    const branch = branchMap.get(Number(branchId));
    const parent = nurseryMap.get(Number(branch.nurseryId));
    if (parent) {
      const branchIndex = Array.isArray(parent.branches)
        ? parent.branches.findIndex((item) => item.id === branch.id)
        : -1;
      const branchLabel = branchIndex >= 0 ? `فرع ${branchIndex + 1}` : 'فرع';
      return `${parent.name} - ${branchLabel}`;
    }
    return branch.name || branch.branchName || 'فرع';
  }

  const nurseryId = user.nurseryId ?? user.nursery_id ?? user.nursery?.id;
  if (nurseryId && nurseryMap.has(Number(nurseryId))) {
    return nurseryMap.get(Number(nurseryId)).name;
  }

  return (
    user.nurseryName
    ?? user.nursery_name
    ?? user.nursery?.name
    ?? user.branch?.name
    ?? 'غير محدد'
  );
}
function FilterMenu({ value, options, onChange, placeholder }) {
  const activeOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <Menu as="div" className="relative inline-block text-right">
      <Menu.Button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
        <FunnelIcon className="h-4 w-4 text-slate-400" />
        <span>{activeOption?.label ?? placeholder}</span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-20 mt-2 w-48 origin-top-left overflow-hidden rounded-2xl bg-white py-2 text-sm shadow-xl ring-1 ring-black/5 focus:outline-none">
          {options.map((option) => (
            <Menu.Item key={option.value}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => onChange(option.value)}
                  className={clsx(
                    'flex w-full items-center justify-between px-4 py-2 text-right transition',
                    active ? 'bg-primary-50 text-primary-700' : 'text-slate-700'
                  )}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <CheckCircleIcon className="h-4 w-4 text-primary-500" />
                  )}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function SortableHeader({ label, field, sort, onSort, align = 'right' }) {
  const isActive = sort.field === field;
  const direction = isActive ? sort.direction : null;

  return (
    <th
      scope="col"
      className={clsx(
        'sticky top-0 z-10 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-600',
        align === 'center' ? 'text-center' : align === 'left' ? 'text-left' : 'text-right'
      )}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-2 text-slate-600 transition hover:text-primary-600 focus:outline-none"
      >
        <span>{label}</span>
        <BarsArrowDownIcon
          className={clsx(
            'h-4 w-4 transition-transform',
            isActive ? 'text-primary-600' : 'text-slate-400',
            direction === 'asc' ? 'rotate-180' : 'rotate-0'
          )}
        />
      </button>
    </th>
  );
}

function UserRowActions({
  user,
  onEdit,
  onToggleStatus,
  onDelete,
  canToggle,
  canDelete,
  isToggling,
  isDeleting,
}) {
  const isActive = user?.isActive ?? user?.is_active ?? false;

  return (
    <Menu as="div" className="relative inline-block text-right">
      <Menu.Button
        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="إجراءات المستخدم"
        title="إجراءات المستخدم"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-30 mt-3 w-52 origin-top-left overflow-hidden rounded-2xl bg-white py-2 text-sm shadow-2xl ring-1 ring-black/5 focus:outline-none">
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                onClick={onEdit}
                className={clsx(
                  'flex w-full items-center justify-between px-4 py-2 transition',
                  active ? 'bg-primary-50 text-primary-700' : 'text-slate-700'
                )}
              >
                <span className="flex items-center gap-2">
                  <PencilIcon className="h-4 w-4" />
                  تحديث
                </span>
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                onClick={onToggleStatus}
                disabled={!canToggle || isToggling}
                className={clsx(
                  'flex w-full items-center justify-between px-4 py-2 transition',
                  active ? 'bg-primary-50 text-primary-700' : 'text-slate-700',
                  (!canToggle || isToggling) && 'cursor-not-allowed opacity-50'
                )}
              >
                <span className="flex items-center gap-2">
                  {isToggling ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isActive ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                  {isActive ? 'تعطيل' : 'تفعيل'}
                </span>
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                type="button"
                onClick={onDelete}
                disabled={!canDelete || isDeleting}
                className={clsx(
                  'flex w-full items-center justify-between px-4 py-2 transition',
                  active ? 'bg-red-50 text-danger-600' : 'text-danger-600',
                  (!canDelete || isDeleting) && 'cursor-not-allowed opacity-50'
                )}
              >
                <span className="flex items-center gap-2">
                  {isDeleting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                  حذف
                </span>
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function BulkToolbar({ count, onEnable, onDisable, onDelete, disabled, loading }) {
  return (
    <div className="fixed inset-x-0 bottom-6 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full bg-white px-6 py-3 shadow-2xl ring-1 ring-slate-200">
        <span className="text-sm font-medium text-slate-700">تم تحديد {count} مستخدم</span>
        <Button
          size="sm"
          variant="secondary"
          onClick={onEnable}
          disabled={disabled || loading === 'enable'}
          loading={loading === 'enable'}
        >
          تفعيل
        </Button>
        <Button
          size="sm"
          variant="warning"
          onClick={onDisable}
          disabled={disabled || loading === 'disable'}
          loading={loading === 'disable'}
        >
          تعطيل
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={onDelete}
          disabled={disabled || loading === 'delete'}
          loading={loading === 'delete'}
        >
          حذف
        </Button>
      </div>
    </div>
  );
}
function UserForm({ user, onClose, onSuccess, onTempCredentials }) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: user?.fullName || user?.full_name || '',
    phone: user?.phone || '',
    role: user?.role || USER_ROLES.MANAGER,
    nurseryId: user?.nurseryId || user?.nursery_id || '',
    branchId: user?.branchId || user?.branch_id || '',
    permissions: user?.permissions || [],
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const queryClient = useQueryClient();

  const { data: nurseryRaw, isLoading: nurseriesLoading } = useQuery({
    queryKey: ['admin-nurseries', 'form'],
    queryFn: async () => {
      const response = await apiClient.get(getEndpoint('/admin/nurseries'));
      return normalizeNurseriesResponse(response.data);
    },
  });

  const nurseries = nurseryRaw ?? [];

  const selectedNursery = useMemo(() => {
    if (!formData.nurseryId) {
      return null;
    }
    const numericId = Number(formData.nurseryId);
    return nurseries.find((item) => Number(item.id) === numericId) || null;
  }, [formData.nurseryId, nurseries]);

  const branchOptions = useMemo(() => {
    const branches = selectedNursery?.branches
      ?? selectedNursery?.Branches
      ?? selectedNursery?.data?.branches
      ?? [];
    return Array.isArray(branches) ? branches : [];
  }, [selectedNursery]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const requestBody = {
        full_name: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        nursery_id: payload.nurseryId ? Number(payload.nurseryId) : null,
        branch_id: payload.branchId ? Number(payload.branchId) : null,
        permissions: payload.permissions,
      };

      if (user?.id) {
        return apiClient.put(getEndpoint(`/admin/users/${user.id}`), requestBody);
      }

      return apiClient.post(getEndpoint('/admin/users'), requestBody);
    },
    onMutate: () => {
      setFieldErrors({});
      setGeneralError('');
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(user ? 'تم تحديث المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح');

      if (!user && response?.data?.ephemeral?.temp_password && formData.role === USER_ROLES.MANAGER) {
        onTempCredentials?.({
          email: formData.email,
          tempPassword: response.data.ephemeral.temp_password,
        });
      }

      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      const fieldErrs = extractFieldErrors(error);
      setFieldErrors(fieldErrs);
      const generalErr = extractErrorMessage(error) || handleApiError(error);
      setGeneralError(generalErr);
      toast.error(generalErr);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">
            {user ? 'تحديث المستخدم' : 'إضافة مستخدم جديد'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <form className="px-6 py-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">الاسم الكامل</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))}
                className={clsx(
                  'mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                  fieldErrors.full_name ? 'border-red-300 focus:border-red-400' : 'border-slate-300 focus:border-primary-300'
                )}
                placeholder="أدخل الاسم الكامل"
                disabled={mutation.isPending}
              />
              {fieldErrors.full_name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.full_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                className={clsx(
                  'mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                  fieldErrors.email ? 'border-red-300 focus:border-red-400' : 'border-slate-300 focus:border-primary-300'
                )}
                placeholder="example@domain.com"
                disabled={mutation.isPending}
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
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                className={clsx(
                  'mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                  fieldErrors.phone ? 'border-red-300 focus:border-red-400' : 'border-slate-300 focus:border-primary-300'
                )}
                placeholder="07XXXXXXXX"
                disabled={mutation.isPending}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">الدور</label>
              <select
                value={formData.role}
                onChange={(event) => setFormData((prev) => ({ ...prev, role: event.target.value }))}
                className={clsx(
                  'mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                  fieldErrors.role ? 'border-red-300 focus:border-red-400' : 'border-slate-300 focus:border-primary-300'
                )}
                disabled={mutation.isPending}
              >
                {ROLE_FILTER_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {fieldErrors.role && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.role}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">الحضانة الرئيسية</label>
              <select
                value={formData.nurseryId}
                onChange={(event) => setFormData((prev) => ({
                  ...prev,
                  nurseryId: event.target.value,
                  branchId: '',
                }))}
                className={clsx(
                  'mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100',
                  fieldErrors.nursery_id ? 'border-red-300 focus:border-red-400' : 'border-slate-300 focus:border-primary-300'
                )}
                disabled={mutation.isPending || nurseriesLoading}
              >
                <option value="">اختر الحضانة</option>
                {nurseries.map((nursery) => (
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
                onChange={(event) => setFormData((prev) => ({ ...prev, branchId: event.target.value }))}
                className={clsx(
                  'mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-400',
                  fieldErrors.branch_id ? 'border-red-300 focus:border-red-400' : 'border-slate-300 focus:border-primary-300'
                )}
                disabled={!branchOptions.length || mutation.isPending}
              >
                <option value="">بدون فرع</option>
                {branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
              {fieldErrors.branch_id && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.branch_id}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-3 block text-sm font-medium text-slate-700">الصلاحيات الإضافية</label>
            <div className="grid gap-2 md:grid-cols-2">
              {[ 
                { key: 'manage_children', label: 'إدارة ملفات الأطفال' },
                { key: 'manage_reports', label: 'إدارة التقارير' },
                { key: 'manage_staff', label: 'إدارة الكادر' },
                { key: 'view_analytics', label: 'عرض التقارير التحليلية' },
                { key: 'manage_schedule', label: 'إدارة الجداول' },
                { key: 'manage_inventory', label: 'إدارة المستلزمات' },
              ].map((permission) => (
                <label key={permission.key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    checked={formData.permissions.includes(permission.key)}
                    onChange={(event) => {
                      setFormData((prev) => {
                        const nextPermissions = event.target.checked
                          ? [...prev.permissions, permission.key]
                          : prev.permissions.filter((item) => item !== permission.key);
                        return { ...prev, permissions: nextPermissions };
                      });
                    }}
                    disabled={mutation.isPending}
                  />
                  <span>{permission.label}</span>
                </label>
              ))}
            </div>
          </div>

          {generalError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {generalError}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
              إلغاء
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {user ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [pageState, setPageState] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(25);
  const [sort, setSort] = useState({ field: 'lastLogin', direction: 'desc' });
  const [filters, setFilters] = useState({ role: 'all', status: 'all', nursery: 'all' });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [tempCredentials, setTempCredentials] = useState(null);
  const [showTempModal, setShowTempModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState(() => new Set());

  const currentUserId = currentUser?.id ?? currentUser?.sub ?? null;
  const canManageUsers = currentUser?.role === USER_ROLES.ADMIN;

  const usersQueryKey = useMemo(() => ([
    'admin-users',
    {
      page: pageState,
      pageSize: pageSizeState,
      sortField: sort.field,
      sortDirection: sort.direction,
      role: filters.role,
      status: filters.status,
      nursery: filters.nursery,
      search: debouncedSearch,
    },
  ]), [pageState, pageSizeState, sort.field, sort.direction, filters.role, filters.status, filters.nursery, debouncedSearch]);

  const {
    data: usersData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: usersQueryKey,
    keepPreviousData: true,
    queryFn: async () => {
      const params = {
        page: pageState,
        pageSize: pageSizeState,
        limit: pageSizeState,
        skip: (pageState - 1) * pageSizeState,
        sortField: SORT_FIELD_MAP[sort.field] ?? sort.field,
        sortDirection: sort.direction,
      };

      if (filters.role !== 'all') {
        params.role = filters.role;
      }
      if (filters.status !== 'all') {
        params.status = filters.status;
        params.is_active = filters.status === 'active';
        params.active = filters.status === 'active';
      }
      if (filters.nursery !== 'all') {
        params.nurseryId = Number(filters.nursery);
        params.nursery_id = Number(filters.nursery);
      }
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
        params.query = debouncedSearch.trim();
      }

      const response = await apiClient.get(getEndpoint('/admin/users'), { params });
      return normalizeUsersResponse(response.data, pageState, pageSizeState);
    },
  });

  const { data: nurseriesRaw } = useQuery({
    queryKey: ['admin-nurseries', 'list'],
    queryFn: async () => {
      const response = await apiClient.get(getEndpoint('/admin/nurseries'));
      return normalizeNurseriesResponse(response.data);
    },
  });

  const nurseries = nurseriesRaw ?? [];

  const nurseryOptions = useMemo(() => (
    [
      { value: 'all', label: 'جميع الحضانات' },
      ...nurseries.map((nursery) => ({ value: String(nursery.id), label: nursery.name })),
    ]
  ), [nurseries]);

  const nurseryMap = useMemo(() => {
    const map = new Map();
    nurseries.forEach((nursery) => {
      map.set(Number(nursery.id), nursery);
    });
    return map;
  }, [nurseries]);

  const branchMap = useMemo(() => {
    const map = new Map();
    nurseries.forEach((nursery) => {
      const branches = Array.isArray(nursery?.branches) ? nursery.branches : [];
      branches.forEach((branch) => {
        map.set(Number(branch.id), {
          ...branch,
          nurseryId: nursery.id,
          nurseryName: nursery.name,
        });
      });
    });
    return map;
  }, [nurseries]);

  const users = usersData?.items ?? [];
  const total = usersData?.total ?? 0;
  const currentPage = usersData?.page ?? pageState;
  const pageSize = usersData?.pageSize ?? pageSizeState;
  const totalPages = Math.max(1, Math.ceil(total / (pageSize || 1)));

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set();
      users.forEach((user) => {
        if (prev.has(Number(user.id))) {
          next.add(Number(user.id));
        }
      });
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) {
        return prev;
      }
      return next;
    });
  }, [users]);

  const allSelectionDisabled = users.length === 0;
  const allSelected = !allSelectionDisabled && users.every((user) => selectedIds.has(Number(user.id)));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    const next = new Set(selectedIds);
    users.forEach((user) => {
      next.add(Number(user.id));
    });
    setSelectedIds(next);
  };

  const handleToggleSelect = (userId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };
  const handleSort = (field) => {
    setSort((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      const defaultOption = SORT_OPTIONS.find((option) => option.field === field);
      return {
        field,
        direction: defaultOption?.defaultDirection ?? 'asc',
      };
    });
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (user) => {
    setEditingUser({
      ...user,
      fullName: user.fullName ?? user.full_name ?? '',
      nurseryId: user.nurseryId ?? user.nursery_id ?? '',
      branchId: user.branchId ?? user.branch_id ?? '',
    });
    setShowForm(true);
  };

  const handleRequestToggle = (user) => {
    const isActive = user?.isActive ?? user?.is_active ?? false;
    setConfirmAction({ type: isActive ? 'disable' : 'enable', user });
  };

  const handleRequestDelete = (user) => {
    setConfirmAction({ type: 'delete', user });
  };

  const handleBulkEnableRequest = () => {
    if (!selectedIds.size) {
      toast.error('لم يتم تحديد أي مستخدم');
      return;
    }
    setConfirmAction({ type: 'bulk-enable' });
  };

  const handleBulkDisableRequest = () => {
    if (!selectedIds.size) {
      toast.error('لم يتم تحديد أي مستخدم');
      return;
    }
    setConfirmAction({ type: 'bulk-disable' });
  };

  const handleBulkDeleteRequest = () => {
    if (!selectedIds.size) {
      toast.error('لم يتم تحديد أي مستخدم');
      return;
    }
    setConfirmAction({ type: 'bulk-delete' });
  };

  const handleExport = useCallback(async () => {
    try {
      const params = {
        page: 1,
        pageSize: 1000,
        limit: 1000,
        skip: 0,
        sortField: SORT_FIELD_MAP[sort.field] ?? sort.field,
        sortDirection: sort.direction,
      };

      if (filters.role !== 'all') {
        params.role = filters.role;
      }
      if (filters.status !== 'all') {
        params.status = filters.status;
        params.is_active = filters.status === 'active';
      }
      if (filters.nursery !== 'all') {
        params.nurseryId = Number(filters.nursery);
      }
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const response = await apiClient.get(getEndpoint('/admin/users'), { params });
      const { items } = normalizeUsersResponse(response.data, 1, 1000);

      if (!items.length) {
        toast.error('لا توجد بيانات لتصديرها');
        return;
      }

      const header = [
        'الاسم الكامل',
        'البريد الإلكتروني',
        'الدور',
        'الحضانة',
        'الحالة',
        'آخر دخول',
        'رقم الهاتف',
      ];

      const rows = items.map((item) => {
        const isActive = item.isActive ?? item.is_active;
        return [
          item.fullName ?? item.full_name ?? '',
          item.email ?? '',
          ROLE_LABELS[item.role] ?? item.role ?? '',
          resolveNurseryLabel(item, nurseryMap, branchMap),
          isActive ? 'فعال' : 'معطل',
          formatDateTime(item.lastLogin ?? item.last_login, { fallback: 'لم يسجل دخول' }),
          item.phone ?? '',
        ];
      });

      const csvContent = ['\uFEFF' + header.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('تم تصدير المستخدمين بنجاح');
    } catch (exportError) {
      toast.error(handleApiError(exportError));
    }
  }, [branchMap, debouncedSearch, filters.nursery, filters.role, filters.status, nurseryMap, sort.direction, sort.field]);

  const performBulkAction = useCallback(async (kind) => {
    const actionableUsers = users.filter((user) => selectedIds.has(Number(user.id)) && Number(user.id) !== Number(currentUserId));

    if (!actionableUsers.length) {
      toast.error('لا توجد حسابات يمكن تنفيذ العملية عليها');
      setConfirmAction(null);
      return;
    }

    setBulkLoading(kind);
    try {
      if (kind === 'delete') {
        await Promise.all(actionableUsers.map((user) => apiClient.delete(getEndpoint(`/admin/users/${user.id}`))));
        toast.success('تم حذف جميع الحسابات المحددة');
      } else {
        const active = kind === 'enable';
        await Promise.all(actionableUsers.map((user) => apiClient.patch(getEndpoint(`/admin/users/${user.id}/activation`), { active })));
        toast.success(active ? 'تم تفعيل جميع الحسابات المحددة' : 'تم تعطيل جميع الحسابات المحددة');
      }
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (bulkError) {
      toast.error(handleApiError(bulkError));
    } finally {
      setBulkLoading(null);
      setConfirmAction(null);
    }
  }, [currentUserId, queryClient, selectedIds, users]);
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, active }) => {
      const response = await apiClient.patch(getEndpoint(`/admin/users/${userId}/activation`), { active });
      return response.data;
    },
    onMutate: async ({ userId, active }) => {
      await queryClient.cancelQueries({ queryKey: usersQueryKey });
      const previous = queryClient.getQueryData(usersQueryKey);
      queryClient.setQueryData(usersQueryKey, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          items: old.items.map((item) => (
            Number(item.id) === Number(userId)
              ? { ...item, isActive: active, is_active: active }
              : item
          )),
        };
      });
      return { previous };
    },
    onError: (mutationError, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(usersQueryKey, context.previous);
      }
      toast.error(handleApiError(mutationError));
    },
    onSuccess: (_data, { active }) => {
      toast.success(active ? 'تم تفعيل الحساب بنجاح' : 'تم تعطيل الحساب بنجاح');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ userId }) => {
      const response = await apiClient.delete(getEndpoint(`/admin/users/${userId}`));
      return response.data;
    },
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: usersQueryKey });
      const previous = queryClient.getQueryData(usersQueryKey);
      queryClient.setQueryData(usersQueryKey, (old) => {
        if (!old) {
          return old;
        }
        const nextItems = old.items.filter((item) => Number(item.id) !== Number(userId));
        return {
          ...old,
          items: nextItems,
          total: Math.max(0, (old.total ?? nextItems.length + 1) - 1),
        };
      });
      return { previous };
    },
    onError: (mutationError, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(usersQueryKey, context.previous);
      }
      toast.error(handleApiError(mutationError));
    },
    onSuccess: () => {
      toast.success('تم حذف المستخدم بنجاح');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const handleConfirmToggle = () => {
    if (!confirmAction?.user) {
      return;
    }
    toggleStatusMutation.mutate(
      {
        userId: confirmAction.user.id,
        active: confirmAction.type === 'enable',
      },
      {
        onSuccess: () => {
          setConfirmAction(null);
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!confirmAction?.user) {
      return;
    }
    deleteMutation.mutate(
      { userId: confirmAction.user.id },
      {
        onSuccess: () => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(Number(confirmAction.user.id));
            return next;
          });
          setConfirmAction(null);
        },
      },
    );
  };
  const isToggleConfirmOpen = confirmAction?.type === 'disable' || confirmAction?.type === 'enable';
  const isDeleteConfirmOpen = confirmAction?.type === 'delete';
  const isBulkEnableOpen = confirmAction?.type === 'bulk-enable';
  const isBulkDisableOpen = confirmAction?.type === 'bulk-disable';
  const isBulkDeleteOpen = confirmAction?.type === 'bulk-delete';
  return (
    <main aria-labelledby="user-management-title">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 id="user-management-title" className="text-2xl font-bold text-slate-900">إدارة المستخدمين والصلاحيات</h1>
          <p className="mt-1 text-sm text-slate-600">تحكم بحسابات الفريق وتابع نشاطهم من مكان واحد.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" icon={PlusIcon} onClick={handleAddUser}>
            إضافة مستخدم
          </Button>
          <Button variant="secondary" icon={ArrowDownTrayIcon} onClick={handleExport}>
            تصدير CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPageState(1);
            }}
            placeholder="ابحث بالاسم أو البريد الإلكتروني أو رقم الهاتف"
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-700 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterMenu
            value={filters.role}
            options={ROLE_FILTER_OPTIONS}
            onChange={(value) => {
              setFilters((prev) => ({ ...prev, role: value }));
              setPageState(1);
            }}
            placeholder="الأدوار"
          />
          <FilterMenu
            value={filters.nursery}
            options={nurseryOptions}
            onChange={(value) => {
              setFilters((prev) => ({ ...prev, nursery: value }));
              setPageState(1);
            }}
            placeholder="الحضانات"
          />
          <FilterMenu
            value={filters.status}
            options={STATUS_FILTER_OPTIONS}
            onChange={(value) => {
              setFilters((prev) => ({ ...prev, status: value }));
              setPageState(1);
            }}
            placeholder="الحالة"
          />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16">
              <LoadingSpinner className="mx-auto" />
            </div>
          ) : isError ? (
            <EmptyState
              title="تعذر تحميل المستخدمين"
              description={handleApiError(error)}
              action={() => queryClient.invalidateQueries({ queryKey: usersQueryKey })}
              actionLabel="إعادة المحاولة"
            />
          ) : users.length === 0 ? (
            <EmptyState
              title="لا يوجد مستخدمون"
              description="ابدأ بإضافة أول مستخدم ليظهر في القائمة."
              action={handleAddUser}
              actionLabel="إضافة مستخدم"
            />
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 shadow-sm">
                <tr>
                  <th scope="col" className="sticky top-0 z-10 w-12 px-6 py-3 text-right">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      checked={allSelected}
                      onChange={handleToggleSelectAll}
                      disabled={allSelectionDisabled}
                    />
                  </th>
                  <SortableHeader label="المستخدم" field="fullName" sort={sort} onSort={handleSort} />
                  <SortableHeader label="الدور" field="role" sort={sort} onSort={handleSort} align="center" />
                  <SortableHeader label="الحضانة" field="nursery" sort={sort} onSort={handleSort} />
                  <SortableHeader label="الحالة" field="isActive" sort={sort} onSort={handleSort} align="center" />
                  <SortableHeader label="آخر دخول" field="lastLogin" sort={sort} onSort={handleSort} />
                  <SortableHeader label="تاريخ الإنشاء" field="createdAt" sort={sort} onSort={handleSort} />
                  <th scope="col" className="sticky top-0 z-10 bg-slate-50 px-6 py-3 text-center text-sm font-semibold text-slate-600">
                    حالة كلمة المرور
                  </th>
                  <th scope="col" className="sticky top-0 z-10 px-6 py-3 text-center text-sm font-semibold text-slate-600">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const userId = Number(user.id);
                  const isSelected = selectedIds.has(userId);
                  const isActive = user.isActive ?? user.is_active ?? false;
                  const statusKey = isActive ? 'active' : 'inactive';
                  const nurseryLabel = resolveNurseryLabel(user, nurseryMap, branchMap);
                  const lastLoginLabel = user.lastLogin ?? user.last_login;
                  const createdAtLabel = user.createdAt ?? user.created_at;

                  return (
                    <tr
                      key={userId}
                      className={clsx(
                        'bg-white transition-colors hover:bg-primary-50/40',
                        !isActive && 'bg-slate-50 text-slate-500'
                      )}
                    >
                      <td className="w-12 px-6 py-4 align-middle">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(userId)}
                        />
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center justify-end gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-base font-semibold text-primary-600">
                            {getInitials(user.fullName ?? user.full_name, user.email) || <UserIcon className="h-5 w-5" />}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">
                              {user.fullName ?? user.full_name ?? 'بدون اسم'}
                            </div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                            {user.phone && (
                              <div className="text-xs text-slate-500">{user.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center align-middle">
                        <Badge variant={ROLE_BADGE_VARIANT[user.role] ?? 'gray'} size="sm">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="text-right text-sm font-medium text-slate-700">{nurseryLabel}</div>
                      </td>
                      <td className="px-6 py-4 text-center align-middle">
                        <Badge variant={STATUS_BADGE_VARIANT[statusKey]} size="sm" dot>
                          {STATUS_LABELS[statusKey]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 align-middle text-right text-sm text-slate-600">
                        {formatDateTime(lastLoginLabel, { fallback: 'لم يسجل دخول' })}
                      </td>
                      <td className="px-6 py-4 align-middle text-right text-sm text-slate-600">
                        {formatDateTime(createdAtLabel, { fallback: 'غير متوفر', withTime: false })}
                      </td>
                      <td className="px-6 py-4 text-center align-middle">
                        <Badge 
                          variant={(user.must_reset_password || user.mustResetPassword) ? "warning" : "success"} 
                          size="sm"
                        >
                          {(user.must_reset_password || user.mustResetPassword) ? "يتطلب إعادة تعيين" : "تم التعيين"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center align-middle">
                        <UserRowActions
                          user={user}
                          onEdit={() => handleEdit(user)}
                          onToggleStatus={() => handleRequestToggle(user)}
                          onDelete={() => handleRequestDelete(user)}
                          canToggle={canManageUsers && userId !== Number(currentUserId)}
                          canDelete={canManageUsers && userId !== Number(currentUserId)}
                          isToggling={toggleStatusMutation.isPending && confirmAction?.user?.id === user.id}
                          isDeleting={deleteMutation.isPending && confirmAction?.user?.id === user.id}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {isFetching && !isLoading && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-white/80 to-transparent py-2 text-xs text-slate-500">
            تحديث البيانات...
          </div>
        )}
      </div>

      {users.length > 0 && (
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            عرض {(currentPage - 1) * pageSize + 1}
            {' '}
            إلى
            {' '}
            {Math.min(currentPage * pageSize, total)}
            {' '}
            من أصل
            {' '}
            {total}
            {' '}
            مستخدم
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <span>عدد الصفوف:</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  const nextSize = Number(event.target.value);
                  setPageSizeState(nextSize);
                  setPageState(1);
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageState((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                icon={ChevronRightIcon}
              >
                السابق
              </Button>
              <span className="px-3 py-1 text-sm font-medium text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPageState((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                icon={ChevronLeftIcon}
                iconPosition="right"
              >
                التالي
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedIds.size > 0 && (
        <BulkToolbar
          count={selectedIds.size}
          onEnable={handleBulkEnableRequest}
          onDisable={handleBulkDisableRequest}
          onDelete={handleBulkDeleteRequest}
          disabled={!canManageUsers}
          loading={bulkLoading}
        />
      )}

      {showForm && (
        <UserForm
          user={editingUser}
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          }}
          onTempCredentials={(data) => {
            setTempCredentials(data);
            setShowTempModal(true);
          }}
        />
      )}

      {tempCredentials && (
        <TempPasswordModal
          open={showTempModal}
          onClose={() => {
            setShowTempModal(false);
            setTempCredentials(null);
          }}
          user={{ email: tempCredentials.email }}
          tempPassword={tempCredentials.tempPassword}
        />
      )}

      <ConfirmDialog
        open={isToggleConfirmOpen}
        title={confirmAction?.type === 'disable' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
        description={confirmAction?.type === 'disable'
          ? 'سيتم تعطيل هذا الحساب ولن يتمكن المستخدم من تسجيل الدخول.'
          : 'سيتم تفعيل هذا الحساب وسيتمكن المستخدم من تسجيل الدخول مرة أخرى.'}
        confirmLabel={confirmAction?.type === 'disable' ? 'تعطيل' : 'تفعيل'}
        cancelLabel="إلغاء"
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmToggle}
        loading={toggleStatusMutation.isPending}
        variant={confirmAction?.type === 'disable' ? 'warning' : 'success'}
      />

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="حذف المستخدم"
        description="سيتم حذف هذا المستخدم بشكل نهائي ولا يمكن التراجع عن ذلك."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        confirmValue={confirmAction?.user?.email}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
        variant="danger"
      />

      <ConfirmDialog
        open={isBulkEnableOpen}
        title="تفعيل المستخدمين"
        description="سيتم تفعيل جميع الحسابات المحددة."
        confirmLabel="تفعيل"
        cancelLabel="إلغاء"
        onClose={() => setConfirmAction(null)}
        onConfirm={() => performBulkAction('enable')}
        loading={bulkLoading === 'enable'}
        variant="success"
      />

      <ConfirmDialog
        open={isBulkDisableOpen}
        title="تعطيل المستخدمين"
        description="سيتم تعطيل جميع الحسابات المحددة."
        confirmLabel="تعطيل"
        cancelLabel="إلغاء"
        onClose={() => setConfirmAction(null)}
        onConfirm={() => performBulkAction('disable')}
        loading={bulkLoading === 'disable'}
        variant="warning"
      />

      <ConfirmDialog
        open={isBulkDeleteOpen}
        title="حذف المستخدمين"
        description="سيتم حذف جميع المستخدمين المحددين بشكل نهائي."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onClose={() => setConfirmAction(null)}
        onConfirm={() => performBulkAction('delete')}
        loading={bulkLoading === 'delete'}
        variant="danger"
      />
      </div>
    </main>
  );
}
