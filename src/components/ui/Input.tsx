import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-stone-800 dark:text-stone-200 font-baloo">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-xl px-3.5 py-2.5 text-sm transition-colors',
            'bg-white dark:bg-stone-900',
            'border-2 border-stone-200 dark:border-stone-800',
            'text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600',
            'focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        />
        {helperText && !error && (
          <p className="text-xs text-stone-500 dark:text-stone-400">{helperText}</p>
        )}
        {error && (
          <p className="text-xs font-medium text-rose-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
