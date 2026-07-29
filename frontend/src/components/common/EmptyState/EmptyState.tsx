import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import Button, { type ButtonVariant } from '../Button';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: EmptyStateAction;
  className?: string;
}

function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center', className)}>
      {icon ? <div className="mb-4 text-slate-400">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action ? (
        <Button
          type="button"
          variant={action.variant ?? 'primary'}
          leftIcon={action.icon}
          onClick={action.onClick}
          className="mt-6"
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
