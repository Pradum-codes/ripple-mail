import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

function MetricCard({ title, value, description, icon, className }: MetricCardProps) {
  return (
    <article className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        {icon ? <div className="rounded-xl bg-slate-100 p-2 text-slate-600">{icon}</div> : null}
      </div>
      {description ? <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p> : null}
    </article>
  );
}

export default MetricCard;
