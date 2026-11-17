import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StadiumsPage } from './pages/StadiumsPage';
import { FieldsPage } from './pages/FieldsPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { TeamsPage } from './pages/TeamsPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { ClosuresPage } from './pages/ClosuresPage';
import { PricingPage } from './pages/PricingPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-semibold">
        Chargement de l'espace administration...
      </div>
    );
  }

  if (!token || !user?.roles?.some((role) => role === 'ADMIN' || role === 'SUPER_ADMIN')) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="stadiums" element={<StadiumsPage />} />
            <Route path="fields" element={<FieldsPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="tournaments" element={<TournamentsPage />} />
            <Route path="closures" element={<ClosuresPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
