import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import ComposeFieldRow from '../ComposeFieldRow';
import useSenders from '@/hooks/useSenders';
import { formatSenderLabel } from '@/utils/formatSenderLabel';

export interface SenderSectionProps {
  senderId: string;
  onSenderIdChange: (senderId: string) => void;
  disabled?: boolean;
  error?: string;
}

function SenderSection({ senderId, onSenderIdChange, disabled = false, error: validationError }: SenderSectionProps) {
  const { senders, loading, error: senderLoadError, refresh } = useSenders();
  const options = useMemo(
    () =>
      senders.map((sender) => ({
        value: String(sender.id),
        label: formatSenderLabel(sender),
      })),
    [senders],
  );

  return (
    <ComposeFieldRow label="From">
      {loading ? (
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
          <Spinner size="sm" />
          Loading senders...
        </div>
      ) : senderLoadError ? (
        <EmptyState
          title="Unable to load senders"
          description={senderLoadError}
          action={{
            label: 'Retry',
            onClick: () => {
              void refresh();
            },
            variant: 'secondary',
            icon: <RefreshCw className="size-4" aria-hidden="true" />,
          }}
        />
      ) : options.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
          <p className="text-sm font-medium text-slate-900">No sender accounts available.</p>
          <div className="mt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => undefined}
              disabled={disabled}
            >
              Add Sender
            </Button>
          </div>
        </div>
      ) : (
        <Select
          label="Sender account"
          labelClassName="sr-only"
          wrapperClassName="space-y-0"
          selectClassName="h-10 w-[220px] rounded-xl border-slate-200 bg-slate-50 px-4 text-[15px] shadow-none focus:border-emerald-500 focus:ring-emerald-500/10"
          placeholder="Select a sender"
          value={senderId}
          onChange={(event) => onSenderIdChange(event.target.value)}
          options={options}
          required
          disabled={disabled}
          error={validationError}
        />
      )}
    </ComposeFieldRow>
  );
}

export default SenderSection;
