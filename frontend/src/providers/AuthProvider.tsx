/**
 * AuthProvider - 高度な認証状態管理
 * React Context + useReducer を使用した拡張認証機能
 */

'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  AuthState,
  AuthAction,
  AuthActionType,
  AuthContextValue,
  AuthProviderProps,
  AuthError,
  AuthUser,
  AUTH_ERROR_CODES,
  CreateAuthError,
  isValidSession,
  isValidAuthUser,
} from '../types/auth';

// デフォルト設定
const DEFAULT_CONFIG = {
  sessionCheckInterval: 60000, // 1分
  sessionWarningTime: 5, // 5分前に警告
  autoRefresh: true,
};

// 初期状態
const initialState: AuthState = {
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isInitialized: false,
  error: null,
  sessionExpiry: null,
  isSessionExpiring: false,
  isRefreshing: false,
  lastRefresh: null,
};

// エラー作成ヘルパー
const createAuthError: CreateAuthError = (code, message, details = {}) => ({
  code,
  message,
  details,
  timestamp: new Date(),
});

// Reducer関数
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case AuthActionType.SET_SESSION:
      const { session, user } = action.payload;
      const sessionExpiry = session.expires ? new Date(session.expires) : null;
      const now = new Date();
      const isExpiring = sessionExpiry
        ? sessionExpiry.getTime() - now.getTime() <
          DEFAULT_CONFIG.sessionWarningTime * 60 * 1000
        : false;

      return {
        ...state,
        session,
        user,
        isAuthenticated: true,
        isLoading: false,
        sessionExpiry,
        isSessionExpiring: isExpiring,
        error: null,
      };

    case AuthActionType.CLEAR_SESSION:
      return {
        ...state,
        session: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        sessionExpiry: null,
        isSessionExpiring: false,
        isRefreshing: false,
        error: null,
      };

    case AuthActionType.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case AuthActionType.SET_INITIALIZED:
      return {
        ...state,
        isInitialized: action.payload,
      };

    case AuthActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case AuthActionType.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AuthActionType.START_REFRESH:
      return {
        ...state,
        isRefreshing: true,
        error: null,
      };

    case AuthActionType.COMPLETE_REFRESH:
      return {
        ...state,
        isRefreshing: false,
        lastRefresh: action.payload,
      };

    case AuthActionType.CHECK_SESSION_EXPIRY:
      if (!state.sessionExpiry) return state;

      const now2 = new Date();
      const timeUntilExpiry = state.sessionExpiry.getTime() - now2.getTime();
      const warningThreshold = DEFAULT_CONFIG.sessionWarningTime * 60 * 1000;

      return {
        ...state,
        isSessionExpiring:
          timeUntilExpiry < warningThreshold && timeUntilExpiry > 0,
      };

    default:
      return state;
  }
}

// AuthContext作成
const AuthContext = createContext<AuthContextValue | null>(null);

// AuthProvider コンポーネント
export function AuthProvider({
  children,
  sessionCheckInterval = DEFAULT_CONFIG.sessionCheckInterval,
  autoRefresh = DEFAULT_CONFIG.autoRefresh,
}: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // セッション検証
  const validateSession = useCallback((sessionData: unknown) => {
    if (!isValidSession(sessionData)) {
      throw createAuthError(
        AUTH_ERROR_CODES.INVALID_SESSION,
        'Session data is invalid or malformed'
      );
    }

    if (!isValidAuthUser(sessionData.user)) {
      throw createAuthError(
        AUTH_ERROR_CODES.INVALID_USER_ID,
        'User data is invalid or missing required fields'
      );
    }

    return sessionData;
  }, []);

  // ユーザーデータ変換
  const transformUser = useCallback((user: unknown): AuthUser => {
    if (!isValidAuthUser(user)) {
      throw createAuthError(
        AUTH_ERROR_CODES.INVALID_USER_ID,
        'Invalid user data structure'
      );
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || null,
      image: user.image || null,
      google_id: user.google_id || '',
      email_verified: user.email_verified || false,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at || new Date().toISOString(),
    };
  }, []);

  // セッションリフレッシュ
  const refreshSession = useCallback(async () => {
    try {
      dispatch({ type: AuthActionType.START_REFRESH });

      await update(); // NextAuthのセッション更新

      dispatch({
        type: AuthActionType.COMPLETE_REFRESH,
        payload: new Date(),
      });
    } catch (error) {
      const authError = createAuthError(
        AUTH_ERROR_CODES.REFRESH_FAILED,
        'Failed to refresh session',
        { originalError: error }
      );
      dispatch({ type: AuthActionType.SET_ERROR, payload: authError });
    }
  }, [update]);

  // エラークリア
  const clearError = useCallback(() => {
    dispatch({ type: AuthActionType.CLEAR_ERROR });
  }, []);

  // サインアウト
  const signOut = useCallback(async () => {
    try {
      dispatch({ type: AuthActionType.SET_LOADING, payload: true });
      await nextAuthSignOut({ redirect: false });
      dispatch({ type: AuthActionType.CLEAR_SESSION });
      router.push('/auth/signin');
    } catch (error) {
      const authError = createAuthError(
        AUTH_ERROR_CODES.UNKNOWN_ERROR,
        'Failed to sign out',
        { originalError: error }
      );
      dispatch({ type: AuthActionType.SET_ERROR, payload: authError });
    }
  }, [router]);

  // セッション期限チェック
  const checkSessionExpiry = useCallback(() => {
    if (!state.sessionExpiry) return false;

    const now = new Date();
    const timeUntilExpiry = state.sessionExpiry.getTime() - now.getTime();

    if (timeUntilExpiry <= 0) {
      // セッション期限切れ
      const authError = createAuthError(
        AUTH_ERROR_CODES.SESSION_EXPIRED,
        'Session has expired'
      );
      dispatch({ type: AuthActionType.SET_ERROR, payload: authError });
      dispatch({ type: AuthActionType.CLEAR_SESSION });
      return true;
    }

    dispatch({ type: AuthActionType.CHECK_SESSION_EXPIRY });
    return false;
  }, [state.sessionExpiry]);

  // 期限までの時間取得（分単位）
  const getTimeUntilExpiry = useCallback(() => {
    if (!state.sessionExpiry) return null;

    const now = new Date();
    const timeUntilExpiry = state.sessionExpiry.getTime() - now.getTime();
    return Math.floor(timeUntilExpiry / (1000 * 60));
  }, [state.sessionExpiry]);

  // NextAuthセッション変更の監視
  useEffect(() => {
    try {
      dispatch({
        type: AuthActionType.SET_LOADING,
        payload: status === 'loading',
      });

      if (status === 'loading') {
        return;
      }

      if (session) {
        // セッション検証
        const validatedSession = validateSession(session);
        const user = transformUser(session.user);

        dispatch({
          type: AuthActionType.SET_SESSION,
          payload: { session: validatedSession, user },
        });
      } else {
        // セッションがnullの場合は認証失敗とみなす
        if (status === 'unauthenticated') {
          const authError = createAuthError(
            AUTH_ERROR_CODES.INVALID_SESSION,
            'Authentication failed'
          );
          dispatch({ type: AuthActionType.SET_ERROR, payload: authError });
        }
        dispatch({ type: AuthActionType.CLEAR_SESSION });
      }

      if (!state.isInitialized) {
        dispatch({ type: AuthActionType.SET_INITIALIZED, payload: true });
      }
    } catch (error) {
      const authError =
        error instanceof Error && 'code' in error && 'timestamp' in error
          ? (error as AuthError)
          : createAuthError(
              AUTH_ERROR_CODES.MALFORMED_DATA,
              'Invalid session data',
              { originalError: error }
            );

      dispatch({ type: AuthActionType.SET_ERROR, payload: authError });
      dispatch({ type: AuthActionType.CLEAR_SESSION });
    }
  }, [session, status, validateSession, transformUser, state.isInitialized]);

  // 定期的なセッション期限チェック
  useEffect(() => {
    if (!state.isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const isExpired = checkSessionExpiry();

      // 自動リフレッシュ（期限が近い場合）
      if (
        autoRefresh &&
        state.isSessionExpiring &&
        !state.isRefreshing &&
        !isExpired
      ) {
        refreshSession();
      }
    }, sessionCheckInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    state.isAuthenticated,
    state.isSessionExpiring,
    state.isRefreshing,
    sessionCheckInterval,
    autoRefresh,
    checkSessionExpiry,
    refreshSession,
  ]);

  // メモ化されたコンテキスト値
  const contextValue = useMemo<AuthContextValue>(
    () => ({
      ...state,
      refreshSession,
      clearError,
      signOut,
      checkSessionExpiry,
      getTimeUntilExpiry,
    }),
    [
      state,
      refreshSession,
      clearError,
      signOut,
      checkSessionExpiry,
      getTimeUntilExpiry,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// カスタムフック
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
