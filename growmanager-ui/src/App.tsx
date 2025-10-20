import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { lazy, Suspense, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { ErrorBoundary } from '@/components/utility/ErrorBoundary';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { VerifiedRoute } from '@/components/routing/VerifiedRoute';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { AppLayout } from '@/components/layouts/AppLayout';
import { PWAProvider } from '@/components/pwa/PWAProvider';
import { LoadingSpinner } from '@/components/utility/LoadingSpinner';

// Lazy load auth pages for code splitting
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

// Lazy load app pages for code splitting
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const GrowsListPage = lazy(() => import('@/pages/GrowsListPage'));
const GrowDetailPage = lazy(() => import('@/pages/GrowDetailPage'));
const PlantDetailPage = lazy(() => import('@/pages/PlantDetailPage'));
const CultivarsListPage = lazy(() => import('@/pages/CultivarsListPage'));
const CultivarDetailPage = lazy(() => import('@/pages/CultivarDetailPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const HarvestDetailPage = lazy(() => import('@/pages/HarvestDetailPage'));
const AnalyticsLandingPage = lazy(() => import('@/pages/AnalyticsLandingPage'));
const EnvironmentalAnalyticsPage = lazy(() => import('@/pages/EnvironmentalAnalyticsPage'));
const FeedingAnalyticsPage = lazy(() => import('@/pages/FeedingAnalyticsPage'));
const YieldAnalyticsPage = lazy(() => import('@/pages/YieldAnalyticsPage'));
const CultivarComparisonPage = lazy(() => import('@/pages/CultivarComparisonPage'));
const GrowTimelinePage = lazy(() => import('@/pages/GrowTimelinePage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function App() {
  const setTheme = useUIStore((state) => state.setTheme);

  useEffect(() => {
    // Initialize theme on mount
    const savedTheme = useUIStore.getState().theme;
    setTheme(savedTheme);
  }, [setTheme]);

  return (
    <ErrorBoundary>
      <PWAProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
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
                <Route path="/grows/:growId/timeline" element={<GrowTimelinePage />} />
                {/* Redirect /plants list to /grows - plants are now displayed in grow tabs */}
                <Route path="/plants" element={<Navigate to="/grows" replace />} />
                <Route path="/plants/:id" element={<PlantDetailPage />} />
                <Route path="/cultivars" element={<CultivarsListPage />} />
                <Route path="/cultivars/:id" element={<CultivarDetailPage />} />
                <Route path="/harvests/:id" element={<HarvestDetailPage />} />
                <Route path="/analytics" element={<AnalyticsLandingPage />} />
                <Route path="/analytics/environmental" element={<EnvironmentalAnalyticsPage />} />
                <Route path="/analytics/feeding/:growId?" element={<FeedingAnalyticsPage />} />
                <Route path="/analytics/yield" element={<YieldAnalyticsPage />} />
                <Route path="/analytics/comparison" element={<CultivarComparisonPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          {/* Global Toast Notifications */}
          <Toaster />
        </BrowserRouter>
      </PWAProvider>
    </ErrorBoundary>
  );
}

export default App;