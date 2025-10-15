import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { ErrorBoundary } from '@/components/utility/ErrorBoundary';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { VerifiedRoute } from '@/components/routing/VerifiedRoute';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { AppLayout } from '@/components/layouts/AppLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

// App Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { GrowsListPage } from '@/pages/GrowsListPage';
import { GrowDetailPage } from '@/pages/GrowDetailPage';
import { PlantsListPage } from '@/pages/PlantsListPage';
import { PlantDetailPage } from '@/pages/PlantDetailPage';
import { CultivarsListPage } from '@/pages/CultivarsListPage';
import { CultivarDetailPage } from '@/pages/CultivarDetailPage';
import { LogActivityPage } from '@/pages/LogActivityPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { HarvestDetailPage } from '@/pages/HarvestDetailPage';
import { NotFound } from '@/pages/NotFound';

function App() {
  const setTheme = useUIStore((state) => state.setTheme);

  useEffect(() => {
    // Initialize theme on mount
    const savedTheme = useUIStore.getState().theme;
    setTheme(savedTheme);
  }, [setTheme]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Root - redirect to dashboard or login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public Auth Routes - wrapped in AuthLayout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Verify Email - standalone, not in AuthLayout */}
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected App Routes - require authentication and email verification */}
          <Route
            element={
              <ProtectedRoute>
                <VerifiedRoute>
                  <AppLayout />
                </VerifiedRoute>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/grows" element={<GrowsListPage />} />
            <Route path="/grows/:id" element={<GrowDetailPage />} />
            {/* Redirect /plants list to /grows - plants are now displayed in grow tabs */}
            <Route path="/plants" element={<Navigate to="/grows" replace />} />
            <Route path="/plants/:id" element={<PlantDetailPage />} />
            <Route path="/cultivars" element={<CultivarsListPage />} />
            <Route path="/cultivars/:id" element={<CultivarDetailPage />} />
            <Route path="/harvests/:id" element={<HarvestDetailPage />} />
            <Route path="/log" element={<LogActivityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Global Toast Notifications */}
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;