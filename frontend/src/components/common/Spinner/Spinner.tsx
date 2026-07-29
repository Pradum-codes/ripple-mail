import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  label?: string;
}

const spinnerSizeClasses: Record<SpinnerSize, string> = {
  sm: 'size-4 border-2',
  md: 'size-5 border-2',
  lg: 'size-6 border-2',
};

function Spinner({ size = 'md', label = 'Loading', className, ...rest }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-current border-r-transparent align-[-0.125em] text-current',
        spinnerSizeClasses[size],
        className,
      )}
      {...rest}
    />
  );
}

export default Spinner;
