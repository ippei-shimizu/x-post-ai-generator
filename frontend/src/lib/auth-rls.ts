import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { Database } from '@/types/supabase';

// NextAuth session と Supabase RLS の統合

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * NextAuth.js セッションからユーザーIDを取得してSupabase RLSを設定
 * Server Components や API Routes で使用
 */
export async function createAuthenticatedSupabaseClient() {
  // NextAuth セッション取得
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Unauthorized: No valid session found');
  }

  // Service Role でSupabaseクライアント作成
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // RLS用にユーザーコンテキストを設定
  // auth.uid() 関数でアクセス可能になる
  const { error } = await supabase.rpc('set_user_context', {
    user_id: session.user.id,
  });

  if (error) {
    console.error('Failed to set user context for RLS:', error);
    throw new Error('Failed to authenticate with database');
  }

  return {
    supabase,
    userId: session.user.id,
    userEmail: session.user.email,
    session,
  };
}

/**
 * クライアントサイドでNextAuth.js セッションとSupabaseを統合
 * Client Components で使用
 */
export function createClientSupabaseWithAuth(accessToken?: string) {
  if (!accessToken) {
    // 匿名アクセス（認証が必要なテーブルは RLS で制限される）
    return createClient<Database>(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // NextAuth.js JWT をSupabaseに渡す
  return createClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
      },
    }
  );
}

/**
 * ユーザーの権限チェック（RLS ポリシーと連携）
 */
export async function validateUserAccess(
  userId: string,
  resourceUserId: string,
  operation: string = 'access'
): Promise<void> {
  if (userId !== resourceUserId) {
    console.warn(
      `Access denied: User ${userId} attempted ${operation} on resource owned by ${resourceUserId}`
    );
    throw new Error(`Access denied: You can only ${operation} your own data`);
  }
}

/**
 * NextAuth.js + Supabase でのエラーハンドリング
 */
export class AuthRLSError extends Error {
  constructor(
    message: string,
    public userId?: string,
    public operation?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AuthRLSError';
  }
}

/**
 * RLS ポリシー用のユーザーコンテキスト設定関数
 * データベース関数として実装される
 */
export interface UserContext {
  user_id: string;
}

/**
 * 型安全なユーザーデータアクセス
 */
export async function withUserContext<T>(
  operation: (
    client: ReturnType<typeof createClient<Database>>,
    userId: string
  ) => Promise<T>
): Promise<T> {
  const { supabase, userId } = await createAuthenticatedSupabaseClient();

  try {
    return await operation(supabase, userId);
  } catch (error) {
    if (error instanceof Error) {
      throw new AuthRLSError(
        `Database operation failed: ${error.message}`,
        userId,
        'database_operation',
        error
      );
    }
    throw error;
  }
}

/**
 * ユーザー固有データの安全な取得
 */
export async function getUserData<T = any>(
  tableName: string,
  userId: string,
  filters: Record<string, any> = {}
): Promise<T[]> {
  return withUserContext(async (supabase, sessionUserId) => {
    // セッションユーザーと要求ユーザーの一致確認
    validateUserAccess(sessionUserId, userId, 'read');

    const query = supabase.from(tableName).select('*').eq('user_id', userId);

    // 追加フィルターを適用
    Object.entries(filters).forEach(([key, value]) => {
      query.eq(key, value);
    });

    const { data, error } = await query;

    if (error) {
      throw new AuthRLSError(
        `Failed to fetch user data from ${tableName}`,
        userId,
        'read',
        error
      );
    }

    return data || [];
  });
}

/**
 * ユーザー固有データの安全な作成
 */
export async function createUserData<T = any>(
  tableName: string,
  userId: string,
  data: Omit<T, 'user_id' | 'id' | 'created_at' | 'updated_at'>
): Promise<T> {
  return withUserContext(async (supabase, sessionUserId) => {
    // セッションユーザーと要求ユーザーの一致確認
    validateUserAccess(sessionUserId, userId, 'create');

    const { data: result, error } = await supabase
      .from(tableName)
      .insert({ ...data, user_id: userId })
      .select()
      .single();

    if (error) {
      throw new AuthRLSError(
        `Failed to create user data in ${tableName}`,
        userId,
        'create',
        error
      );
    }

    return result;
  });
}

/**
 * ユーザー固有データの安全な更新
 */
export async function updateUserData<T = any>(
  tableName: string,
  userId: string,
  id: string,
  data: Partial<Omit<T, 'user_id' | 'id' | 'created_at'>>
): Promise<T> {
  return withUserContext(async (supabase, sessionUserId) => {
    // セッションユーザーと要求ユーザーの一致確認
    validateUserAccess(sessionUserId, userId, 'update');

    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .eq('user_id', userId) // RLS + 明示的ユーザーチェック
      .select()
      .single();

    if (error) {
      throw new AuthRLSError(
        `Failed to update user data in ${tableName}`,
        userId,
        'update',
        error
      );
    }

    return result;
  });
}

/**
 * ユーザー固有データの安全な削除
 */
export async function deleteUserData(
  tableName: string,
  userId: string,
  id: string
): Promise<void> {
  return withUserContext(async (supabase, sessionUserId) => {
    // セッションユーザーと要求ユーザーの一致確認
    validateUserAccess(sessionUserId, userId, 'delete');

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // RLS + 明示的ユーザーチェック

    if (error) {
      throw new AuthRLSError(
        `Failed to delete user data from ${tableName}`,
        userId,
        'delete',
        error
      );
    }
  });
}
