import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type {
  CardProps,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
} from '@/types/ui';

const cardVariants = cva('rounded-lg transition-colors', {
  variants: {
    variant: {
      default: 'border bg-card text-card-foreground shadow-sm',
      outline: 'border-2 border-border bg-background',
      ghost: 'border-transparent shadow-none bg-transparent',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      default: 'p-6',
      lg: 'p-8',
    },
    interactive: {
      true: 'cursor-pointer hover:bg-accent',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'default',
    interactive: false,
  },
});

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      interactive = false,
      onClick,
      onKeyDown,
      children,
      ...props
    },
    ref
  ) => {
    // Handle keyboard events for interactive cards
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e as React.MouseEvent<HTMLDivElement>);
        }
        onKeyDown?.(e);
      },
      [interactive, onClick, onKeyDown]
    );

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, interactive, className })
        )}
        onClick={interactive ? onClick : undefined}
        onKeyDown={interactive ? handleKeyDown : onKeyDown}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => {
    const hasAction = !!action;

    return (
      <div
        ref={ref}
        className={cn(
          'p-6',
          hasAction
            ? 'flex items-center justify-between'
            : 'flex flex-col space-y-1.5',
          className
        )}
        {...props}
      >
        {/* Content section (title, description, and children) */}
        <div className={cn(hasAction ? 'flex flex-col space-y-1.5' : '')}>
          {title && (
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {children}
        </div>

        {/* Action element */}
        {action && <div className="flex items-center">{action}</div>}
      </div>
    );
  }
);
CardHeader.displayName = 'CardHeader';

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const cardFooterVariants = cva('flex items-center p-6 pt-0', {
  variants: {
    align: {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between',
    },
  },
  defaultVariants: {
    align: 'left',
  },
});

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, align, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ align, className }))}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter, cardVariants };
