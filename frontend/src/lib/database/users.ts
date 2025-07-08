/**
 * Users テーブル操作用ヘルパー関数
 * RLS によりユーザーは自分のデータのみアクセス可能
 */

import { createClient } from '@supabase/supabase-js';
import type { Database, User, UserUpdate, DatabaseResult } from '@/types/database';

/**
 * Supabase クライアントの取得
 */
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

/**
 * 現在のユーザー情報を取得
 * @returns ユーザー情報またはエラー
 */
export async function getCurrentUser(): Promise<DatabaseResult<User>> {
  const supabase = getSupabaseClient();
  
  try {
    // 現在のセッションを取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'Failed to get session',
          details: sessionError.message,
        },
      };
    }
    
    if (!session?.user) {
      return {
        data: null,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User is not authenticated',
        },
      };
    }
    
    // ユーザー情報を取得（RLSにより自分のデータのみ取得可能）
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
      };
    }
    
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * ユーザー情報を更新
 * @param updates 更新するフィールド
 * @returns 更新後のユーザー情報またはエラー
 */
export async function updateCurrentUser(
  updates: UserUpdate
): Promise<DatabaseResult<User>> {
  const supabase = getSupabaseClient();
  
  try {
    // 現在のセッションを取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return {
        data: null,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User is not authenticated',
        },
      };
    }
    
    // ユーザー情報を更新（RLSにより自分のデータのみ更新可能）
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single();
    
    if (error) {
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
      };
    }
    
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * ユーザー名の重複チェック
 * @param username チェックするユーザー名
 * @returns 使用可能かどうか
 */
export async function checkUsernameAvailability(
  username: string
): Promise<DatabaseResult<boolean>> {
  const supabase = getSupabaseClient();
  
  try {
    // ユーザー名の形式チェック
    if (!username.match(/^[a-zA-Z0-9_-]{3,50}$/)) {
      return {
        data: null,
        error: {
          code: 'INVALID_USERNAME',
          message: 'Username must be 3-50 characters and contain only letters, numbers, hyphens, and underscores',
        },
      };
    }
    
    // 重複チェック（RLSのため、実際には全ユーザーのデータは見えないが、
    // この操作は特別に許可されるべき）
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    
    if (error) {
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
      };
    }
    
    // データが存在しない = 使用可能
    return { data: data === null, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * ユーザーアカウントを削除（ソフトデリートではなく完全削除）
 * @returns 削除成功かどうか
 */
export async function deleteCurrentUser(): Promise<DatabaseResult<boolean>> {
  const supabase = getSupabaseClient();
  
  try {
    // 現在のセッションを取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return {
        data: null,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User is not authenticated',
        },
      };
    }
    
    // ユーザーデータを削除（RLSにより自分のデータのみ削除可能）
    // auth.users の削除はカスケード削除で public.users も削除される
    const { error } = await supabase.auth.admin.deleteUser(session.user.id);
    
    if (error) {
      return {
        data: null,
        error: {
          code: error.code || 'DELETE_ERROR',
          message: error.message,
        },
      };
    }
    
    // サインアウト
    await supabase.auth.signOut();
    
    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * ユーザー情報の同期（Supabase Auth のメタデータから）
 * 通常は自動で同期されるが、手動同期が必要な場合に使用
 */
export async function syncUserFromAuth(): Promise<DatabaseResult<User>> {
  const supabase = getSupabaseClient();
  
  try {
    // 現在のセッションを取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return {
        data: null,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User is not authenticated',
        },
      };
    }
    
    // Auth のユーザー情報から更新データを作成
    const updates: UserUpdate = {
      email: session.user.email || undefined,
      display_name: session.user.user_metadata?.name || undefined,
      avatar_url: session.user.user_metadata?.avatar_url || undefined,
    };
    
    // ユーザー情報を更新
    return updateCurrentUser(updates);
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}