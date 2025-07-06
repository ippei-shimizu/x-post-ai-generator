'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

interface SignInButtonProps {
  provider?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SignInButton({
  provider = 'google',
  className,
  children,
}: SignInButtonProps) {
  const handleSignIn = async () => {
    try {
      await signIn(provider, {
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <Button onClick={handleSignIn} className={className} variant="outline">
      {provider === 'google' && <Icons.google className="mr-2 h-4 w-4" />}
      {children || `Continue with ${provider}`}
    </Button>
  );
}
