import { useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import Select from '@/components/common/Select';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import ComposeFieldRow from '../ComposeFieldRow';
import useSenders from '@/hooks/useSenders';
import { formatSenderLabel } from '@/utils/formatSenderLabel';

export interface SenderSectionProps {
  senderId: string;
  onSenderIdChange: (senderId: string) => void;
}

function SenderSection({ senderId, onSenderIdChange }: SenderSectionProps) {
  const { senders, loading, error, refresh } = useSenders();

  const options = useMemo(
    () =>
      senders.map((sender) => ({
        value: String(sender.id),
        label: formatSenderLabel(sender),
      })),
    [senders],
  );

  useEffect(() => {
    if (!senderId && options.length > 0) {
      onSenderIdChange(options[0].value);
    }
  }, [onSenderIdChange, options, senderId]);

  return (
    <ComposeFieldRow label="From">
      {loading ? (
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
          <Spinner size="sm" />
          Loading senders...
        </div>
      ) : error || options.length === 0 ? (
        <EmptyState
          title="No senders available"
          description={error ?? 'Add a sender configuration before scheduling a campaign.'}
          action={{
            label: 'Refresh senders',
            onClick: () => {
              void refresh();
            },
            variant: 'secondary',
            icon: <RefreshCw className="size-4" aria-hidden="true" />,
          }}
        />
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
        />
      )}
    </ComposeFieldRow>
  );
}

export default SenderSection;
