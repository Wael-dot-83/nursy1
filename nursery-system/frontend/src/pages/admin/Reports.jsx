import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, handleApiError } from '../../lib/apiClient';
import {
  ChartBarIcon,
  DocumentTextIcon,
  MapPinIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

const REPORT_TYPES = {
  NURSERY_OVERVIEW: 'nursery_overview',
  USER_ACTIVITY: 'user_activity',
  CHILDREN_DEMOGRAPHICS: 'children_demographics',
  GEOGRAPHICAL_DISTRIBUTION: 'geographical_distribution',
  AGE_GROUP_ANALYSIS: 'age_group_analysis',
  PERFORMANCE_METRICS: 'performance_metrics',
};

const REPORT_LABELS = {
  [REPORT_TYPES.NURSERY_OVERVIEW]: 'نظرة عامة على الحضانات',
  [REPORT_TYPES.USER_ACTIVITY]: 'نشاط المستخدمين',
  [REPORT_TYPES.CHILDREN_DEMOGRAPHICS]: 'إحصائيات الأطفال',
  [REPORT_TYPES.GEOGRAPHICAL_DISTRIBUTION]: 'التوزيع الجغرافي',
  [REPORT_TYPES.AGE_GROUP_ANALYSIS]: 'تحليل الفئات العمرية',
  [REPORT_TYPES.PERFORMANCE_METRICS]: 'مؤشرات الأداء',
};

function ReportCard({ title, description, icon, onClick, isLoading }) {
  return (
    <div
      onClick={onClick}
      className="card cursor-pointer transition-all hover:shadow-lg hover:border-primary-200"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {isLoading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
          جاري إنشاء التقرير...
        </div>
      )}
    </div>
  );
}

function ReportFilters({ filters, onFiltersChange, nurseries }) {
  const safeNurseries = Array.isArray(nurseries) ? nurseries : [];

  return (
    <div className="card">
      <h3 className="mb-4 font-medium text-slate-800">تصفية التقارير</h3>
      <div className="grid gap-4 md:grid-cols-4">
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
          <label className="block text-sm font-medium text-slate-700">الحضانة</label>
          <select
            value={filters.nurseryId}
            onChange={(e) => onFiltersChange(prev => ({ ...prev, nurseryId: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
          >
            <option value="">جميع الحضانات</option>
            {safeNurseries.map(nursery => (
              <option key={nursery.id} value={nursery.id}>{nursery.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">المحافظة</label>
          <select
            value={filters.governorate}
            onChange={(e) => onFiltersChange(prev => ({ ...prev, governorate: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
          >
            <option value="">جميع المحافظات</option>
            <option value="عمان">عمان</option>
            <option value="إربد">إربد</option>
            <option value="الزرقاء">الزرقاء</option>
            <option value="المفرق">المفرق</option>
            <option value="الطفيلة">الطفيلة</option>
            <option value="معان">معان</option>
            <option value="العقبة">العقبة</option>
            <option value="الكرك">الكرك</option>
            <option value="مادبا">مادبا</option>
            <option value="عجلون">عجلون</option>
            <option value="جرش">جرش</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function ReportResults({ reportType, data, filters }) {
  if (!data) return null;

  const renderNurseryOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">{data.totalNurseries || 0}</div>
          <div className="text-sm text-slate-500">إجمالي الحضانات</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{data.activeNurseries || 0}</div>
          <div className="text-sm text-slate-500">الحضانات الفعالة</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{data.totalBranches || 0}</div>
          <div className="text-sm text-slate-500">إجمالي الأفرع</div>
        </div>
      </div>

      {data.nurseriesByGovernorate && (
        <div className="card">
          <h4 className="mb-4 font-medium text-slate-800">توزيع الحضانات حسب المحافظات</h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {data.nurseriesByGovernorate.map((item) => (
              <div key={item.governorate} className="rounded-lg border border-slate-100 p-3">
                <div className="font-medium text-slate-700">{item.governorate}</div>
                <div className="text-2xl font-bold text-primary-600">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderUserActivity = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">{data.totalUsers || 0}</div>
          <div className="text-sm text-slate-500">إجمالي المستخدمين</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{data.activeUsers || 0}</div>
          <div className="text-sm text-slate-500">المستخدمون الفعالون</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{data.recentLogins || 0}</div>
          <div className="text-sm text-slate-500">تسجيلات الدخول الأخيرة</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-600">{data.pendingInvitations || 0}</div>
          <div className="text-sm text-slate-500">الدعوات المعلقة</div>
        </div>
      </div>

      {data.usersByRole && (
        <div className="card">
          <h4 className="mb-4 font-medium text-slate-800">توزيع المستخدمين حسب الدور</h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {data.usersByRole.map((item) => (
              <div key={item.role} className="rounded-lg border border-slate-100 p-3">
                <div className="font-medium text-slate-700">{item.role}</div>
                <div className="text-2xl font-bold text-primary-600">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderChildrenDemographics = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">{data.totalChildren || 0}</div>
          <div className="text-sm text-slate-500">إجمالي الأطفال</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{data.activeChildren || 0}</div>
          <div className="text-sm text-slate-500">الأطفال النشطون</div>
        </div>
      </div>

      {data.childrenByAgeGroup && (
        <div className="card">
          <h4 className="mb-4 font-medium text-slate-800">توزيع الأطفال حسب الفئات العمرية</h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {data.childrenByAgeGroup.map((item) => (
              <div key={item.age_group} className="rounded-lg border border-slate-100 p-3">
                <div className="font-medium text-slate-700">{item.age_group}</div>
                <div className="text-2xl font-bold text-primary-600">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.childrenByGender && (
        <div className="card">
          <h4 className="mb-4 font-medium text-slate-800">توزيع الأطفال حسب الجنس</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {data.childrenByGender.map((item) => (
              <div key={item.gender} className="rounded-lg border border-slate-100 p-3">
                <div className="font-medium text-slate-700">{item.gender === 'M' ? 'ذكور' : 'إناث'}</div>
                <div className="text-2xl font-bold text-primary-600">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  switch (reportType) {
    case REPORT_TYPES.NURSERY_OVERVIEW:
      return renderNurseryOverview();
    case REPORT_TYPES.USER_ACTIVITY:
      return renderUserActivity();
    case REPORT_TYPES.CHILDREN_DEMOGRAPHICS:
      return renderChildrenDemographics();
    default:
      return <div className="card text-center text-slate-500">نوع التقرير غير مدعوم</div>;
  }
}

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    nurseryId: '',
    governorate: '',
  });

  const { data: rawNurseries } = useQuery({
    queryKey: ['nurseries'],
    queryFn: async () => {
      const response = await apiClient.get('/api/admin/nurseries');
      return response.data;
    },
  });

  const nurseryCandidates = [
    rawNurseries,
    rawNurseries?.data,
    rawNurseries?.nurseries,
    rawNurseries?.items,
    rawNurseries?.results,
  ];
  const nurseries = nurseryCandidates.find(Array.isArray) ?? [];

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const response = await apiClient.get('/api/system/analytics');
      return response.data;
    },
  });

  const generateReport = (reportType) => {
    setSelectedReport(reportType);
    // In a real implementation, this would call an API to generate the specific report
    // For now, we'll use the analytics data
  };

  const exportReport = (format = 'pdf') => {
    // In a real implementation, this would call an API to export the report
    alert(`سيتم تصدير التقرير بصيغة ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">التقارير الشاملة</h2>
          <p className="mt-1 text-sm text-slate-500">تقارير تفصيلية لكل الحضانات والأفرع</p>
        </div>
        {selectedReport && (
          <div className="flex gap-2">
            <button
              onClick={() => exportReport('pdf')}
              className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              تصدير PDF
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              تصدير Excel
            </button>
          </div>
        )}
      </div>

      {!selectedReport && (
        <>
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            nurseries={nurseries}
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ReportCard
              title="نظرة عامة على الحضانات"
              description="إحصائيات شاملة للحضانات والأفرع حسب الموقع الجغرافي"
              icon={<ChartBarIcon className="h-6 w-6" />}
              onClick={() => generateReport(REPORT_TYPES.NURSERY_OVERVIEW)}
            />
            <ReportCard
              title="نشاط المستخدمين"
              description="تحليل نشاط المستخدمين والمديرين والمشرفين"
              icon={<UserGroupIcon className="h-6 w-6" />}
              onClick={() => generateReport(REPORT_TYPES.USER_ACTIVITY)}
            />
            <ReportCard
              title="إحصائيات الأطفال"
              description="توزيع الأطفال حسب الفئات العمرية والجنس"
              icon={<DocumentTextIcon className="h-6 w-6" />}
              onClick={() => generateReport(REPORT_TYPES.CHILDREN_DEMOGRAPHICS)}
            />
            <ReportCard
              title="التوزيع الجغرافي"
              description="خريطة توزيع الحضانات والأفرع في المحافظات"
              icon={<MapPinIcon className="h-6 w-6" />}
              onClick={() => generateReport(REPORT_TYPES.GEOGRAPHICAL_DISTRIBUTION)}
            />
            <ReportCard
              title="تحليل الفئات العمرية"
              description="تحليل الخدمات المقدمة حسب الفئات العمرية"
              icon={<CalendarIcon className="h-6 w-6" />}
              onClick={() => generateReport(REPORT_TYPES.AGE_GROUP_ANALYSIS)}
            />
            <ReportCard
              title="مؤشرات الأداء"
              description="مقاييس الأداء والكفاءة للحضانات"
              icon={<ChartBarIcon className="h-6 w-6" />}
              onClick={() => generateReport(REPORT_TYPES.PERFORMANCE_METRICS)}
            />
          </div>
        </>
      )}

      {selectedReport && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800">
              {REPORT_LABELS[selectedReport]}
            </h3>
            <button
              onClick={() => setSelectedReport(null)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              العودة للتقارير
            </button>
          </div>

          <ReportResults
            reportType={selectedReport}
            data={analytics}
            filters={filters}
          />
        </div>
      )}
    </div>
  );
}
