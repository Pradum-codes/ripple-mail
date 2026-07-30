import Input from '@/components/common/Input';
import ComposeFieldRow from '../ComposeFieldRow';

export interface SubjectSectionProps {
  subject: string;
  onSubjectChange: (subject: string) => void;
  error?: string;
  disabled?: boolean;
}

function SubjectSection({ subject, onSubjectChange, error, disabled = false }: SubjectSectionProps) {
  return (
    <ComposeFieldRow label="Subject" className="md:items-start">
      <div className="space-y-2">
        <Input
          label="Email subject"
          labelClassName="sr-only"
          wrapperClassName="space-y-0"
          placeholder="Subject"
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          className="h-10 rounded-none border-0 border-b border-slate-200 px-0 shadow-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-0"
          required
          disabled={disabled}
          error={error}
        />
        <p className="text-xs text-slate-400">{subject.length} characters</p>
      </div>
    </ComposeFieldRow>
  );
}

export default SubjectSection;
