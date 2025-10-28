import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';
import {
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

const NOTIFICATION_TYPES = {
  SYSTEM: 'system',
  USER: 'user',
  SECURITY: 'security',
  MAINTENANCE: 'maintenance',
  REPORT: 'report',
};

const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

const TYPE_LABELS = {
  [NOTIFICATION_TYPES.SYSTEM]: 'نظام',
  [NOTIFICATION_TYPES.USER]: 'مستخدم',
  [NOTIFICATION_TYPES.SECURITY]: 'أمان',
  [NOTIFICATION_TYPES.MAINTENANCE]: 'صيانة',
  [NOTIFICATION_TYPES.REPORT]: 'تقرير',
};

const PRIORITY_LABELS = {
  [NOTIFICATION_PRIORITIES.LOW]: 'منخفض',
  [NOTIFICATION_PRIORITIES.MEDIUM]: 'متوسط',
  [NOTIFICATION_PRIORITIES.HIGH]: 'عالي',
  [NOTIFICATION_PRIORITIES.URGENT]: 'عاجل',
};

const PRIORITY_COLORS = {
  [NOTIFICATION_PRIORITIES.LOW]: 'bg-blue-100 text-blue-800',
  [NOTIFICATION_PRIORITIES.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [NOTIFICATION_PRIORITIES.HIGH]: 'bg-orange-100 text-orange-800',
  [NOTIFICATION_PRIORITIES.URGENT]: 'bg-red-100 text-red-800',
};

function getNotificationIcon(type, priority) {
  if (priority === NOTIFICATION_PRIORITIES.URGENT) {
    return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
  }

  switch (type) {
    case NOTIFICATION_TYPES.SECURITY:
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
    case NOTIFICATION_TYPES.SYSTEM:
      return <InformationCircleIcon className="h-5 w-5 text-blue-600" />;
    case NOTIFICATION_TYPES.REPORT:
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    default:
      return <BellIcon className="h-5 w-5 text-gray-600" />;
  }
}

function NotificationFilters({ filters, onFiltersChange }) {
  return (
    <div className="card">
      <h3 className="mb-4 font-medium text-slate-800">تصفية الإشعارات</h3>
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">النوع</label>
          <select
            value={filters.type}
            onChange={(e) => onFiltersChange(prev => ({ ...prev, type: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
          >
            <option value="">جميع الأنواع</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">الأولوية</label>
          <select
            value={filters.priority}
            onChange={(e) => onFiltersChange(prev => ({ ...prev, priority: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
          >
            <option value="">جميع الأولويات</option>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">الحالة</label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange(prev => ({ ...prev, status: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
          >
            <option value="">جميع الحالات</option>
            <option value="unread">غير مقروءة</option>
            <option value="read">مقروءة</option>
            <option value="archived">مؤرشفة</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => onFiltersChange({ type: '', priority: '', status: '' })}
            className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            مسح المرشحات
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notification, onMarkAsRead, onArchive }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`rounded-lg border p-4 transition-colors ${
      notification.isRead
        ? 'border-slate-100 bg-white'
        : 'border-primary-200 bg-primary-50'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          {getNotificationIcon(notification.type, notification.priority)}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-slate-800">{notification.title}</h4>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  PRIORITY_COLORS[notification.priority] || 'bg-gray-100 text-gray-800'
                }`}>
                  {PRIORITY_LABELS[notification.priority] || notification.priority}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {TYPE_LABELS[notification.type] || notification.type}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{new Date(notification.createdAt).toLocaleString('ar-JO')}</span>
                {notification.sender && <span>من: {notification.sender}</span>}
                {notification.relatedEntity && (
                  <span>
                    {notification.relatedEntity.type}: {notification.relatedEntity.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1 ml-4">
              {!notification.isRead && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="تحديد كمقروء"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => onArchive(notification.id)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="أرشفة"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // Handle action click
                    console.log('Action clicked:', action);
                  }}
                  className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateNotificationForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: NOTIFICATION_TYPES.SYSTEM,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    targetUsers: [], // 'all', 'managers', 'supervisors', or specific user IDs
    actions: [],
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Mock API call - in real implementation, this would send to backend
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-6 text-xl font-semibold text-slate-800">إنشاء إشعار جديد</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">عنوان الإشعار</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">النوع</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              >
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">رسالة الإشعار</label>
            <textarea
              required
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">الأولوية</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">المستلمون</label>
              <select
                value={formData.targetUsers}
                onChange={(e) => setFormData(prev => ({ ...prev, targetUsers: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
              >
                <option value="all">جميع المستخدمين</option>
                <option value="managers">المديرون فقط</option>
                <option value="supervisors">المشرفون فقط</option>
                <option value="admins">المشرفون العامون فقط</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NotificationCenter() {
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    status: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mock notifications data - in real implementation, this would come from API
  const { data: notifications, isLoading, isError, error } = useQuery({
    queryKey: ['notifications', filters],
    queryFn: async () => {
      // This would be replaced with actual API call
      return [
        {
          id: 1,
          title: 'تحديث نظام الأمان',
          message: 'تم تحديث نظام الأمان وإضافة ميزات جديدة للحماية',
          type: NOTIFICATION_TYPES.SECURITY,
          priority: NOTIFICATION_PRIORITIES.HIGH,
          isRead: false,
          createdAt: new Date().toISOString(),
          sender: 'النظام',
          actions: [
            { label: 'عرض التفاصيل', action: 'view_details' },
          ],
        },
        {
          id: 2,
          title: 'تقرير شهري جاهز',
          message: 'التقرير الشهري لشهر أكتوبر متاح الآن للمراجعة',
          type: NOTIFICATION_TYPES.REPORT,
          priority: NOTIFICATION_PRIORITIES.MEDIUM,
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          sender: 'نظام التقارير',
          relatedEntity: { type: 'Report', name: 'تقرير أكتوبر 2025' },
          actions: [
            { label: 'عرض التقرير', action: 'view_report' },
            { label: 'تحميل PDF', action: 'download_pdf' },
          ],
        },
        {
          id: 3,
          title: 'صيانة مقررة',
          message: 'سيتم إجراء صيانة على النظام يوم الأحد من الساعة 2:00 صباحاً إلى 4:00 صباحاً',
          type: NOTIFICATION_TYPES.MAINTENANCE,
          priority: NOTIFICATION_PRIORITIES.URGENT,
          isRead: false,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          sender: 'فريق التقنية',
        },
        {
          id: 4,
          title: 'انضمام مستخدم جديد',
          message: 'انضم المدير أحمد محمد إلى حضانة الأمل',
          type: NOTIFICATION_TYPES.USER,
          priority: NOTIFICATION_PRIORITIES.LOW,
          isRead: true,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          sender: 'نظام المستخدمين',
          relatedEntity: { type: 'User', name: 'أحمد محمد' },
        },
      ];
    },
  });

  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      // Mock API call
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (notificationId) => {
      // Mock API call
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleArchive = (notificationId) => {
    if (window.confirm('هل أنت متأكد من أرشفة هذا الإشعار؟')) {
      archiveMutation.mutate(notificationId);
    }
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">مركز الإشعارات</h2>
          <p className="mt-1 text-sm text-slate-500">إدارة ومتابعة جميع الإشعارات في النظام</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
              <BellIcon className="h-4 w-4" />
              {unreadCount} غير مقروءة
            </span>
          )}
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <BellIcon className="h-4 w-4" />
            إشعار جديد
          </button>
        </div>
      </div>

      <NotificationFilters filters={filters} onFiltersChange={setFilters} />

      {isLoading && (
        <div className="card text-center text-sm text-slate-500">جاري تحميل الإشعارات...</div>
      )}

      {isError && (
        <div className="card text-sm text-red-500">
          {handleApiError(error)}
        </div>
      )}

      {notifications && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-800">
              الإشعارات ({notifications.length})
            </h3>
          </div>

          {notifications.length === 0 ? (
            <div className="card text-center text-slate-500">
              لا توجد إشعارات تطابق المعايير المحددة
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onArchive={handleArchive}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showCreateForm && (
        <CreateNotificationForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            // Success handled by mutation
          }}
        />
      )}
    </div>
  );
}