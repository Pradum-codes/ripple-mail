import { LogOut } from 'lucide-react';
import { useAuth } from '@/auth';
import { cn } from '@/utils/cn';
import { useState } from 'react';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function SidebarUserMenu({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  const [imageError, setImageError] = useState(false);

  if (!user) {
    return null;
  }

  const initials = getInitials(user.name);

  return (
    <div className={cn('border-t border-slate-200 p-3', className)}>
      <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-100">
        {user.avatar && !imageError ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="size-9 shrink-0 rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {initials}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {user.name}
          </p>
          <p className="truncate text-xs text-slate-500">
            {user.email}
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          title="Logout"
          aria-label={`Logout ${user.name}`}
          className="group relative inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <LogOut className="size-4" aria-hidden="true" />

          <span className="pointer-events-none absolute bottom-full right-0 mb-1.5 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}

export default SidebarUserMenu;