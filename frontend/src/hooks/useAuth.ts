'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '../providers/AuthProvider';
import { UseAuthReturn } from '../types/auth';

// 強化されたuseAuthフック
export function useAuth(requireAuth = false): UseAuthReturn {
  const authContext = useAuthContext();
  const router = useRouter();

  // 認証が必要なページでのリダイレクト処理
  useEffect(() => {
    if (
      requireAuth &&
      authContext.isInitialized &&
      !authContext.isLoading &&
      !authContext.isAuthenticated
    ) {
      router.push('/auth/signin');
    }
  }, [
    requireAuth,
    authContext.isInitialized,
    authContext.isLoading,
    authContext.isAuthenticated,
    router,
  ]);

  // 便利な計算プロパティ
  const userId = useMemo(() => authContext.user?.id, [authContext.user?.id]);
  const userEmail = useMemo(
    () => authContext.user?.email,
    [authContext.user?.email]
  );
  const userName = useMemo(
    () => authContext.user?.name,
    [authContext.user?.name]
  );
  const userImage = useMemo(
    () => authContext.user?.image,
    [authContext.user?.image]
  );

  // 状態チェック関数
  const isGuest = useCallback(
    () => !authContext.isAuthenticated,
    [authContext.isAuthenticated]
  );

  const hasValidSession = useCallback(() => {
    return (
      authContext.isAuthenticated &&
      authContext.session !== null &&
      authContext.error === null &&
      !authContext.checkSessionExpiry()
    );
  }, [authContext]);

  const needsReauth = useCallback(() => {
    return (
      authContext.isSessionExpiring ||
      authContext.error?.code === 'SESSION_EXPIRED' ||
      authContext.error?.code === 'INVALID_SESSION'
    );
  }, [authContext.isSessionExpiring, authContext.error]);

  // 統合された返り値
  return useMemo<UseAuthReturn>(
    () => ({
      // AuthContextからの継承
      ...authContext,

      // 計算プロパティ
      userId,
      userEmail,
      userName,
      userImage,

      // 状態チェック関数
      isGuest,
      hasValidSession,
      needsReauth,
    }),
    [
      authContext,
      userId,
      userEmail,
      userName,
      userImage,
      isGuest,
      hasValidSession,
      needsReauth,
    ]
  );
}

// 認証が必須のページ用のフック
export function useRequireAuth(): UseAuthReturn {
  return useAuth(true);
}

// ゲストユーザー専用のフック（認証が不要な場合）
export function useGuestAuth(): UseAuthReturn {
  const auth = useAuth(false);

  // ゲストアクセス専用のバリデーション
  if (auth.isAuthenticated && auth.hasValidSession()) {
    // 既に認証済みの場合は何もしない（リダイレクトしない）
  }

  return auth;
}

// セッション期限警告用のフック
export function useSessionWarning(warningCallback?: () => void) {
  const { isSessionExpiring, getTimeUntilExpiry, refreshSession } = useAuth();

  useEffect(() => {
    if (isSessionExpiring && warningCallback) {
      warningCallback();
    }
  }, [isSessionExpiring, warningCallback]);

  return {
    isSessionExpiring,
    timeUntilExpiry: getTimeUntilExpiry(),
    refreshSession,
  };
}

// エラー処理専用のフック
export function useAuthError(onError?: (error: unknown) => void) {
  const { error, clearError } = useAuth();

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  return {
    error,
    hasError: !!error,
    clearError,
  };
}

// 後方互換性のためのレガシーinterface（非推奨）
/** @deprecated Use UseAuthReturn from types/auth.ts instead */
export interface LegacyUseAuthReturn {
  user:
    | {
        id?: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      }
    | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | undefined;
  signOut: () => void;
}
