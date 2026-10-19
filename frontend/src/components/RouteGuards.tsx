import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function FullPageSpinner() {
  return (
    <div className="center-screen">
      <div className="spinner" role="status" aria-label="Loading" />
    </div>
  );
}

// Only signed-in users may enter. Everyone else is sent to /signin and returned afterwards.
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

// Only users with the admin role may enter (must be nested inside ProtectedRoute).
export function AdminRoute() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/signin" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Sign in / sign up pages: signed-in users are redirected away.
export function GuestRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }
  return <Outlet />;
}
