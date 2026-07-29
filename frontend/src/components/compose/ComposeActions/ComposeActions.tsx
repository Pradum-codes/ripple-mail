import Button from '@/components/common/Button';

export interface ComposeActionsProps {
  onCancel: () => void;
  scheduleDisabled?: boolean;
}

function ComposeActions({ onCancel, scheduleDisabled = true }: ComposeActionsProps) {
  return (
    <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-end">
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" variant="primary" disabled={scheduleDisabled}>
        Schedule Campaign
      </Button>
    </div>
  );
}

export default ComposeActions;
