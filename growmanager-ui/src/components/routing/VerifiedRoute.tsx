import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface VerifiedRouteProps {
  children: React.ReactNode;
}

/**
 * VerifiedRoute component ensures user's email is verified before accessing the app.
 * Redirects to /verify-email if user is authenticated but email is not verified.
 */
export function VerifiedRoute({ children }: VerifiedRouteProps) {
  const { user } = useAuthStore();
  const location = useLocation();

  if (user && !user.emailVerified) {
    // Redirect to verification page if email not verified
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}