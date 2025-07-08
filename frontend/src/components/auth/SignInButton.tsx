'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

interface SignInButtonProps {
  provider?: string;
  className?: string;
  children?: React.ReactNode;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'gradient'
    | 'gradient-outline'
    | 'neon'
    | 'electric'
    | 'ultra'
    | 'success'
    | 'warning'
    | 'glass';
  size?:
    | 'default'
    | 'sm'
    | 'lg'
    | 'xl'
    | 'icon'
    | 'icon-sm'
    | 'icon-lg'
    | 'icon-xl';
}

export function SignInButton({
  provider = 'google',
  className,
  children,
  variant = 'outline',
  size = 'default',
}: SignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    console.log('SignInButton clicked, provider:', provider);
    setIsLoading(true);

    try {
      const result = await signIn(provider, {
        callbackUrl: '/',
        redirect: true,
      });
      console.log('SignIn result:', result);
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      className={className}
      variant={variant}
      size={size}
      disabled={isLoading}
      loading={isLoading}
    >
      {provider === 'google' && !isLoading && (
        <Icons.google
          className={`mr-2 h-4 w-4 ${variant === 'gradient' ? 'text-white' : ''}`}
        />
      )}
      {children || `Continue with ${provider}`}
    </Button>
  );
}
