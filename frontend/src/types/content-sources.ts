/**
 * Content Sources 型定義
 * ユーザー固有のデータ収集ソース（GitHub、RSS等）管理のための型定義
 */

import type { UUID, ISODateTime } from './database';

/**
 * データソースタイプの列挙型
 */
export type ContentSourceType = 'github' | 'rss' | 'news' | 'api' | 'webhook';

/**
 * Content Sources テーブルの型定義
 */
export interface ContentSource {
  /** データソースの一意識別子 */
  id: UUID;

  /** ソース所有者のユーザーID */
  user_id: UUID;

  /** データソースタイプ */
  source_type: ContentSourceType;

  /** ユーザー定義のソース名 */
  name: string;

  /** データ取得元URL */
  url: string;

  /** ソース固有の設定（JSONB） */
  config: ContentSourceConfig;

  /** 最終データ取得日時 */
  last_fetched_at: ISODateTime | null;

  /** 総取得回数 */
  fetch_count: number;

  /** エラー発生回数 */
  error_count: number;

  /** 最新のエラーメッセージ */
  last_error: string | null;

  /** ソースのアクティブ状態 */
  is_active: boolean;

  /** 作成日時 */
  created_at: ISODateTime;

  /** 更新日時 */
  updated_at: ISODateTime;
}

/**
 * Content Sources テーブルへの INSERT 用型
 */
export interface ContentSourceInsert {
  /** データソースID（省略時は自動生成） */
  id?: UUID;

  /** ソース所有者のユーザーID（必須） */
  user_id: UUID;

  /** データソースタイプ（必須） */
  source_type: ContentSourceType;

  /** ユーザー定義のソース名（必須） */
  name: string;

  /** データ取得元URL（必須） */
  url: string;

  /** ソース固有の設定（省略時は空オブジェクト） */
  config?: ContentSourceConfig;

  /** 最終データ取得日時（省略可） */
  last_fetched_at?: ISODateTime | null;

  /** 総取得回数（省略時は0） */
  fetch_count?: number;

  /** エラー発生回数（省略時は0） */
  error_count?: number;

  /** 最新のエラーメッセージ（省略可） */
  last_error?: string | null;

  /** ソースのアクティブ状態（省略時はtrue） */
  is_active?: boolean;

  /** 作成日時（省略時は自動設定） */
  created_at?: ISODateTime;

  /** 更新日時（省略時は自動設定） */
  updated_at?: ISODateTime;
}

/**
 * Content Sources テーブルの UPDATE 用型
 * 全フィールドがオプショナル
 */
export interface ContentSourceUpdate {
  /** データソースタイプ */
  source_type?: ContentSourceType;

  /** ユーザー定義のソース名 */
  name?: string;

  /** データ取得元URL */
  url?: string;

  /** ソース固有の設定 */
  config?: ContentSourceConfig;

  /** 最終データ取得日時 */
  last_fetched_at?: ISODateTime | null;

  /** 総取得回数 */
  fetch_count?: number;

  /** エラー発生回数 */
  error_count?: number;

  /** 最新のエラーメッセージ */
  last_error?: string | null;

  /** ソースのアクティブ状態 */
  is_active?: boolean;

  /** 更新日時（自動更新されるが明示的に設定も可能） */
  updated_at?: ISODateTime;
}

/**
 * ソース固有設定の基底型
 */
export type ContentSourceConfig =
  | GitHubSourceConfig
  | RSSSourceConfig
  | NewsAPISourceConfig
  | WebhookSourceConfig
  | GenericAPISourceConfig;

/**
 * GitHub ソース設定
 */
export interface GitHubSourceConfig {
  /** GitHubユーザー名 */
  username?: string;

  /** 対象リポジトリリスト */
  repositories?: string[];

  /** プライベートリポジトリを含むか */
  include_private?: boolean;

  /** 取得頻度（時間） */
  fetch_frequency?: number;

  /** API設定 */
  api_settings?: {
    timeout?: number;
    retry_count?: number;
    access_token?: string; // 暗号化されたトークン
  };

  /** フィルタ設定 */
  filters?: {
    languages?: string[];
    min_stars?: number;
    updated_since?: ISODateTime;
  };
}

/**
 * RSS ソース設定
 */
export interface RSSSourceConfig {
  /** 更新間隔（秒） */
  refresh_interval?: number;

  /** 最大取得アイテム数 */
  max_items?: number;

  /** フィルタキーワード */
  filter_keywords?: string[];

  /** 除外キーワード */
  exclude_keywords?: string[];

  /** フルコンテンツを解析するか */
  parse_full_content?: boolean;

  /** カスタムヘッダー */
  custom_headers?: Record<string, string>;

  /** タイムアウト設定 */
  timeout?: number;
}

/**
 * ニュースAPI ソース設定
 */
export interface NewsAPISourceConfig {
  /** APIキー（暗号化済み） */
  api_key?: string;

  /** カテゴリリスト */
  categories?: string[];

  /** 言語設定 */
  language?: string;

  /** 国設定 */
  country?: string;

  /** 最大記事数 */
  max_articles?: number;

  /** キーワード検索 */
  keywords?: string[];

  /** ソートオプション */
  sort_by?: 'relevancy' | 'popularity' | 'publishedAt';
}

/**
 * Webhook ソース設定
 */
export interface WebhookSourceConfig {
  /** Webhook秘密キー */
  secret_key?: string;

  /** 許可されたIPアドレス */
  allowed_ips?: string[];

  /** 最大ペイロードサイズ */
  max_payload_size?: number;

  /** 検証設定 */
  verification?: {
    signature_header?: string;
    algorithm?: 'sha1' | 'sha256';
  };

  /** 変換設定 */
  transformation?: {
    extract_fields?: string[];
    format_template?: string;
  };
}

/**
 * 汎用API ソース設定
 */
export interface GenericAPISourceConfig {
  /** 認証方式 */
  auth_type?: 'none' | 'api_key' | 'bearer' | 'basic';

  /** 認証情報 */
  auth_config?: {
    api_key?: string;
    token?: string;
    username?: string;
    password?: string;
    header_name?: string;
  };

  /** HTTPメソッド */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';

  /** リクエストヘッダー */
  headers?: Record<string, string>;

  /** リクエストボディ */
  body?: string;

  /** レスポンス処理 */
  response_processing?: {
    data_path?: string;
    mapping?: Record<string, string>;
  };

  /** レート制限 */
  rate_limit?: {
    requests_per_minute?: number;
    requests_per_hour?: number;
  };
}

/**
 * データソース統計情報
 */
export interface ContentSourceStats {
  /** 総データソース数 */
  total_sources: number;

  /** アクティブソース数 */
  active_sources: number;

  /** タイプ別カウント */
  by_type: Record<ContentSourceType, number>;

  /** 最終活動日時 */
  last_activity: ISODateTime | null;
}

/**
 * データソースフィルタ条件
 */
export interface ContentSourceFilter {
  /** ソースタイプでフィルタ */
  source_type?: ContentSourceType | ContentSourceType[];

  /** 名前の部分一致検索 */
  name?: string;

  /** URLの部分一致検索 */
  url?: string;

  /** アクティブ状態でフィルタ */
  is_active?: boolean;

  /** 作成日時の範囲 */
  created_at?: {
    from?: ISODateTime;
    to?: ISODateTime;
  };

  /** 最終取得日時の範囲 */
  last_fetched_at?: {
    from?: ISODateTime;
    to?: ISODateTime;
  };
}

/**
 * ソート可能なカラム
 */
export type ContentSourceSortableColumn =
  | 'name'
  | 'source_type'
  | 'created_at'
  | 'updated_at'
  | 'last_fetched_at'
  | 'fetch_count'
  | 'error_count';

/**
 * データソース検索オプション
 */
export interface ContentSourceQueryOptions {
  /** ソート設定 */
  sort?: {
    column: ContentSourceSortableColumn;
    order: 'asc' | 'desc';
  };

  /** ページネーション設定 */
  pagination?: {
    page: number;
    per_page: number;
  };

  /** フィルタ条件 */
  filter?: ContentSourceFilter;
}

/**
 * データソース取得履歴
 */
export interface ContentSourceFetchHistory {
  /** 取得ID */
  id: UUID;

  /** データソースID */
  source_id: UUID;

  /** 取得開始時刻 */
  started_at: ISODateTime;

  /** 取得完了時刻 */
  completed_at: ISODateTime | null;

  /** 取得ステータス */
  status: 'pending' | 'success' | 'error' | 'timeout';

  /** 取得したアイテム数 */
  items_fetched: number;

  /** エラーメッセージ */
  error_message: string | null;

  /** 処理時間（ミリ秒） */
  duration_ms: number | null;

  /** 追加メタデータ */
  metadata: Record<string, unknown>;
}

/**
 * データソース検証結果
 */
export interface ContentSourceValidation {
  /** 検証が成功したか */
  is_valid: boolean;

  /** エラーメッセージリスト */
  errors: string[];

  /** 警告メッセージリスト */
  warnings: string[];

  /** 検証したフィールド */
  validated_fields: string[];

  /** 検証実行日時 */
  validated_at: ISODateTime;
}

/**
 * データソース接続テスト結果
 */
export interface ContentSourceConnectionTest {
  /** 接続テストが成功したか */
  success: boolean;

  /** レスポンス時間（ミリ秒） */
  response_time_ms: number;

  /** HTTPステータスコード */
  status_code?: number;

  /** エラーメッセージ */
  error_message?: string;

  /** 取得できたサンプルデータ */
  sample_data?: unknown;

  /** テスト実行日時 */
  tested_at: ISODateTime;
}

/**
 * データソース作成リクエスト
 */
export interface CreateContentSourceRequest {
  /** データソースタイプ */
  source_type: ContentSourceType;

  /** ソース名 */
  name: string;

  /** URL */
  url: string;

  /** 設定 */
  config?: Partial<ContentSourceConfig>;

  /** アクティブ状態 */
  is_active?: boolean;
}

/**
 * データソース更新リクエスト
 */
export interface UpdateContentSourceRequest {
  /** ソース名 */
  name?: string;

  /** URL */
  url?: string;

  /** 設定 */
  config?: Partial<ContentSourceConfig>;

  /** アクティブ状態 */
  is_active?: boolean;
}
