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
      semanticRole,
      headingLevel,
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
          // Create a synthetic mouse event for onClick
          const syntheticMouseEvent = {
            type: 'click',
            target: e.target,
            currentTarget: e.currentTarget,
            bubbles: e.bubbles,
            cancelable: e.cancelable,
            defaultPrevented: e.defaultPrevented,
            eventPhase: e.eventPhase,
            isTrusted: e.isTrusted,
            preventDefault: e.preventDefault,
            stopPropagation: e.stopPropagation,
            timeStamp: e.timeStamp,
            button: 0,
            buttons: 1,
            clientX: 0,
            clientY: 0,
            pageX: 0,
            pageY: 0,
            screenX: 0,
            screenY: 0,
            movementX: 0,
            movementY: 0,
            offsetX: 0,
            offsetY: 0,
            x: 0,
            y: 0,
            getModifierState: () => false,
            relatedTarget: null,
            nativeEvent: new MouseEvent('click'),
          } as unknown as React.MouseEvent<HTMLDivElement>;
          onClick(syntheticMouseEvent);
        }
        onKeyDown?.(e);
      },
      [interactive, onClick, onKeyDown]
    );

    // Determine semantic role
    const cardRole = React.useMemo(() => {
      if (semanticRole === 'none') return undefined;
      if (semanticRole) return semanticRole;
      if (interactive && onClick) return 'button';
      return undefined;
    }, [semanticRole, interactive, onClick]);

    // Pass headingLevel to children (specifically CardHeader)
    const enhancedChildren = React.useMemo(() => {
      if (!headingLevel) return children;

      return React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === CardHeader) {
          return React.cloneElement(child as React.ReactElement<CardHeaderProps>, {
            headingLevel: (child.props as CardHeaderProps).headingLevel || headingLevel,
          });
        }
        return child;
      });
    }, [children, headingLevel]);

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, interactive, className })
        )}
        role={cardRole}
        onClick={interactive ? onClick : undefined}
        onKeyDown={interactive ? handleKeyDown : onKeyDown}
        tabIndex={interactive ? 0 : undefined}
        aria-pressed={interactive && onClick ? undefined : undefined}
        {...props}
      >
        {enhancedChildren}
      </div>
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  (
    {
      className,
      title,
      description,
      action,
      headingLevel = 3,
      children,
      ...props
    },
    ref
  ) => {
    const hasAction = !!action;

    // Dynamic heading component based on level
    const HeadingComponent = `h${headingLevel}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

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
            <HeadingComponent className="text-2xl font-semibold leading-none tracking-tight">
              {title}
            </HeadingComponent>
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
