import { Bold, ChevronDown, Highlighter, Italic, Link2, List, Redo2, Quote, Strikethrough, Text, Underline, Undo2 } from 'lucide-react';
import type { ChangeEvent, ReactNode } from 'react';

export interface BodySectionProps {
  body: string;
  onBodyChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

function BodySection({ body, onBodyChange, error, disabled = false }: BodySectionProps) {
  return (
    <section className="space-y-3">
      <div className="text-sm font-medium text-slate-700">Email Body</div>
      <div className="rounded-[18px] bg-slate-50 px-4 py-4">
        <label className="mb-4 block text-sm text-slate-400" htmlFor="compose-email-body">
          Type Your Reply...
        </label>
        <div className="rounded-full bg-white px-3 py-2 shadow-[0_0_0_1px_rgba(226,232,240,1)]">
          <div className="flex flex-wrap items-center gap-2 text-slate-400">
            <ToolbarIcon icon={<Undo2 className="size-4" aria-hidden="true" />} />
            <ToolbarIcon icon={<Redo2 className="size-4" aria-hidden="true" />} />
            <Separator />
            <ToolbarIcon icon={<Text className="size-4" aria-hidden="true" />} />
            <ToolbarIcon icon={<ChevronDown className="size-4" aria-hidden="true" />} />
            <Separator />
            <ToolbarIcon icon={<Bold className="size-4" aria-hidden="true" />} />
            <ToolbarIcon icon={<Italic className="size-4" aria-hidden="true" />} />
            <ToolbarIcon icon={<Underline className="size-4" aria-hidden="true" />} />
            <Separator />
            <ToolbarIcon icon={<List className="size-4" aria-hidden="true" />} />
            <ToolbarIcon icon={<Quote className="size-4" aria-hidden="true" />} />
            <ToolbarIcon icon={<Link2 className="size-4" aria-hidden="true" />} />
            <ToolbarIcon icon={<Highlighter className="size-4" aria-hidden="true" />} />
            <ToolbarIcon icon={<Strikethrough className="size-4" aria-hidden="true" />} />
          </div>
        </div>
        <textarea
          id="compose-email-body"
          value={body}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onBodyChange(event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          className="mt-4 min-h-[320px] w-full resize-none rounded-[18px] border-0 bg-white p-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}

export default BodySection;

function ToolbarIcon({ icon }: { icon: ReactNode }) {
  return <span className="inline-flex h-6 w-6 items-center justify-center">{icon}</span>;
}

function Separator() {
  return <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />;
}
