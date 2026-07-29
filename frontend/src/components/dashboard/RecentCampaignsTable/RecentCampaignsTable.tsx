import Table, { type TableColumn } from '@/components/common/Table';
import Badge from '@/components/common/Badge';

export interface RecentCampaignRow {
  id: number;
  recipient: string;
  subject: string;
  scheduledTime: string;
  status: 'Scheduled' | 'Sent' | 'Failed';
}

export interface RecentCampaignsTableProps {
  rows: ReadonlyArray<RecentCampaignRow>;
  onComposeEmail: () => void;
}

const columns: ReadonlyArray<TableColumn<RecentCampaignRow>> = [
  { header: 'Recipient', accessor: 'recipient' },
  { header: 'Subject', accessor: 'subject' },
  { header: 'Scheduled Time', accessor: 'scheduledTime' },
  {
    header: 'Status',
    render: (row) => (
      <Badge
        variant={
          row.status === 'Sent'
            ? 'success'
            : row.status === 'Scheduled'
              ? 'info'
              : 'error'
        }
      >
        {row.status}
      </Badge>
    ),
  },
];

function RecentCampaignsTable({ rows, onComposeEmail }: RecentCampaignsTableProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent Campaigns</h2>
          <p className="mt-1 text-sm text-slate-500">A placeholder view of recent campaign activity.</p>
        </div>
      </div>
      <div className="mt-5">
        <Table
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          emptyState={{
            title: 'No recent campaigns',
            description: 'Campaign activity will show up here once data is available.',
            action: {
              label: 'Compose Email',
              onClick: onComposeEmail,
            },
          }}
        />
      </div>
    </section>
  );
}

export default RecentCampaignsTable;
