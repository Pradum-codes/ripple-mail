import { ArrowLeft, Clock3, Paperclip } from 'lucide-react';
import { cn } from '@/utils/cn';
import Button from '@/components/common/Button';

export interface ComposeHeaderProps {
  onBack: () => void;
  onAttachmentClick?: () => void;
  onScheduleClick?: () => void;
  onSendLaterClick?: () => void;
  className?: string;
}

function ComposeHeader({
  onBack,
  onAttachmentClick,
  onScheduleClick,
  onSendLaterClick,
  className,
}: ComposeHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-center justify-between gap-4', className)}>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          aria-label="Go back"
          className="h-10 w-10 rounded-full p-0 text-slate-900 hover:bg-slate-100"
          leftIcon={<ArrowLeft className="size-5" aria-hidden="true" />}
        >
          <span className="sr-only">Back</span>
        </Button>
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400">Homepage</p>
          <h1 className="text-2xl font-medium tracking-tight text-slate-900 md:text-[28px]">
            Compose New Email
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onAttachmentClick}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-emerald-600 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          aria-label="Attachments"
        >
          <Paperclip className="size-5" aria-hidden="true" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-100 px-1 text-[10px] font-semibold text-slate-500">
            1
          </span>
        </button>

        <button
          type="button"
          onClick={onScheduleClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-emerald-600 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          aria-label="Schedule"
        >
          <Clock3 className="size-5" aria-hidden="true" />
        </button>

        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onSendLaterClick}
          className="h-10 rounded-full border-emerald-500 px-4 text-sm font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:ring-emerald-500"
        >
          Send Later
        </Button>
      </div>
    </header>
  );
}

export default ComposeHeader;
