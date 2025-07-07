'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-modern hover:bg-primary-hover hover:shadow-modern-lg transform hover:scale-[1.02] active:scale-[0.98]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-modern hover:bg-destructive/90 hover:shadow-modern-lg',
        outline:
          'border border-input bg-background shadow-modern hover:bg-accent hover:text-accent-foreground hover:shadow-modern-lg',
        secondary:
          'bg-secondary text-secondary-foreground shadow-modern hover:bg-secondary/80 hover:shadow-modern-lg',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient:
          'bg-gradient-primary text-white shadow-modern hover:shadow-modern-lg transform hover:scale-[1.02] active:scale-[0.98] bg-size-200 animate-gradient-shift',
        'gradient-outline':
          'border-2 border-transparent bg-gradient-primary bg-clip-border text-transparent bg-clip-text hover:bg-clip-padding hover:text-white transition-all duration-300',
        success:
          'bg-success text-success-foreground shadow-modern hover:bg-success/90 hover:shadow-modern-lg',
        warning:
          'bg-warning text-warning-foreground shadow-modern hover:bg-warning/90 hover:shadow-modern-lg',
        glass:
          'bg-glass text-foreground backdrop-blur-sm border border-white/20 hover:bg-white/20 shadow-modern',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        xl: 'h-14 rounded-lg px-10 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8 text-xs',
        'icon-lg': 'h-12 w-12 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string; // ローディング状態のアクセシブルなテキスト
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      loadingText = 'Loading...',
      ...props
    },
    ref
  ) => {
    // ローディング時は無効化
    const isDisabled = disabled || loading;

    // アクセシビリティチェック: アイコンボタンのaria-label必須化
    React.useEffect(() => {
      if (
        size === 'icon' &&
        !children &&
        !props['aria-label'] &&
        !props['aria-labelledby']
      ) {
        console.warn(
          'Icon buttons require accessible text via aria-label, aria-labelledby, or children'
        );
      }
    }, [size, children, props]);

    // ローディング状態用の説明ID
    const loadingDescriptionId = React.useId();

    // asChildの場合はchildrenだけを返す
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          aria-busy={loading}
          aria-describedby={
            loading ? loadingDescriptionId : props['aria-describedby']
          }
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <>
        <button
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          disabled={isDisabled}
          aria-busy={loading}
          aria-describedby={
            loading ? loadingDescriptionId : props['aria-describedby']
          }
          {...props}
        >
          {loading && (
            <svg
              data-testid="button-spinner"
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
        </button>

        {/* ローディング状態の説明（スクリーンリーダー用） */}
        {loading && (
          <span
            id={loadingDescriptionId}
            className="sr-only"
            aria-live="polite"
          >
            {loadingText}
          </span>
        )}
      </>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
