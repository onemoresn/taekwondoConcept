import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getDashboardPath } from '../context/AuthProvider';

export function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading__spinner" aria-hidden="true" />
        <p>Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(profile.role)) {
    return <Navigate to={getDashboardPath(profile.role)} replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated, profile, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from;

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading__spinner" aria-hidden="true" />
        <p>Loading…</p>
      </div>
    );
  }

  if (isAuthenticated && profile?.role) {
    const dest = from && from.startsWith(`/${profile.role}`) ? from : getDashboardPath(profile.role);
    return <Navigate to={dest} replace />;
  }

  return children;
}
