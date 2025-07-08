'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-electric disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-primary text-primary-foreground shadow-ultra hover-levitate rounded-2xl border border-white/10',
        destructive:
          'bg-destructive text-destructive-foreground shadow-electric hover-electric rounded-2xl',
        outline:
          'glass-ultra border border-white/20 text-foreground hover-glow rounded-2xl',
        secondary:
          'bg-gradient-dark text-secondary-foreground shadow-deep hover-levitate rounded-2xl border border-white/5',
        ghost: 'hover:glass-neon hover:text-accent-foreground rounded-2xl',
        link: 'text-gradient-primary underline-offset-4 hover:underline hover:text-glow',
        gradient:
          'bg-gradient-neon text-white shadow-neon hover-levitate animate-gradient-flow rounded-2xl border border-white/20',
        'gradient-outline':
          'glass-ultra border-2 border-white/30 text-gradient-electric hover-glow rounded-2xl',
        neon: 'bg-gradient-glow text-primary-foreground shadow-electric animate-pulse-electric rounded-2xl border border-white/20',
        electric:
          'bg-gradient-accent text-primary-foreground shadow-neon hover-electric animate-shimmer rounded-2xl',
        ultra:
          'bg-gradient-neon text-white shadow-neon hover-levitate animate-float-glow rounded-3xl border border-white/30',
        success:
          'bg-success text-success-foreground shadow-electric hover-electric rounded-2xl',
        warning:
          'bg-warning text-warning-foreground shadow-electric hover-electric rounded-2xl',
        glass:
          'glass-ultra text-foreground hover-glow rounded-2xl border border-white/10',
      },
      size: {
        default: 'h-12 px-6 py-3 text-sm',
        sm: 'h-9 px-4 py-2 text-xs rounded-xl',
        lg: 'h-14 px-10 py-4 text-base rounded-2xl',
        xl: 'h-16 px-12 py-5 text-lg rounded-3xl',
        icon: 'h-12 w-12 rounded-2xl',
        'icon-sm': 'h-9 w-9 text-xs rounded-xl',
        'icon-lg': 'h-14 w-14 text-base rounded-2xl',
        'icon-xl': 'h-16 w-16 text-lg rounded-3xl',
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
