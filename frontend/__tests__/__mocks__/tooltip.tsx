import * as React from 'react';

export const TooltipProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <>{children}</>;
};

export const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  return asChild ? (
    children
  ) : (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});

TooltipTrigger.displayName = 'TooltipTrigger';

export const TooltipContent = ({ children }: { children: React.ReactNode }) => {
  return <div role="tooltip">{children}</div>;
};
