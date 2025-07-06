'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export interface UseAuthGuardOptions {
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
}

export function useAuthGuard({
  redirectTo = '/auth/signin',
  redirectIfAuthenticated = false,
}: UseAuthGuardOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';
  const isAuthenticated = !!session;

  useEffect(() => {
    if (isLoading) return;

    if (redirectIfAuthenticated && isAuthenticated) {
      router.push('/');
      return;
    }

    if (!redirectIfAuthenticated && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }
  }, [isLoading, isAuthenticated, redirectTo, redirectIfAuthenticated, router]);

  return {
    isLoading,
    isAuthenticated,
    user: session?.user,
  };
}
