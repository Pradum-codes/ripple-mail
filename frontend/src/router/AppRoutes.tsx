import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from '../components/RequireAuth';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import LoginPage from '../pages/LoginPage';
import MaintenancePage from '../pages/MaintenancePage';
import DashboardPage from '../pages/DashboardPage';
import ComposeEmailPage from '../pages/ComposeEmailPage';
import ScheduledEmailsPage from '../pages/ScheduledEmailsPage';
import SentEmailsPage from '../pages/SentEmailsPage';
import NotFoundPage from '../pages/NotFoundPage';
import { routePaths } from './routePaths';
import SenderSettingsPage from '@/features/senders/pages/SenderSettingsPage';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path={routePaths.login} element={<LoginPage />} />
        <Route path={routePaths.maintenance} element={<MaintenancePage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path={routePaths.dashboard} element={<DashboardPage />} />
          <Route path={routePaths.compose} element={<ComposeEmailPage />} />
          <Route path={routePaths.scheduled} element={<ScheduledEmailsPage />} />
          <Route path={routePaths.sent} element={<SentEmailsPage />} />
          <Route path={routePaths.senderSettings} element={<SenderSettingsPage />} />
        </Route>
      </Route>

      <Route path={routePaths.notFound} element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to={routePaths.notFound} replace />} />
    </Routes>
  );
}

export default AppRoutes;
