import { Bold, ChevronDown, Highlighter, Italic, Link2, List, Redo2, Quote, Strikethrough, Text, Underline, Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';

function BodySection() {
  return (
    <section className="space-y-3">
      <div className="text-sm font-medium text-slate-700">Email Body</div>
      <div className="rounded-[18px] bg-slate-50 px-4 py-4">
        <div className="mb-4 text-sm text-slate-400">Type Your Reply...</div>
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
        <div className="mt-4 min-h-[320px] rounded-[18px] bg-white" />
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
