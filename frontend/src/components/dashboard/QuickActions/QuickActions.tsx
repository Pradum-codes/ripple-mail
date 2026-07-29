import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import Button from '@/components/common/Button';

export interface QuickActionItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
}

export interface QuickActionsProps {
  title?: string;
  actions: ReadonlyArray<QuickActionItem>;
  className?: string;
}

function QuickActions({ title = 'Quick Actions', actions, className }: QuickActionsProps) {
  return (
    <section className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant={action.variant ?? 'secondary'}
            leftIcon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  );
}

export default QuickActions;
