import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import { routePaths } from '../router/routePaths';

function RequireAuth() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={routePaths.login} replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
