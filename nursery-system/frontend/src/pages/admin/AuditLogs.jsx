import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';
import {
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

const ACTION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  VIEW: 'view',
  EXPORT: 'export',
};

const ACTION_LABELS = {
  [ACTION_TYPES.CREATE]: 'إنشاء',
  [ACTION_TYPES.UPDATE]: 'تحديث',
  [ACTION_TYPES.DELETE]: 'حذف',
  [ACTION_TYPES.LOGIN]: 'تسجيل دخول',
  [ACTION_TYPES.LOGOUT]: 'تسجيل خروج',
  [ACTION_TYPES.VIEW]: 'عرض',
  [ACTION_TYPES.EXPORT]: 'تصدير',
};

const ENTITY_TYPES = {
  USER: 'User',
  NURSERY: 'Nursery',
  CHILD: 'Child',
  BRANCH: 'Branch',
  REPORT: 'Report',
  ATTENDANCE: 'Attendance',
};

const ENTITY_LABELS = {
  [ENTITY_TYPES.USER]: 'مستخدم',
  [ENTITY_TYPES.NURSERY]: 'حضانة',
  [ENTITY_TYPES.CHILD]: 'طفل',
  [ENTITY_TYPES.BRANCH]: 'فرع',
  [ENTITY_TYPES.REPORT]: 'تقرير',
  [ENTITY_TYPES.ATTENDANCE]: 'حضور',
};

function getActionIcon(action) {
  switch (action) {
    case ACTION_TYPES.CREATE:
      return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
    case ACTION_TYPES.UPDATE:
      return <InformationCircleIcon className="h-4 w-4 text-blue-600" />;
    case ACTION_TYPES.DELETE:
      return <XCircleIcon className="h-4 w-4 text-red-600" />;
    case ACTION_TYPES.LOGIN:
      return <UserIcon className="h-4 w-4 text-green-600" />;
    case ACTION_TYPES.LOGOUT:
      return <UserIcon className="h-4 w-4 text-gray-600" />;
    default:
      return <DocumentTextIcon className="h-4 w-4 text-gray-600" />;
  }
}

function AuditLogFilters({ filters, onFiltersChange, users }) {
  return (
    <div className="card">
      <h3 className="mb-4 font-medium text-slate-800">تصفية السجلات</h3>
      <div className="grid gap-4 md:grid-cols-5">
        <div>
          <label className="block text-sm font-medium text-slate-700">تاريخ البداية</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFiltersChange(prev => ({ ...prev, startDate: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">تاريخ النهاية</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFiltersChange(prev => ({ ...prev, endDate: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">المستخدم</label>
          <select
            value={filters.userId}
            onChange={(e) => onFiltersChange(prev => ({ ...prev, userId: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
          >
            <option value="">جميع المستخدمين</option>
            {users?.map(user => (
              <option key={user.id} value={user.id}>{user.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">نوع الإجراء</label>
          <select
            value={filters.action}
            onChange={(e) => onFiltersChange(prev => ({ ...prev, action: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
          >
            <option value="">جميع الإجراءات</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">نوع الكيان</label>
          <select
            value={filters.entity}
            onChange={(e) => onFiltersChange(prev => ({ ...prev, entity: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
          >
            <option value="">جميع الكيانات</option>
            {Object.entries(ENTITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onFiltersChange({
            startDate: '',
            endDate: '',
            userId: '',
            action: '',
            entity: '',
          })}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          مسح المرشحات
        </button>
      </div>
    </div>
  );
}

function AuditLogEntry({ log }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-lg border border-slate-100 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
          {getActionIcon(log.action)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800">
                {ACTION_LABELS[log.action] || log.action}
              </span>
              <span className="text-sm text-slate-500">
                {ENTITY_LABELS[log.entity] || log.entity}
              </span>
              {log.entityId && (
                <span className="text-xs text-slate-400">#{log.entityId}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ClockIcon className="h-4 w-4" />
              {new Date(log.createdAt).toLocaleString('ar-JO')}
            </div>
          </div>

          <div className="mt-1 text-sm text-slate-600">
            <span className="font-medium">{log.user?.fullName || 'مستخدم غير معروف'}</span>
            {log.details && (
              <span className="mr-2">
                - {log.details}
              </span>
            )}
          </div>

          {log.changes && Object.keys(log.changes).length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
              </button>
              {showDetails && (
                <div className="mt-2 rounded-md bg-slate-50 p-3 text-sm">
                  <h5 className="font-medium text-slate-700 mb-2">التغييرات:</h5>
                  <div className="space-y-1">
                    {Object.entries(log.changes).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-600">{key}:</span>
                        <span className="text-slate-800 font-medium">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {log.ipAddress && (
            <div className="mt-1 text-xs text-slate-400">
              IP: {log.ipAddress}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditLogs() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    action: '',
    entity: '',
  });

  // Mock audit logs data - in a real implementation, this would come from an API
  const { data: auditLogs, isLoading, isError, error } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      // This would be replaced with actual API call
      // For now, return mock data
      return [
        {
          id: 1,
          action: 'create',
          entity: 'Nursery',
          entityId: 1,
          user: { id: 1, fullName: 'المشرف العام' },
          details: 'تم إنشاء حضانة جديدة',
          changes: { name: 'حضانة الأمل', mainGovernorate: 'عمان' },
          ipAddress: '192.168.1.100',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          action: 'update',
          entity: 'User',
          entityId: 2,
          user: { id: 1, fullName: 'المشرف العام' },
          details: 'تم تحديث صلاحيات المستخدم',
          changes: { permissions: ['manage_children', 'view_reports'] },
          ipAddress: '192.168.1.100',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 3,
          action: 'login',
          entity: 'User',
          entityId: 3,
          user: { id: 3, fullName: 'مدير الحضانة' },
          details: 'تسجيل دخول ناجح',
          ipAddress: '192.168.1.101',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 4,
          action: 'delete',
          entity: 'Child',
          entityId: 5,
          user: { id: 2, fullName: 'المشرف' },
          details: 'تم حذف سجل طفل',
          changes: { reason: 'طلب الوالدين' },
          ipAddress: '192.168.1.102',
          createdAt: new Date(Date.now() - 10800000).toISOString(),
        },
      ];
    },
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await apiClient.get('/api/admin/users');
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">سجلات النظام (Audit Logs)</h2>
        <p className="mt-1 text-sm text-slate-500">متابعة جميع الأنشطة والتغييرات في النظام</p>
      </div>

      <AuditLogFilters
        filters={filters}
        onFiltersChange={setFilters}
        users={users}
      />

      {isLoading && (
        <div className="card text-center text-sm text-slate-500">جاري تحميل السجلات...</div>
      )}

      {isError && (
        <div className="card text-sm text-red-500">
          {handleApiError(error)}
        </div>
      )}

      {auditLogs && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-800">
              السجلات ({auditLogs.length})
            </h3>
            <div className="text-sm text-slate-500">
              آخر تحديث: {new Date().toLocaleString('ar-JO')}
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="card text-center text-slate-500">
              لا توجد سجلات تطابق المعايير المحددة
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <AuditLogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Statistics */}
      {auditLogs && auditLogs.length > 0 && (
        <div className="card">
          <h4 className="mb-4 font-medium text-slate-800">إحصائيات السجلات</h4>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {auditLogs.filter(log => log.action === 'create').length}
              </div>
              <div className="text-sm text-slate-500">عمليات إنشاء</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {auditLogs.filter(log => log.action === 'update').length}
              </div>
              <div className="text-sm text-slate-500">عمليات تحديث</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {auditLogs.filter(log => log.action === 'delete').length}
              </div>
              <div className="text-sm text-slate-500">عمليات حذف</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {auditLogs.filter(log => log.action === 'login').length}
              </div>
              <div className="text-sm text-slate-500">تسجيلات الدخول</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}