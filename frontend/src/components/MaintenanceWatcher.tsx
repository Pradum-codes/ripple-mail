import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setServiceUnavailableHandler } from '@/api';
import { routePaths } from '@/router/routePaths';

function MaintenanceWatcher() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setServiceUnavailableHandler(() => {
      if (location.pathname !== routePaths.maintenance) {
        navigate(routePaths.maintenance, {
          replace: true,
          state: {
            from: location.pathname,
          },
        });
      }
    });

    return () => {
      setServiceUnavailableHandler(null);
    };
  }, [location.pathname, navigate]);

  return null;
}

export default MaintenanceWatcher;
