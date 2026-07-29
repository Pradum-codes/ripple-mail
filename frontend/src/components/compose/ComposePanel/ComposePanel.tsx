import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface ComposePanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

function ComposePanel({ title, description, children, footer, className }: ComposePanelProps) {
  return (
    <section className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>
      <header className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </header>
      <div className="px-6 py-5">{children}</div>
      {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
    </section>
  );
}

export default ComposePanel;
