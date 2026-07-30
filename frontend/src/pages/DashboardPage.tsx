import { useNavigate } from 'react-router-dom';
import { CalendarClock, MailCheck, SendHorizontal } from 'lucide-react';
import { routePaths } from '@/router/routePaths';
import QuickActions from '@/components/dashboard/QuickActions';

function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Use the shortcuts below to compose campaigns and review delivery queues.
        </p>
      </section>

      <QuickActions
        actions={[
          {
            label: 'Compose Email',
            onClick: () => navigate(routePaths.compose),
            icon: <SendHorizontal className="size-4" aria-hidden="true" />,
            variant: 'primary',
          },
          {
            label: 'View Scheduled',
            onClick: () => navigate(routePaths.scheduled),
            icon: <CalendarClock className="size-4" aria-hidden="true" />,
            variant: 'secondary',
          },
          {
            label: 'View Sent',
            onClick: () => navigate(routePaths.sent),
            icon: <MailCheck className="size-4" aria-hidden="true" />,
            variant: 'outline',
          },
        ]}
      />
    </div>
  );
}

export default DashboardPage;
