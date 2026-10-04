import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'sonner';
import { DoctorVerificationPage } from './features/verification/DoctorVerificationPage';
import { OrgVerificationPage } from './features/verification/OrgVerificationPage';
import { ProfileModerationPage } from './features/moderation/ProfileModerationPage';
import { ReviewModerationPage } from './features/moderation/ReviewModerationPage';
import { UsersPage } from './features/users/UsersPage';
import { UserDetailPage } from './features/users/UserDetailPage';
import { OrganizationsPage } from './features/organizations/OrganizationsPage';
import { OrgDetailPage } from './features/organizations/OrgDetailPage';
import { ProfessionsPage } from './features/professions/ProfessionsPage';
import { AdminManagementPage } from './features/admin-management/AdminManagementPage';
import { ConsultationsPage } from './features/consultations/ConsultationsPage';
import { StatisticsPage } from './features/statistics/StatisticsPage';
import { BillingPage } from './features/billing/BillingPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ReportsPage } from './features/moderation/ReportsPage';
import { NotFoundPage } from './features/error/NotFoundPage';
import { AdminLayout } from './layouts/AdminLayout';
import './i18n';

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Role-based Route wrapper
const RequireRole = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user } = useAuth(); // Assuming useAuth exposes the logged-in admin as `user`
  if (!user || !user.role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#e74c3c' }}>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }
  return <>{children}</>;
};

// Placeholder components for pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="card"><h2>{title}</h2><p>Coming soon in next phases.</p></div>
);

const router = createBrowserRouter([
  { 
    path: '/login', 
    element: <LoginPage />,
    errorElement: <NotFoundPage />
  },
  {
    path: '/',
    element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'verification/doctors', element: <DoctorVerificationPage /> },
      { path: 'verification/organizations', element: <OrgVerificationPage /> },
      { path: 'moderation/profiles', element: <ProfileModerationPage /> },
      { path: 'moderation/reviews', element: <ReviewModerationPage /> },
      { path: 'moderation/reports', element: <ReportsPage /> },
      { path: 'consultations', element: <ConsultationsPage /> },
      { path: 'billing', element: <BillingPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'users/:id', element: <UserDetailPage /> },
      { path: 'organizations', element: <OrganizationsPage /> },
      { path: 'organizations/:id', element: <OrgDetailPage /> },
      { path: 'professions', element: <ProfessionsPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'admins', element: <RequireRole allowedRoles={['super_admin']}><AdminManagementPage /></RequireRole> }, // super_admin only
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Toaster richColors position="top-right" />
          <RouterProvider router={router} />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
