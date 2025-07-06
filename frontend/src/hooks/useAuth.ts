'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export interface UseAuthReturn {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | undefined;
  signOut: () => void;
}

export function useAuth(requireAuth = false): UseAuthReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';
  const isAuthenticated = !!session;

  useEffect(() => {
    if (requireAuth && !isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [requireAuth, isLoading, isAuthenticated, router]);

  return {
    user: session?.user,
    isLoading,
    isAuthenticated,
    userId: session?.user?.id,
    signOut: () => router.push('/auth/signout'),
  };
}

export function useRequireAuth(): UseAuthReturn {
  return useAuth(true);
}
