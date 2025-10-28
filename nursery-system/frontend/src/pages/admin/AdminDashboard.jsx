import { useQuery } from '@tanstack/react-query';
import { useAdminAnalytics } from '../../hooks/useAPI';
import { handleApiError } from '../../lib/apiClient';
import {
  BuildingStorefrontIcon,
  CheckCircleIcon,
  UsersIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ClockIcon,
  ChartBarIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function MetricCard({ label, value, icon, accent = 'bg-primary-100 text-primary-700', trend, trendValue }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-900">{value?.toLocaleString('ar-JO') || 0}</p>
            {trend && trendValue && (
              <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-3 w-3" />
                ) : (
                  <ArrowTrendingDownIcon className="h-3 w-3" />
                )}
                {trendValue}%
              </div>
            )}
          </div>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${accent} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function SkeletonLoader({ className = '' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
      <div className="h-8 bg-slate-200 rounded w-1/2"></div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonLoader className="h-8 w-64 mb-2" />
        <SkeletonLoader className="h-4 w-96" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
            <SkeletonLoader />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
            <SkeletonLoader className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, j) => (
                <SkeletonLoader key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading, isError, error, refetch } = useAdminAnalytics();

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">لوحة تحكم المشرف العام</h2>
          <p className="mt-1 text-sm text-slate-500">نظرة عامة شاملة على النشاط في النظام</p>
        </div>

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
          <div className="mt-4">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const userRoleChartData = {
    labels: data?.usersByRole?.map(item => {
      const roleLabels = {
        admin: 'مشرف عام',
        manager: 'مدير حضانة',
        supervisor: 'مشرف',
        parent: 'ولي أمر'
      };
      return roleLabels[item.role] || item.role;
    }) || [],
    datasets: [{
      data: data?.usersByRole?.map(item => item.count) || [],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)', // blue
        'rgba(16, 185, 129, 0.8)', // green
        'rgba(245, 158, 11, 0.8)', // yellow
        'rgba(239, 68, 68, 0.8)',   // red
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
      ],
      borderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
        displayColors: true,
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">لوحة تحكم المشرف العام</h1>
          <p className="mt-2 text-slate-600">نظرة عامة شاملة على النشاط في النظام</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            تحديث
          </button>
          <div className="text-sm text-slate-500">
            آخر تحديث: {new Date().toLocaleString('ar-JO')}
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="عدد الحضانات"
          value={data?.totalNurseries}
          icon={<BuildingStorefrontIcon className="h-7 w-7" />}
          accent="bg-blue-100 text-blue-700"
          trend="up"
          trendValue="12"
        />
        <MetricCard
          label="الحضانات الفعالة"
          value={data?.activeNurseries}
          icon={<CheckCircleIcon className="h-7 w-7" />}
          accent="bg-green-100 text-green-700"
          trend="up"
          trendValue="8"
        />
        <MetricCard
          label="عدد المستخدمين"
          value={data?.totalUsers}
          icon={<UsersIcon className="h-7 w-7" />}
          accent="bg-purple-100 text-purple-700"
          trend="up"
          trendValue="15"
        />
        <MetricCard
          label="إجمالي الأطفال"
          value={data?.totalChildren}
          icon={<UserGroupIcon className="h-7 w-7" />}
          accent="bg-pink-100 text-pink-700"
          trend="up"
          trendValue="23"
        />
        <MetricCard
          label="التقارير المعلقة"
          value={data?.pendingReports}
          icon={<DocumentTextIcon className="h-7 w-7" />}
          accent="bg-yellow-100 text-yellow-700"
          trend="down"
          trendValue="5"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Roles Distribution */}
        {data?.usersByRole && data.usersByRole.length > 0 && (
          <ChartCard
            title="توزيع المستخدمين حسب الدور"
            subtitle="إحصائيات تفصيلية لكل دور في النظام"
          >
            <div className="h-80">
              <Doughnut data={userRoleChartData} options={chartOptions} />
            </div>
          </ChartCard>
        )}

        {/* Children by Age Groups */}
        {data?.childrenByAgeGroup && data.childrenByAgeGroup.length > 0 && (
          <ChartCard
            title="توزيع الأطفال حسب الفئات العمرية"
            subtitle="إحصائيات الأطفال المسجلين في النظام"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {data.childrenByAgeGroup.map((item, index) => (
                <div key={item.age_group} className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{item.age_group}</p>
                      <p className="text-2xl font-bold text-slate-800">{item.count}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-yellow-100 text-yellow-700', 'bg-purple-100 text-purple-700'][index % 4]
                    }`}>
                      <ChartBarIcon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-primary-500 transition-all duration-500"
                      style={{ width: `${(item.count / Math.max(...data.childrenByAgeGroup.map(g => g.count))) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>

      {/* Additional Analytics */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Nurseries by Governorate */}
        {data?.nurseriesByGovernorate && data.nurseriesByGovernorate.length > 0 && (
          <ChartCard
            title="الحضانات حسب المحافظات"
            subtitle="التوزيع الجغرافي للحضانات"
            className="lg:col-span-2"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.nurseriesByGovernorate.slice(0, 6).map((item) => (
                <div key={item.governorate} className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="h-8 w-8 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-800">{item.governorate}</p>
                      <p className="text-2xl font-bold text-primary-600">{item.count}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}

        {/* Recent Activity */}
        <ChartCard
          title="النشاط الأخير"
          subtitle="آخر العمليات في النظام"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <UsersIcon className="h-4 w-4 text-green-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">مستخدم جديد</p>
                <p className="text-xs text-green-600">منذ 5 دقائق</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <BuildingStorefrontIcon className="h-4 w-4 text-blue-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">حضانة جديدة</p>
                <p className="text-xs text-blue-600">منذ 15 دقيقة</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-yellow-50 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                <DocumentTextIcon className="h-4 w-4 text-yellow-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">تقرير جديد</p>
                <p className="text-xs text-yellow-600">منذ 30 دقيقة</p>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Recent Logins Table */}
      {data?.recentLogins?.length > 0 && (
        <ChartCard
          title="آخر تسجيلات الدخول"
          subtitle="متابعة النشاط الأخير للمستخدمين"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الدور
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    البريد الإلكتروني
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    آخر دخول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {data.recentLogins.map((user, index) => (
                  <tr key={`user-${user.id || index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString('ar-JO') : 'لم يسجل دخول'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <ClockIcon className="w-3 h-3 ml-1" />
                        نشط
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
    </div>
  );
}
