/**
 * ルート関連の型定義
 * ProtectedRoute用の型定義とNext.js App Router統合
 */

import { type ReactNode } from 'react';

// ProtectedRouteコンポーネントのProps型
export interface ProtectedRouteProps {
  children: ReactNode;

  // リダイレクト設定
  redirectTo?: string; // デフォルト: '/auth/signin'

  // カスタムコンポーネント
  loadingComponent?: ReactNode; // ローディング表示のカスタムコンポーネント
  errorComponent?: ReactNode; // エラー表示のカスタムコンポーネント

  // 認証要件
  requireAuth?: boolean; // デフォルト: true

  // セキュリティ設定
  allowGuestAccess?: boolean; // デフォルト: false
  validateSession?: boolean; // デフォルト: true
}

// ルート保護の設定型
export interface RouteProtectionConfig {
  // 認証要件
  requireAuth: boolean;
  allowGuestAccess: boolean;

  // リダイレクト設定
  loginRedirect: string;
  unauthorizedRedirect: string;

  // セッション検証
  validateSession: boolean;
  validatePermissions: boolean;

  // UI設定
  showLoadingSpinner: boolean;
  showErrorBoundary: boolean;
}

// ルート保護の状態型
export interface RouteProtectionState {
  // 認証状態
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // セッション状態
  hasValidSession: boolean;
  isSessionExpiring: boolean;

  // エラー状態
  hasError: boolean;
  errorCode?: string;
  errorMessage?: string;

  // アクセス許可
  isAccessAllowed: boolean;
  redirectRequired: boolean;
  redirectTarget?: string;
}

// Next.js App Router対応の型
export interface AppRouterPageProps {
  params?: Record<string, string>;
  searchParams?: Record<string, string | string[]>;
}

// 保護されたページの型
export interface ProtectedPageProps extends AppRouterPageProps {
  // ページ固有の認証要件
  authConfig?: Partial<RouteProtectionConfig>;
}

// ルート保護のコンテキスト型
export interface RouteProtectionContextValue {
  // 設定
  config: RouteProtectionConfig;

  // 状態
  state: RouteProtectionState;

  // アクション
  updateConfig: (config: Partial<RouteProtectionConfig>) => void;
  handleRedirect: (target: string) => void;
  clearError: () => void;
}

// ルート保護のフック返り値型
export interface UseRouteProtectionReturn {
  // 状態プロパティ
  isAccessAllowed: boolean;
  isLoading: boolean;
  hasError: boolean;
  redirectTarget: string | null;

  // 状態チェック関数
  canAccess: () => boolean;
  shouldRedirect: () => boolean;
  shouldShowLoading: () => boolean;
  shouldShowError: () => boolean;

  // アクション関数
  performRedirect: () => void;
  handleAuthError: (error: unknown) => void;
  retryAuth: () => void;
}

// エラー型
export interface RouteProtectionError {
  code: RouteProtectionErrorCode;
  message: string;
  redirectTarget?: string;
  retryable: boolean;
}

// エラーコード定数
export const ROUTE_PROTECTION_ERROR_CODES = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_SESSION: 'INVALID_SESSION',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type RouteProtectionErrorCode =
  (typeof ROUTE_PROTECTION_ERROR_CODES)[keyof typeof ROUTE_PROTECTION_ERROR_CODES];

// デフォルト設定
export const DEFAULT_ROUTE_PROTECTION_CONFIG: RouteProtectionConfig = {
  requireAuth: true,
  allowGuestAccess: false,
  loginRedirect: '/auth/signin',
  unauthorizedRedirect: '/unauthorized',
  validateSession: true,
  validatePermissions: false,
  showLoadingSpinner: true,
  showErrorBoundary: true,
};

// 型ガード関数
export function isValidRouteProtectionConfig(
  config: unknown
): config is RouteProtectionConfig {
  if (!config || typeof config !== 'object') return false;

  const c = config as Record<string, unknown>;
  return (
    typeof c.requireAuth === 'boolean' &&
    typeof c.allowGuestAccess === 'boolean' &&
    typeof c.loginRedirect === 'string' &&
    typeof c.unauthorizedRedirect === 'string' &&
    typeof c.validateSession === 'boolean' &&
    typeof c.validatePermissions === 'boolean' &&
    typeof c.showLoadingSpinner === 'boolean' &&
    typeof c.showErrorBoundary === 'boolean'
  );
}

// ヘルパー関数の型
export type CreateRouteProtectionError = (
  code: RouteProtectionErrorCode,
  message: string,
  redirectTarget?: string
) => RouteProtectionError;

// Next.js App Router特有の型
export interface LayoutProps {
  children: ReactNode;
  params?: Record<string, string>;
}

export interface PageProps {
  params: Record<string, string>;
  searchParams: Record<string, string | string[]>;
}

// 保護されたルートのメタデータ型
export interface ProtectedRouteMetadata {
  title: string;
  description?: string;
  requireAuth: boolean;
  permissions?: string[];
  redirectPath?: string;
}
