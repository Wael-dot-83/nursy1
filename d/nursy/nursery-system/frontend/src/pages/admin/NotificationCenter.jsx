
import {
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiClient, handleApiError } from '../../lib/apiClient';
import { getNotifications, markAsRead, deleteNotification, markAllAsRead } from '../../lib/api/notifications';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import clsx from 'clsx';

// Constants for Notification metadata
const NOTIFICATION_TYPES = {
  SECURITY: 'security',
  REPORT: 'report',
  MAINTENANCE: 'maintenance',
  USER: 'user',
  GENERAL: 'general',
};

const NOTIFICATION_PRIORITIES = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

const typeIcons = {
  [NOTIFICATION_TYPES.SECURITY]: ExclamationTriangleIcon,
  [NOTIFICATION_TYPES.REPORT]: InformationCircleIcon,
  [NOTIFICATION_TYPES.MAINTENANCE]: BellIcon,
  [NOTIFICATION_TYPES.USER]: CheckCircleIcon,
  [NOTIFICATION_TYPES.GENERAL]: BellIcon,
};

const priorityColors = {
  [NOTIFICATION_PRIORITIES.URGENT]: 'bg-red-100 text-red-800',
  [NOTIFICATION_PRIORITIES.HIGH]: 'bg-yellow-100 text-yellow-800',
  [NOTIFICATION_PRIORITIES.MEDIUM]: 'bg-blue-100 text-blue-800',
  [NOTIFICATION_PRIORITIES.LOW]: 'bg-gray-100 text-gray-800',
};

function NotificationItem({ notification, onMarkAsRead, onDelete }) {
  const Icon = typeIcons[notification.type] || BellIcon;
  const priorityColor = priorityColors[notification.priority] || priorityColors.low;

  return (
    <div
      className={clsx(
        'card flex items-start gap-4 p-4 transition-colors',
        !notification.isRead ? 'bg-white' : 'bg-slate-50'
      )}
    >
      {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary-500 mt-2 flex-shrink-0"></div>}
      <div className="flex-shrink-0">
        <Icon className="h-6 w-6 text-slate-500" />
      </div>
      <div className="flex-grow">
        <div className="flex items-center justify-between">
          <h4 className={clsx('font-semibold', !notification.isRead ? 'text-slate-800' : 'text-slate-600')}>
            {notification.title}
          </h4>
          <span className="text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</span>
        </div>
        <p className="mt-1 text-sm text-slate-500">{notification.message}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColor}`}>
              {notification.priority}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!notification.isRead && (
              <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(notification.id)}>
                <EyeIcon className="h-4 w-4 mr-1" />
                وضع علامة كمقروء
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => onDelete(notification.id)}>
              <TrashIcon className="h-4 w-4 mr-1" />
              حذف
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationCenter() {
  const [filters, setFilters] = useState({ type: '', priority: '', status: 'all' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const queryClient = useQueryClient();
  const queryKey = ['notifications', filters, page, pageSize];

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => getNotifications({ ...filters, page, per_page: pageSize }),
    placeholderData: (previousData) => previousData,
  });

  const notifications = data?.data || [];
  const pagination = data?.meta;

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);
      toast.success('تم وضع العلامة كمقروء');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);
      toast.success('تم حذف الإشعار');
      setConfirmDelete(null);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);
      toast.success('تم وضع العلامة على جميع الإشعارات كمقروءة');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <EmptyState title="خطأ في تحميل الإشعارات" description={error.message} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">مركز الإشعارات</h1>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setShowCreateForm(true)}>
            إنشاء إشعار جديد
          </Button>
          <Button variant="secondary" onClick={handleMarkAllAsRead} disabled={markAllAsReadMutation.isLoading}>
            وضع علامة على الكل كمقروء
          </Button>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-b">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">النوع</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            >
              <option value="">جميع الأنواع</option>
              <option value={NOTIFICATION_TYPES.SECURITY}>أمان</option>
              <option value={NOTIFICATION_TYPES.REPORT}>تقرير</option>
              <option value={NOTIFICATION_TYPES.MAINTENANCE}>صيانة</option>
              <option value={NOTIFICATION_TYPES.USER}>مستخدم</option>
              <option value={NOTIFICATION_TYPES.GENERAL}>عام</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الأولوية</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            >
              <option value="">جميع الأولويات</option>
              <option value={NOTIFICATION_PRIORITIES.URGENT}>عاجل</option>
              <option value={NOTIFICATION_PRIORITIES.HIGH}>عالي</option>
              <option value={NOTIFICATION_PRIORITIES.MEDIUM}>متوسط</option>
              <option value={NOTIFICATION_PRIORITIES.LOW}>منخفض</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            >
              <option value="all">جميع الإشعارات</option>
              <option value="unread">غير مقروءة</option>
              <option value="read">مقروءة</option>
            </select>
          </div>
        </div>

        <div className="p-4">
          {notifications.length === 0 ? (
            <EmptyState title="لا توجد إشعارات" description="لا توجد إشعارات تطابق الفلاتر المحددة." />
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={setConfirmDelete}
                />
              ))}
            </div>
          )}
        </div>

        {pagination && (
          <div className="border-t p-4">
            <Pagination
              currentPage={page}
              totalPages={pagination.last_page}
              totalItems={pagination.total}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        title="تأكيد الحذف"
        message="هل أنت متأكد من رغبتك في حذف هذا الإشعار؟"
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
}
