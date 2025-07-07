import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { InputProps } from '@/types/ui';

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        default: 'h-10 px-3 py-2',
        sm: 'h-9 px-3 py-1',
        lg: 'h-11 px-4 py-3',
      },
      error: {
        true: 'border-destructive ring-destructive focus-visible:ring-destructive',
        false: '',
      },
    },
    defaultVariants: {
      size: 'default',
      error: false,
    },
  }
);

/**
 * XSS対策のためのサニタイゼーション関数
 */
const sanitizeInput = (value: string): string => {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/&/g, '&amp;');
};

/**
 * プレースホルダーのエスケープ処理
 */
const escapePlaceholder = (placeholder?: string): string | undefined => {
  if (!placeholder) return placeholder;
  return placeholder
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      size,
      error = false,
      helperText,
      leftElement,
      rightElement,
      sanitize = true,
      placeholder,
      onChange,
      debounce,
      label,
      description,
      required,
      maxLength,
      minLength,
      ...props
    },
    ref
  ) => {
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Generate unique IDs for accessibility
    const inputId = React.useId();
    const helperTextId = helperText ? `${inputId}-helper-text` : undefined;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const constraintsId =
      maxLength || minLength ? `${inputId}-constraints` : undefined;

    // Build aria-describedby from multiple sources
    const ariaDescribedBy =
      [helperTextId, descriptionId, constraintsId, props['aria-describedby']]
        .filter(Boolean)
        .join(' ') || undefined;

    // Handle input change with sanitization and debouncing
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;

        // Apply sanitization if enabled
        if (sanitize) {
          value = sanitizeInput(value);
          // Update the actual input value
          e.target.value = value;
        }

        if (debounce && onChange) {
          // Clear existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // Set new timeout
          timeoutRef.current = setTimeout(() => {
            onChange(e);
          }, debounce);
        } else if (onChange) {
          onChange(e);
        }
      },
      [sanitize, debounce, onChange]
    );

    // Calculate input styles with padding adjustments for elements
    const inputClassName = cn(inputVariants({ size, error, className }), {
      'pl-10': leftElement,
      'pr-10': rightElement,
    });

    // Render the input component
    const inputElement = (
      <input
        id={inputId}
        type={type}
        className={inputClassName}
        ref={ref}
        placeholder={escapePlaceholder(placeholder)}
        aria-invalid={error}
        aria-required={required}
        aria-describedby={ariaDescribedBy}
        maxLength={maxLength}
        minLength={minLength}
        onChange={handleChange}
        {...props}
      />
    );

    // Return component with all accessibility features
    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {label}
            {required && (
              <span className="ml-1 text-destructive" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Description */}
        {description && (
          <p id={descriptionId} className="mb-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {/* Input container with elements */}
        <div className="relative">
          {leftElement && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftElement}
            </div>
          )}

          {inputElement}

          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightElement}
            </div>
          )}
        </div>

        {/* Constraints information */}
        {(maxLength || minLength) && (
          <div id={constraintsId} className="sr-only">
            {minLength && `Minimum ${minLength} characters. `}
            {maxLength && `Maximum ${maxLength} characters.`}
          </div>
        )}

        {/* Helper text / Error message */}
        {helperText && (
          <p
            id={helperTextId}
            className={cn(
              'mt-2 text-sm',
              error ? 'text-destructive' : 'text-muted-foreground'
            )}
            role={error ? 'alert' : undefined}
            aria-live={error ? 'assertive' : undefined}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
