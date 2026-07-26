import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  prefix?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, prefix, suffix, className = '', id, ...props }, ref) => {
    const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-evm-text-primary mb-1.5"
        >
          {label}
        </label>

        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-evm-text-muted text-sm select-none pointer-events-none">
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`
              w-full px-3 py-2 border rounded-lg text-sm
              transition-all duration-150
              bg-evm-card text-evm-text-primary
              placeholder:text-evm-text-muted
              focus:outline-none focus:ring-2 focus:ring-evm-primary/20
              ${error
                ? 'border-evm-danger focus:border-evm-danger focus:ring-evm-danger/20'
                : 'border-evm-border focus:border-evm-primary'
              }
              ${prefix ? 'pl-8' : ''}
              ${suffix ? 'pr-8' : ''}
              ${className}
            `}
            {...props}
          />

          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-evm-text-muted text-sm select-none pointer-events-none">
              {suffix}
            </span>
          )}
        </div>

        {error && (
          <p id={errorId} className="text-sm text-evm-danger mt-1" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="text-sm text-evm-text-muted mt-1">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
