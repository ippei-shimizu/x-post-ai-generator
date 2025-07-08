import * as React from 'react';

export const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { style?: React.CSSProperties }
>(({ children, className, style, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={className}
      style={style}
      data-radix-scroll-area-viewport="true"
      {...props}
    >
      {children}
    </div>
  );
});

ScrollArea.displayName = 'ScrollArea';
