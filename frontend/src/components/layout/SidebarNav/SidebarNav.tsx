import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface SidebarNavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  current?: boolean;
}

export interface SidebarNavProps {
  title?: string;
  items: ReadonlyArray<SidebarNavItem>;
  footer?: ReactNode;
  className?: string;
}

function SidebarNav({ title = 'Navigation', items, footer, className }: SidebarNavProps) {
  return (
    <aside className={cn('flex h-full w-full flex-col border-r border-slate-200 bg-white', className)}>
      <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      </div>
      <nav aria-label={title} className="flex-1 px-3">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={item.current ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
                  item.current
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {footer ? <div className="border-t border-slate-200 p-4">{footer}</div> : null}
    </aside>
  );
}

export default SidebarNav;
