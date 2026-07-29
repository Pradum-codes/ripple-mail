import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface AppHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

function AppHeader({ title, description, actions, className }: AppHeaderProps) {
  return (
    <header className={cn('flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4', className)}>
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export default AppHeader;
