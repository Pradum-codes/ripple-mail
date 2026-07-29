import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  wrapperClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      disabled,
      startIcon,
      endIcon,
      wrapperClassName,
      inputClassName,
      labelClassName,
      id,
      className,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedById = error || helperText ? `${inputId}-description` : undefined;

    return (
      <div className={cn('space-y-1.5', wrapperClassName)}>
        <label
          htmlFor={inputId}
          className={cn('text-sm font-medium text-slate-700', labelClassName)}
        >
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
        <div className="relative">
          {startIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              {startIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedById}
            className={cn(
              'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
              startIcon && 'pl-10',
              endIcon && 'pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
              className,
              inputClassName,
            )}
            {...rest}
          />
          {endIcon ? (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
              {endIcon}
            </span>
          ) : null}
        </div>
        {error || helperText ? (
          <p
            id={describedById}
            className={cn('text-xs', error ? 'text-red-600' : 'text-slate-500')}
          >
            {error ?? helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
