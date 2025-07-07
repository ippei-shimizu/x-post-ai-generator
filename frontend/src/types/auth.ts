/**
 * 認証関連の型定義
 * AuthProvider用の高度な状態管理型
 */

import { type Session, type User } from 'next-auth';

// 拡張されたユーザー情報型
export interface AuthUser extends Omit<User, 'name' | 'email' | 'image'> {
  id: string; // 必須のUUID
  email: string; // 必須のメールアドレス
  name: string | null; // NextAuthのUserと一致させる
  image: string | null; // NextAuthのUserと一致させる
  // Supabase auth_usersからの追加情報
  google_id: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

// 認証エラーの型
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

// 認証状態の型
export interface AuthState {
  // セッション情報
  session: Session | null;
  user: AuthUser | null;

  // 状態フラグ
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // エラー処理
  error: AuthError | null;

  // セッション管理
  sessionExpiry: Date | null;
  isSessionExpiring: boolean; // 5分以内に期限切れ

  // リフレッシュ状態
  isRefreshing: boolean;
  lastRefresh: Date | null;
}

// 認証アクションの型
export enum AuthActionType {
  // セッション関連
  SET_SESSION = 'SET_SESSION',
  CLEAR_SESSION = 'CLEAR_SESSION',

  // ローディング状態
  SET_LOADING = 'SET_LOADING',
  SET_INITIALIZED = 'SET_INITIALIZED',

  // エラー処理
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',

  // リフレッシュ
  START_REFRESH = 'START_REFRESH',
  COMPLETE_REFRESH = 'COMPLETE_REFRESH',

  // セッション期限
  CHECK_SESSION_EXPIRY = 'CHECK_SESSION_EXPIRY',
}

// 認証アクションのペイロード型
export type AuthAction =
  | {
      type: AuthActionType.SET_SESSION;
      payload: { session: Session; user: AuthUser };
    }
  | { type: AuthActionType.CLEAR_SESSION }
  | { type: AuthActionType.SET_LOADING; payload: boolean }
  | { type: AuthActionType.SET_INITIALIZED; payload: boolean }
  | { type: AuthActionType.SET_ERROR; payload: AuthError }
  | { type: AuthActionType.CLEAR_ERROR }
  | { type: AuthActionType.START_REFRESH }
  | { type: AuthActionType.COMPLETE_REFRESH; payload: Date }
  | { type: AuthActionType.CHECK_SESSION_EXPIRY };

// AuthProviderのコンテキスト型
export interface AuthContextValue extends AuthState {
  // アクション関数
  refreshSession: () => Promise<void>;
  clearError: () => void;
  signOut: () => Promise<void>;

  // ユーティリティ
  checkSessionExpiry: () => boolean;
  getTimeUntilExpiry: () => number | null; // 分単位
}

// AuthProviderのProps型
export interface AuthProviderProps {
  children: React.ReactNode;
  // オプション設定
  sessionCheckInterval?: number; // セッションチェック間隔（ms）
  autoRefresh?: boolean; // 自動リフレッシュ
}

// セッション検証の設定型
export interface SessionValidationConfig {
  validateUserId: boolean;
  validateEmail: boolean;
  validateExpiry: boolean;
  allowGuestAccess: boolean;
}

// カスタムフックの返り値型（拡張版）
export interface UseAuthReturn extends AuthContextValue {
  // 便利な計算プロパティ
  userId: string | undefined;
  userEmail: string | undefined;
  userName: string | null | undefined;
  userImage: string | null | undefined;

  // 状態チェック関数
  isGuest: () => boolean;
  hasValidSession: () => boolean;
  needsReauth: () => boolean;
}

// 認証設定の型
export interface AuthConfig {
  validation: SessionValidationConfig;
  timeouts: {
    sessionCheck: number;
    warningTime: number;
    refreshTimeout: number;
  };
  features: {
    autoRefresh: boolean;
    sessionWarning: boolean;
    errorRecovery: boolean;
  };
}

// エラーコードの定数
export const AUTH_ERROR_CODES = {
  INVALID_SESSION: 'INVALID_SESSION',
  INVALID_USER_ID: 'INVALID_USER_ID',
  INVALID_EMAIL: 'INVALID_EMAIL',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  REFRESH_FAILED: 'REFRESH_FAILED',
  MALFORMED_DATA: 'MALFORMED_DATA',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

// 型ガード関数
export function isValidAuthUser(user: unknown): user is AuthUser {
  if (!user || typeof user !== 'object') return false;

  const u = user as Record<string, unknown>;

  // UUID形式の検証（簡易版）
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidUUID = typeof u.id === 'string' && uuidRegex.test(u.id);

  return (
    isValidUUID &&
    typeof u.email === 'string' &&
    u.email.includes('@') &&
    u.email.length > 3
  );
}

export function isValidSession(session: unknown): session is Session {
  if (!session || typeof session !== 'object') return false;

  const s = session as Record<string, unknown>;

  // expires の日付検証
  const isValidExpiry =
    typeof s.expires === 'string' &&
    !isNaN(Date.parse(s.expires)) &&
    new Date(s.expires).getTime() > Date.now();

  return s.user !== undefined && isValidExpiry && isValidAuthUser(s.user);
}

// ユーティリティ関数の型
export type CreateAuthError = (
  code: AuthErrorCode,
  message: string,
  details?: Record<string, unknown>
) => AuthError;
