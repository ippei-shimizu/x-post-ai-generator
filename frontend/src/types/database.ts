/**
 * Supabase Database 型定義
 * データベーステーブルの型定義とRLS対応
 */

/**
 * UUID型のエイリアス
 */
export type UUID = string;

/**
 * ISO 8601形式の日時文字列
 */
export type ISODateTime = string;

/**
 * データベーステーブル定義
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

/**
 * Users テーブルの型定義
 * Supabase Auth と連携し、個人情報を管理
 */
export interface User {
  /** Supabase AuthのユーザーID */
  id: UUID;
  
  /** メールアドレス（一意） */
  email: string;
  
  /** ユーザー名（オプション、一意） */
  username: string | null;
  
  /** 表示名 */
  display_name: string | null;
  
  /** アバター画像URL */
  avatar_url: string | null;
  
  /** Google OAuth ID（一意） */
  google_id: string;
  
  /** 作成日時 */
  created_at: ISODateTime;
  
  /** 更新日時 */
  updated_at: ISODateTime;
}

/**
 * Users テーブルへの INSERT 用型
 * id は Supabase Auth から自動設定されるため必須
 */
export interface UserInsert {
  /** Supabase AuthのユーザーID（必須） */
  id: UUID;
  
  /** メールアドレス（必須） */
  email: string;
  
  /** ユーザー名（オプション） */
  username?: string | null;
  
  /** 表示名（オプション） */
  display_name?: string | null;
  
  /** アバター画像URL（オプション） */
  avatar_url?: string | null;
  
  /** Google OAuth ID（必須） */
  google_id: string;
  
  /** 作成日時（省略時は自動設定） */
  created_at?: ISODateTime;
  
  /** 更新日時（省略時は自動設定） */
  updated_at?: ISODateTime;
}

/**
 * Users テーブルの UPDATE 用型
 * 全フィールドがオプショナル
 */
export interface UserUpdate {
  /** メールアドレス */
  email?: string;
  
  /** ユーザー名 */
  username?: string | null;
  
  /** 表示名 */
  display_name?: string | null;
  
  /** アバター画像URL */
  avatar_url?: string | null;
  
  /** Google OAuth ID */
  google_id?: string;
  
  /** 更新日時（自動更新されるが明示的に設定も可能） */
  updated_at?: ISODateTime;
}

/**
 * RLS（Row Level Security）ヘルパー型
 * 認証されたユーザーのみがアクセス可能
 */
export interface AuthenticatedUser {
  /** 認証されたユーザーのID */
  user_id: UUID;
  
  /** ユーザー情報 */
  user: User;
}

/**
 * エラーレスポンス型
 */
export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

/**
 * データベース操作の結果型
 */
export type DatabaseResult<T> = 
  | { data: T; error: null }
  | { data: null; error: DatabaseError };

/**
 * ページネーション情報
 */
export interface Pagination {
  /** 現在のページ番号（1始まり） */
  page: number;
  
  /** 1ページあたりの件数 */
  per_page: number;
  
  /** 総件数 */
  total: number;
  
  /** 総ページ数 */
  total_pages: number;
}

/**
 * ソート順序
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Users テーブルのソート可能なカラム
 */
export type UserSortableColumn = 
  | 'email'
  | 'username'
  | 'display_name'
  | 'created_at'
  | 'updated_at';

/**
 * フィルタ条件
 */
export interface UserFilter {
  /** メールアドレスの部分一致検索 */
  email?: string;
  
  /** ユーザー名の部分一致検索 */
  username?: string;
  
  /** 表示名の部分一致検索 */
  display_name?: string;
  
  /** 作成日時の範囲 */
  created_at?: {
    from?: ISODateTime;
    to?: ISODateTime;
  };
}

/**
 * データベース操作オプション
 */
export interface QueryOptions {
  /** ソート設定 */
  sort?: {
    column: UserSortableColumn;
    order: SortOrder;
  };
  
  /** ページネーション設定 */
  pagination?: {
    page: number;
    per_page: number;
  };
  
  /** フィルタ条件 */
  filter?: UserFilter;
}

/**
 * Supabase Auth との連携用型
 */
export interface AuthMetadata {
  /** プロバイダー（例: 'google'） */
  provider?: string;
  
  /** プロバイダー一覧 */
  providers?: string[];
  
  /** プロバイダーID */
  provider_id?: string;
  
  /** ユーザー名 */
  name?: string;
  
  /** アバター画像URL */
  avatar_url?: string;
  
  /** その他のメタデータ */
  [key: string]: unknown;
}