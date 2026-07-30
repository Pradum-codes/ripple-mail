import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarClock, LayoutDashboard, PencilLine, Send, Settings2, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import Button from '@/components/common/Button';

export interface SidebarItem {
  label: string;
  href: string;
  icon: ReactNode;
}

export interface SidebarProps {
  items: ReadonlyArray<SidebarItem>;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  className?: string;
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function Sidebar({ items, isMobileOpen, onCloseMobile, className }: SidebarProps) {
  const [mobileMounted, setMobileMounted] = useState(isMobileOpen);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const desktopItems = useMemo(
    () =>
      items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          onClick={onCloseMobile}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
              isActive
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )
          }
        >
          <span className="shrink-0">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      )),
    [items, onCloseMobile],
  );

  useEffect(() => {
    if (isMobileOpen) {
      setMobileMounted(true);
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      window.setTimeout(() => closeButtonRef.current?.focus(), 0);
      return;
    }

    const timeout = window.setTimeout(() => {
      setMobileMounted(false);
      previousActiveElementRef.current?.focus?.();
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseMobile();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen, onCloseMobile]);

  const handleMobileKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = mobilePanelRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
    const focusableList = Array.from(focusableElements ?? []);

    if (focusableList.length === 0) {
      event.preventDefault();
      closeButtonRef.current?.focus();
      return;
    }

    const firstElement = focusableList[0];
    const lastElement = focusableList[focusableList.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const mobileDrawer = mobileMounted ? (
    <div className="fixed inset-0 z-50 lg:hidden" aria-hidden={!isMobileOpen}>
      <button
        type="button"
        aria-label="Close navigation overlay"
        className={cn(
          'absolute inset-0 bg-slate-950/50 transition-opacity duration-200',
          isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
      />
      <div
        ref={mobilePanelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Primary navigation"
        tabIndex={-1}
        onKeyDown={handleMobileKeyDown}
        className={cn(
          'relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-200 ease-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Navigation</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">ReachInbox</p>
          </div>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            leftIcon={<X className="size-4" aria-hidden="true" />}
          >
            Close
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
          <div className="space-y-1">{desktopItems}</div>
        </nav>
      </div>
    </div>
  ) : null;

  return (
    <>
      <aside
        className={cn(
          'hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex',
          className,
        )}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
            R
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
              ReachInbox
            </p>
            <p className="text-base font-semibold text-slate-900">Navigation</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
          <div className="space-y-1">{desktopItems}</div>
        </nav>
      </aside>

      {mobileDrawer}
    </>
  );
}

export default Sidebar;

export const defaultSidebarItems: ReadonlyArray<SidebarItem> = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="size-4" aria-hidden="true" />,
  },
  {
    label: 'Compose',
    href: '/compose',
    icon: <PencilLine className="size-4" aria-hidden="true" />,
  },
  {
    label: 'Scheduled',
    href: '/scheduled',
    icon: <CalendarClock className="size-4" aria-hidden="true" />,
  },
  {
    label: 'Sent',
    href: '/sent',
    icon: <Send className="size-4" aria-hidden="true" />,
  },
  {
    label: 'Sender Settings',
    href: '/settings/senders',
    icon: <Settings2 className="size-4" aria-hidden="true" />,
  },
];
