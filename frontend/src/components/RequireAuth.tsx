import { Navigate, Outlet } from 'react-router-dom';
import useMockAuth from '../auth/useMockAuth';

function RequireAuth() {
  const { isAuthenticated } = useMockAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
