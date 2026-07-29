import { Upload } from 'lucide-react';
import Button from '@/components/common/Button';
import ComposeFieldRow from '../ComposeFieldRow';

function RecipientsSection() {
  const recipients = ['tame@jmail.com', 'lame@jmail.com', 'dame@jmail.com'];

  return (
    <ComposeFieldRow label="To">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {recipients.map((recipient) => (
          <span
            key={recipient}
            className="inline-flex h-8 items-center rounded-full border border-emerald-500 bg-emerald-50 px-3 text-sm text-slate-700"
          >
            {recipient}
          </span>
        ))}
        <span className="inline-flex h-8 items-center rounded-full border border-emerald-500 bg-emerald-50 px-3 text-sm text-slate-700">
          +4
        </span>
        <div className="ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<Upload className="size-4" aria-hidden="true" />}
            className="h-8 rounded-md px-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
          >
            Upload List
          </Button>
        </div>
      </div>
    </ComposeFieldRow>
  );
}

export default RecipientsSection;
