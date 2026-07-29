import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  icon?: ReactNode;
  className?: string;
}

function StatCard({ title, value, subtitle, trend, icon, className }: StatCardProps) {
  return (
    <article className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        {icon ? <div className="rounded-xl bg-slate-100 p-2 text-slate-600">{icon}</div> : null}
      </div>
      {(subtitle || trend) ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {subtitle ? <p className="text-slate-500">{subtitle}</p> : null}
          {trend ? (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
              {trend}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default StatCard;
