import { useNavigate } from 'react-router-dom';
import { CalendarClock, MailCheck, MailOpen, SendHorizontal } from 'lucide-react';
import { routePaths } from '@/router/routePaths';
import StatCard from '@/components/dashboard/StatCard';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentCampaignsTable, { type RecentCampaignRow } from '@/components/dashboard/RecentCampaignsTable';

const statCards = [
  {
    title: 'Scheduled Emails',
    value: '124',
    subtitle: 'Waiting in the queue',
    trend: '+12% this week',
    icon: <CalendarClock className="size-5" aria-hidden="true" />,
  },
  {
    title: 'Sent Emails',
    value: '91',
    subtitle: 'Delivered successfully',
    trend: '+8% this week',
    icon: <MailCheck className="size-5" aria-hidden="true" />,
  },
  {
    title: 'Success Rate',
    value: '98%',
    subtitle: 'Delivery health',
    trend: '+2% vs last week',
    icon: <MailOpen className="size-5" aria-hidden="true" />,
  },
] as const;

const recentCampaignRows: ReadonlyArray<RecentCampaignRow> = [
  {
    id: 1,
    recipient: 'alice@example.com',
    subject: 'Welcome to ReachInbox',
    scheduledTime: 'Today, 09:30 AM',
    status: 'Sent',
  },
  {
    id: 2,
    recipient: 'bob@example.com',
    subject: 'Follow-up campaign',
    scheduledTime: 'Today, 11:00 AM',
    status: 'Scheduled',
  },
  {
    id: 3,
    recipient: 'charlie@example.com',
    subject: 'Re-engagement series',
    scheduledTime: 'Tomorrow, 08:15 AM',
    status: 'Failed',
  },
];

function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">A quick overview of the email workflow and recent activity.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
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

      <RecentCampaignsTable
        rows={recentCampaignRows}
        onComposeEmail={() => navigate(routePaths.compose)}
      />
    </div>
  );
}

export default DashboardPage;
