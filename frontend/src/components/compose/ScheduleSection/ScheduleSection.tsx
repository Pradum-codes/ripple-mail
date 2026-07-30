import Input from '@/components/common/Input';
import ComposeFieldRow from '../ComposeFieldRow';

export interface ScheduleSectionProps {
  startTime: string;
  onStartTimeChange: (value: string) => void;
  delaySeconds: string;
  onDelaySecondsChange: (value: string) => void;
  hourlyLimit: string;
  onHourlyLimitChange: (value: string) => void;
  errors?: {
    startTime?: string;
    delaySeconds?: string;
    hourlyLimit?: string;
  };
  disabled?: boolean;
}

function ScheduleSection({
  startTime,
  onStartTimeChange,
  delaySeconds,
  onDelaySecondsChange,
  hourlyLimit,
  onHourlyLimitChange,
  errors,
  disabled = false,
}: ScheduleSectionProps) {
  const [dateValue = '', timeValue = ''] = startTime.split('T');

  function updateStartTime(nextDateValue: string, nextTimeValue: string) {
    if (!nextDateValue && !nextTimeValue) {
      onStartTimeChange('');
      return;
    }

    if (!nextDateValue) {
      onStartTimeChange('');
      return;
    }

    onStartTimeChange(`${nextDateValue}T${nextTimeValue || '00:00'}`);
  }

  return (
    <ComposeFieldRow label="Scheduling" className="md:items-start">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <Input
            label="Start Date"
            type="date"
            value={dateValue}
            onChange={(event) => updateStartTime(event.target.value, timeValue)}
            required
            wrapperClassName="space-y-0"
            className="h-10 min-w-[220px] rounded-none border-0 border-b border-slate-200 px-0 shadow-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-0"
            error={errors?.startTime}
            disabled={disabled}
          />
          <Input
            label="Start Time"
            type="time"
            value={timeValue}
            onChange={(event) => updateStartTime(dateValue, event.target.value)}
            required
            wrapperClassName="space-y-0"
            className="h-10 w-[160px] rounded-none border-0 border-b border-slate-200 px-0 shadow-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-0"
            disabled={disabled || !dateValue}
            helperText={!dateValue ? 'Select a date first.' : undefined}
          />
        </div>
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
            error={errors?.delaySeconds}
            disabled={disabled}
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
            error={errors?.hourlyLimit}
            disabled={disabled}
          />
        </div>
      </div>
    </ComposeFieldRow>
  );
}

export default ScheduleSection;
