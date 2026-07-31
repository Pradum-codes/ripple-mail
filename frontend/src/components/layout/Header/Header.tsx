import { Menu } from 'lucide-react';
import { cn } from '@/utils/cn';
import Button from '@/components/common/Button';

export interface HeaderProps {
  title: string;
  logoText?: string;
  userName?: string;
  userSubtitle?: string;
  onMenuClick?: () => void;
  className?: string;
}

function Header({
  title,
  logoText = 'R',
  userName = 'John Doe',
  userSubtitle = 'Placeholder user profile',
  onMenuClick,
  className,
}: HeaderProps) {
  const menuButton = onMenuClick ? (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onMenuClick}
      className="lg:hidden"
      aria-label="Open navigation menu"
      leftIcon={<Menu className="size-4" aria-hidden="true" />}
    >
      Menu
    </Button>
  ) : null;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm md:px-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {menuButton}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
            <img src='/favicon.svg'/>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
              Ripple Mail
            </p>
            <h1 className="text-base font-semibold text-slate-900 md:text-lg">{title}</h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          JD
        </div>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
          <p className="truncate text-xs text-slate-500">{userSubtitle}</p>
        </div>
      </div>
    </header>
  );
}

export default Header;
