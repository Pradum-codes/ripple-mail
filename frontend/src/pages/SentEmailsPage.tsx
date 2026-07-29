import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import Button from '@/components/common/Button';
import SearchBar from '@/components/common/SearchBar';
import Table, { type TableColumn } from '@/components/common/Table';
import Badge from '@/components/common/Badge';
import { routePaths } from '@/router/routePaths';
import useSentEmails from '@/hooks/useSentEmails';
import type { EmailJobWithSubject } from '@/hooks/useEmailJobs';
import { formatLocalDateTime } from '@/utils/formatDateTime';
import { getEmailStatusBadgeVariant } from '@/utils/emailStatus';

const columns: ReadonlyArray<TableColumn<EmailJobWithSubject>> = [
  { header: 'Recipient Email', accessor: 'recipient' },
  { header: 'Subject', accessor: 'subject' },
  {
    header: 'Sent Time',
    render: (row) => formatLocalDateTime(row.sentAt ?? row.createdAt),
  },
  {
    header: 'Status',
    render: (row) => (
      <Badge variant={getEmailStatusBadgeVariant(row.status)}>{row.status}</Badge>
    ),
  },
];

function SentEmailsPage() {
  const navigate = useNavigate();
  const { emails, loading, error, refresh } = useSentEmails();
  const [searchValue, setSearchValue] = useState('');

  const emptyState = useMemo(
    () => ({
      title: 'No sent emails',
      description: 'Completed email deliveries will appear here.',
      action: {
        label: 'Compose Email',
        onClick: () => navigate(routePaths.compose),
      },
    }),
    [navigate],
  );

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sent Emails</h1>
        <p className="text-sm text-slate-500">
          Review completed deliveries and recent outbound activity.
        </p>
      </section>

      <SearchBar
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Search sent emails"
      />

      {error ? (
        <section
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700"
        >
          <p className="font-medium">Unable to load sent emails.</p>
          <p className="mt-1 text-sm">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void refresh();
            }}
            leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
            className="mt-4 border-red-200 text-red-700 hover:bg-red-100 focus-visible:ring-red-500"
          >
            Retry
          </Button>
        </section>
      ) : (
        <Table
          columns={columns}
          rows={emails}
          loading={loading}
          getRowKey={(row) => row.id}
          emptyState={emptyState}
        />
      )}
    </div>
  );
}

export default SentEmailsPage;
