/**
 * ProtectedRoute - 認証ルートガードコンポーネント
 * 認証が必要なページへのアクセスを制御する
 */

'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '../../hooks/useAuth';
import type {
  ProtectedRouteProps,
  RouteProtectionState,
  RouteProtectionError,
} from '../../types/route';

// デフォルトローディングコンポーネント
function DefaultLoadingComponent(): JSX.Element {
  return (
    <div
      data-testid="loading-state"
      className="flex min-h-screen items-center justify-center"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">認証状況を確認中...</span>
    </div>
  );
}

// デフォルトエラーコンポーネント
function DefaultErrorComponent({
  error,
}: {
  error: RouteProtectionError;
}): JSX.Element {
  return (
    <div
      data-testid="error-state"
      className="flex min-h-screen flex-col items-center justify-center"
    >
      <div className="mb-2 text-lg font-semibold text-red-600">
        認証エラーが発生しました
      </div>
      <div className="mb-4 text-gray-600">{error.message}</div>
      {error.retryable && (
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          再試行
        </button>
      )}
    </div>
  );
}

// ProtectedRouteコンポーネント
export function ProtectedRoute({
  children,
  redirectTo = '/auth/signin',
  loadingComponent,
  errorComponent,
  requireAuth = true,
  allowGuestAccess = false,
  validateSession = true,
}: ProtectedRouteProps): JSX.Element {
  const router = useRouter();

  // useRequireAuthを使用して認証状態を管理
  const auth = useRequireAuth();

  // ルート保護の状態を計算
  const protectionState = useMemo<RouteProtectionState>(() => {
    // 認証が不要な場合は常にアクセス許可
    if (!requireAuth || allowGuestAccess) {
      return {
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        isInitialized: auth.isInitialized,
        hasValidSession: auth.hasValidSession(),
        isSessionExpiring: auth.isSessionExpiring,
        hasError: !!auth.error,
        errorCode: auth.error?.code,
        errorMessage: auth.error?.message,
        isAccessAllowed: true,
        redirectRequired: false,
      };
    }

    // 認証状態の詳細チェック
    const hasValidSession = validateSession
      ? auth.hasValidSession()
      : auth.isAuthenticated;
    const isAccessAllowed =
      auth.isInitialized && hasValidSession && !auth.error;
    const redirectRequired =
      auth.isInitialized && !auth.isLoading && !isAccessAllowed;

    return {
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      isInitialized: auth.isInitialized,
      hasValidSession,
      isSessionExpiring: auth.isSessionExpiring,
      hasError: !!auth.error,
      errorCode: auth.error?.code,
      errorMessage: auth.error?.message,
      isAccessAllowed,
      redirectRequired,
      redirectTarget: redirectRequired ? redirectTo : undefined,
    };
  }, [auth, requireAuth, allowGuestAccess, validateSession, redirectTo]);

  // リダイレクト処理
  useEffect(() => {
    if (protectionState.redirectRequired && protectionState.redirectTarget) {
      router.push(protectionState.redirectTarget);
    }
  }, [
    protectionState.redirectRequired,
    protectionState.redirectTarget,
    router,
  ]);

  // ローディング状態
  if (!protectionState.isInitialized || protectionState.isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return <DefaultLoadingComponent />;
  }

  // エラー状態
  if (protectionState.hasError && auth.error) {
    const routeError: RouteProtectionError = {
      code: auth.error.code || 'UNKNOWN_ERROR',
      message: auth.error.message || '認証エラーが発生しました',
      redirectTarget: redirectTo,
      retryable: true,
    };

    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    return <DefaultErrorComponent error={routeError} />;
  }

  // リダイレクト処理中は何も表示しない
  if (protectionState.redirectRequired) {
    return <div data-testid="redirecting-state">リダイレクト中...</div>;
  }

  // アクセスが許可されている場合は子要素を表示
  if (protectionState.isAccessAllowed) {
    return <>{children}</>;
  }

  // その他の場合（通常は発生しない）は何も表示しない
  return <div data-testid="access-denied-state">アクセスが拒否されました</div>;
}

// デフォルトエクスポート
export default ProtectedRoute;

// 型定義の再エクスポート（便利性のため）
export type {
  ProtectedRouteProps,
  RouteProtectionState,
} from '../../types/route';
