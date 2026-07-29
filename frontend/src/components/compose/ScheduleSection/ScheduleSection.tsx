import Input from '@/components/common/Input';
import ComposeFieldRow from '../ComposeFieldRow';

export interface ScheduleSectionProps {
  startTime: string;
  onStartTimeChange: (value: string) => void;
  delaySeconds: string;
  onDelaySecondsChange: (value: string) => void;
  hourlyLimit: string;
  onHourlyLimitChange: (value: string) => void;
}

function ScheduleSection({
  startTime,
  onStartTimeChange,
  delaySeconds,
  onDelaySecondsChange,
  hourlyLimit,
  onHourlyLimitChange,
}: ScheduleSectionProps) {
  return (
    <ComposeFieldRow label="Scheduling" className="md:items-start">
      <div className="space-y-4">
        <Input
          label="Start Time"
          type="datetime-local"
          value={startTime}
          onChange={(event) => onStartTimeChange(event.target.value)}
          required
          labelClassName="sr-only"
          wrapperClassName="space-y-0"
          className="h-10 rounded-none border-0 border-b border-slate-200 px-0 shadow-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-0"
        />
        <div className="flex flex-wrap items-end gap-6">
          <Input
            label="Delay Between Emails (seconds)"
            type="number"
            min={0}
            value={delaySeconds}
            onChange={(event) => onDelaySecondsChange(event.target.value)}
            required
            labelClassName="whitespace-nowrap text-sm font-medium text-slate-700"
            wrapperClassName="space-y-0 flex items-center gap-3"
            className="h-10 w-16 rounded-xl border-slate-200 bg-white text-center shadow-none focus:border-emerald-500 focus:ring-emerald-500/10"
          />
          <Input
            label="Hourly Limit"
            type="number"
            min={1}
            value={hourlyLimit}
            onChange={(event) => onHourlyLimitChange(event.target.value)}
            required
            labelClassName="whitespace-nowrap text-sm font-medium text-slate-700"
            wrapperClassName="space-y-0 flex items-center gap-3"
            className="h-10 w-16 rounded-xl border-slate-200 bg-white text-center shadow-none focus:border-emerald-500 focus:ring-emerald-500/10"
          />
        </div>
      </div>
    </ComposeFieldRow>
  );
}

export default ScheduleSection;
