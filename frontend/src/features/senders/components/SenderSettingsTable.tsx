import { useMemo } from 'react';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Table, { type TableColumn } from '@/components/common/Table';
import { formatLocalDateTime } from '@/utils/formatDateTime';
import type { SenderDisplayRecord } from '../types';

export interface SenderSettingsTableProps {
  rows: ReadonlyArray<SenderDisplayRecord>;
  loading: boolean;
  refreshing: boolean;
  actionsDisabled: boolean;
  deletingSenderId: number | null;
  onEdit: (sender: SenderDisplayRecord) => void;
  onDelete: (sender: SenderDisplayRecord) => void;
}

function SenderSettingsTable({
  rows,
  loading,
  refreshing,
  actionsDisabled,
  deletingSenderId,
  onEdit,
  onDelete,
}: SenderSettingsTableProps) {
  const columns = useMemo<ReadonlyArray<TableColumn<SenderDisplayRecord>>>(
    () => [
      {
        header: 'Name',
        render: (row) => row.name ?? row.username ?? '—',
      },
      {
        header: 'Email',
        accessor: 'email',
      },
      {
        header: 'SMTP Host',
        render: (row) => row.smtpHost ?? '—',
      },
      {
        header: 'SMTP Port',
        render: (row) => (row.smtpPort ? String(row.smtpPort) : '—'),
      },
      {
        header: 'Created At',
        render: (row) => formatLocalDateTime(row.createdAt),
      },
      {
        header: 'Verification',
        render: (row) => (
          <Badge variant={row.verificationStatus === 'verified' ? 'success' : 'neutral'}>
            {row.verificationStatus === 'verified' ? 'Verified' : 'Unknown'}
          </Badge>
        ),
      },
      {
        header: 'Actions',
        render: (row) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(row)}
              disabled={actionsDisabled || deletingSenderId === row.id}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => onDelete(row)}
              disabled={actionsDisabled && deletingSenderId !== row.id}
              loading={deletingSenderId === row.id}
            >
              Delete
            </Button>
          </div>
        ),
        align: 'right',
        className: 'whitespace-nowrap',
        headerClassName: 'text-right',
      },
    ],
    [actionsDisabled, deletingSenderId, onDelete, onEdit],
  );

  return (
    <div className="space-y-3">
      {refreshing ? (
        <p className="text-sm text-slate-500">Refreshing sender accounts...</p>
      ) : null}
      <Table
        columns={columns}
        rows={rows}
        loading={loading}
        getRowKey={(row) => row.id}
        emptyState={{
          title: 'No sender accounts found.',
          description: 'Add your first sender account to start scheduling campaigns.',
        }}
      />
    </div>
  );
}

export default SenderSettingsTable;
