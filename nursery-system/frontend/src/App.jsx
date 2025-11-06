import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/auth/Login';
import ManagerLoginPage from './pages/auth/ManagerLogin';
import SupervisorLoginPage from './pages/auth/SupervisorLogin';
import ParentLoginPage from './pages/auth/ParentLogin';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import ForgotPasswordPage from './pages/auth/ForgotPassword';
import ResetPasswordPage from './pages/auth/ResetPassword';
import NotFoundPage from './pages/misc/NotFound';
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const NurseryManagement = lazy(() => import('./pages/admin/NurseryManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const NotificationCenter = lazy(() => import('./pages/admin/NotificationCenter'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard'));
const ManagerReports = lazy(() => import('./pages/manager/ManagerReports'));
const ManagerChildren = lazy(() => import('./pages/manager/ManagerChildren'));
const ManagerSupervisors = lazy(() => import('./pages/manager/ManagerSupervisors'));
const SupervisorDashboard = lazy(() => import('./pages/supervisor/SupervisorDashboard'));
const SupervisorReports = lazy(() => import('./pages/supervisor/SupervisorReports'));
const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard'));
const ParentChildren = lazy(() => import('./pages/parent/ParentChildren'));
const ParentReports = lazy(() => import('./pages/parent/ParentReports'));
const ParentNotifications = lazy(() => import('./pages/parent/ParentNotifications'));

function RoleLanding() {
  const { role } = useAuth();
  switch (role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'manager':
      return <Navigate to="/manager/dashboard" replace />;
    case 'supervisor':
      return <Navigate to="/supervisor/dashboard" replace />;
    case 'parent':
      return <Navigate to="/parent/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function SuspenseBoundary({ children }) {
  return (
    <Suspense
      fallback={(
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      )}
    >
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/manager-login" element={<ManagerLoginPage />} />
      <Route path="/supervisor-login" element={<SupervisorLoginPage />} />
      <Route path="/parent-login" element={<ParentLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleLanding />} />
        <Route element={<DashboardLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<DashboardLayout />}>
        <Route
          path="/admin/dashboard"
          element={(
            <SuspenseBoundary>
              <AdminDashboard />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/admin/nurseries"
          element={(
            <SuspenseBoundary>
              <NurseryManagement />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/admin/users"
          element={(
            <SuspenseBoundary>
              <UserManagement />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/admin/reports"
          element={(
            <SuspenseBoundary>
              <Reports />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/admin/notifications"
          element={(
            <SuspenseBoundary>
              <NotificationCenter />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/admin/audit-logs"
          element={(
            <SuspenseBoundary>
              <AuditLogs />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/admin/settings"
          element={(
            <SuspenseBoundary>
              <Settings />
            </SuspenseBoundary>
          )}
        />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['manager']} />}>
        <Route element={<DashboardLayout />}>
        <Route
          path="/manager/dashboard"
          element={(
            <SuspenseBoundary>
              <ManagerDashboard />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/manager/reports"
          element={(
            <SuspenseBoundary>
              <ManagerReports />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/manager/children"
          element={(
            <SuspenseBoundary>
              <ManagerChildren />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/manager/supervisors"
          element={(
            <SuspenseBoundary>
              <ManagerSupervisors />
            </SuspenseBoundary>
          )}
        />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['supervisor']} />}>
        <Route element={<DashboardLayout />}>
        <Route
          path="/supervisor/dashboard"
          element={(
            <SuspenseBoundary>
              <SupervisorDashboard />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/supervisor/reports"
          element={(
            <SuspenseBoundary>
              <SupervisorReports mode="list" />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/supervisor/reports/create"
          element={(
            <SuspenseBoundary>
              <SupervisorReports mode="create" />
            </SuspenseBoundary>
          )}
        />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['parent']} />}>
        <Route element={<DashboardLayout />}>
        <Route
          path="/parent/dashboard"
          element={(
            <SuspenseBoundary>
              <ParentDashboard />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/parent/children"
          element={(
            <SuspenseBoundary>
              <ParentChildren />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/parent/reports"
          element={(
            <SuspenseBoundary>
              <ParentReports />
            </SuspenseBoundary>
          )}
        />
        <Route
          path="/parent/notifications"
          element={(
            <SuspenseBoundary>
              <ParentNotifications />
            </SuspenseBoundary>
          )}
        />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
