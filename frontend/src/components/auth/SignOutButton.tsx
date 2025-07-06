'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
}

export function SignOutButton({
  className,
  children,
  variant = 'ghost',
}: SignOutButtonProps) {
  const handleSignOut = async () => {
    try {
      await signOut({
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <Button onClick={handleSignOut} className={className} variant={variant}>
      <Icons.logOut className="mr-2 h-4 w-4" />
      {children || 'Sign out'}
    </Button>
  );
}
