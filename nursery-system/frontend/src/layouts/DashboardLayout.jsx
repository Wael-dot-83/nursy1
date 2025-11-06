import { Fragment, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  Cog6ToothIcon,
  PowerIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';

const navigationByRole = {
  admin: [
    { label: 'لوحة التحكم', to: '/admin/dashboard' },
    { label: 'إدارة الحضانات', to: '/admin/nurseries' },
    { label: 'إدارة المستخدمين', to: '/admin/users' },
    { label: 'التقارير الشاملة', to: '/admin/reports' },
    { label: 'مركز الإشعارات', to: '/admin/notifications' },
    { label: 'سجلات النظام', to: '/admin/audit-logs' },
    { label: 'الإعدادات', to: '/admin/settings' },
  ],
  manager: [
    { label: 'لوحة التحكم', to: '/manager/dashboard' },
    { label: 'التقارير', to: '/manager/reports' },
    { label: 'إدارة الأطفال', to: '/manager/children' },
    { label: 'المشرفون', to: '/manager/supervisors' },
    { label: 'إعدادات', to: '/settings' },
  ],
  supervisor: [
    { label: 'لوحة التحكم', to: '/supervisor/dashboard' },
    { label: 'إنشاء تقرير', to: '/supervisor/reports/create' },
    { label: 'تقاريري', to: '/supervisor/reports' },
    { label: 'إعدادات', to: '/settings' },
  ],
  parent: [
    { label: 'لوحة التحكم', to: '/parent/dashboard' },
    { label: 'أطفالي', to: '/parent/children' },
    { label: 'تقارير الأطفال', to: '/parent/reports' },
    { label: 'الإشعارات', to: '/parent/notifications' },
    { label: 'إعدادات', to: '/settings' },
  ],
};

function NavigationContent({ navigation, onLinkClick }) {
  return (
    <nav className="space-y-2 p-4" aria-label="التنقل الرئيسي">
      {navigation.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onLinkClick}
          className={({ isActive }) =>
            clsx(
              'block rounded-xl px-4 py-3 text-sm font-medium transition',
              isActive
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-primary-50 hover:text-primary-600'
            )
          }
          aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const {
    user,
    role,
    actions: { logout },
  } = useAuth();

  const navigation = navigationByRole[role] ?? [];

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        تخطي إلى المحتوى الرئيسي
      </a>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">إغلاق القائمة</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                  <div className="flex flex-shrink-0 items-center px-4">
                    <p className="text-lg font-semibold text-primary-700">نظام إدارة الحضانات</p>
                  </div>
                  <NavigationContent navigation={navigation} onLinkClick={() => setSidebarOpen(false)} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="w-14 flex-shrink-0" aria-hidden="true" />
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-l border-slate-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
               <p className="text-lg font-semibold text-primary-700">نظام إدارة الحضانات</p>
            </div>
            <NavigationContent navigation={navigation} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:pr-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600 shadow-sm lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="فتح القائمة الجانبية"
                aria-expanded={sidebarOpen}
              >
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
              <div>
                <p className="text-xs text-slate-500">مرحبا بك، {user?.full_name || 'مستخدم'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/parent/notifications')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-primary-100 hover:text-primary-700"
                aria-label="الإشعارات"
              >
                <BellIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="flex items-center gap-3 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-sm text-white">
                    {(user?.full_name || user?.email || 'م')[0]?.toUpperCase()}
                  </span>
                  <span className="hidden text-right md:flex md:flex-col">
                    <span>{user?.full_name || 'مستخدم'}</span>
                    <span className="text-xs text-slate-400">{role}</span>
                  </span>
                </Menu.Button>
                <Menu.Items className="absolute left-0 z-50 mt-2 w-48 origin-top-left overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg focus:outline-none">
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() => navigate('/profile')}
                          className={clsx(
                            'flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600',
                            active && 'bg-primary-50 text-primary-700'
                          )}
                        >
                          <Cog6ToothIcon className="h-4 w-4" aria-hidden="true" />
                          الملف الشخصي
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            navigate('/login', { replace: true });
                          }}
                          className={clsx(
                            'flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600',
                            active && 'bg-red-50 text-red-600'
                          )}
                        >
                          <PowerIcon className="h-4 w-4" aria-hidden="true" />
                          تسجيل الخروج
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Menu>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1" role="main">
          <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            <div className="min-h-[80vh] space-y-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}