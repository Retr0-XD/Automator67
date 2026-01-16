import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  mode: 'local' | 'cloud';
}

/**
 * ProtectedRoute component ensures dashboard routes are only accessible
 * in the appropriate mode (local or cloud).
 *
 * - In LOCAL mode: All routes are accessible without authentication
 * - In CLOUD mode: Routes require GitHub authentication
 */
export function ProtectedRoute({ children, mode }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();
  
  const modeFromStorage = localStorage.getItem('automator67_mode') as 'local' | 'cloud' | null;

  // If mode doesn't match, redirect to mode selector (which will be handled by App)
  if (modeFromStorage !== mode) {
    return <Navigate to="/" replace />;
  }

  // In cloud mode, require authentication
  if (mode === 'cloud' && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
