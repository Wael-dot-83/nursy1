
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const navigationByRole = {
  // ... existing code
  admin: [
    { label: 'لوحة التحكم', to: '/admin/dashboard' },
    { label: 'إدارة الحضانات', to: '/admin/nurseries' },
    { label: 'إدارة المستخدمين', to: '/admin/users' },
    { label: 'التقارير الشاملة', to: '/admin/reports' },
    { label: 'مركز الإشعارات', to: '/admin/notifications' },
    { label: 'سجلات النظام', to: '/admin/audit-logs' },
    { label: 'الإعدادات', to: '/admin/settings' },
  ],
  // ... existing code
};

function Header({ onMenuClick, user }) {
  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <button
              type="button"
              className="-ml-2 mr-2 flex items-center md:hidden"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex flex-shrink-0 items-center">
              {/* Logo can go here */}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700">
              {user?.name} ({user?.role})
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function SidebarNav({ navigation, userRole }) {
  return (
    <nav aria-label="Primary navigation" className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {navigation.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-indigo-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                      { 'bg-gray-50 text-indigo-600': isActive }
                    )
                  }
                  aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </li>
        <li className="mt-auto">
          <NavLink
            to="/profile"
            className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
          >
            حسابي
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}


export default function DashboardLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = user ? navigationByRole[user.role] : [];

  return (
    <div>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-indigo-600">
        Skip to main content
      </a>
      {/* Static sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:z-50 md:flex md:w-72 md:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">{/* Logo */}</div>
          <SidebarNav navigation={navigation} userRole={user?.role} />
        </div>
      </div>

      <div className="md:pl-72">
        <Header onMenuClick={() => setSidebarOpen(true)} user={user} />

        <main id="main-content" className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
