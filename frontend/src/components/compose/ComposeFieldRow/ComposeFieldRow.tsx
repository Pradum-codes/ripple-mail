import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface ComposeFieldRowProps {
  label: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  contentClassName?: string;
}

function ComposeFieldRow({
  label,
  children,
  className,
  labelClassName,
  contentClassName,
}: ComposeFieldRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 md:grid-cols-[120px_minmax(0,1fr)] md:items-center',
        className,
      )}
    >
      <div className={cn('text-sm font-medium text-slate-700', labelClassName)}>{label}</div>
      <div className={cn('min-w-0', contentClassName)}>{children}</div>
    </div>
  );
}

export default ComposeFieldRow;
