import { forwardRef, useId } from 'react';
import type { ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  placeholder?: string;
  options: ReadonlyArray<SelectOption>;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
  selectClassName?: string;
  labelClassName?: string;
  startIcon?: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      placeholder,
      options,
      error,
      helperText,
      required,
      disabled,
      wrapperClassName,
      selectClassName,
      labelClassName,
      startIcon,
      id,
      className,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const describedById = error || helperText ? `${selectId}-description` : undefined;

    return (
      <div className={cn('space-y-1.5', wrapperClassName)}>
        <label
          htmlFor={selectId}
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
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedById}
            className={cn(
              'flex h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
              startIcon && 'pl-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
              className,
              selectClassName,
            )}
            {...rest}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
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

Select.displayName = 'Select';

export default Select;
