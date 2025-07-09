/**
 * Issue #21: ユーザー固有検索関数 - TypeScript型定義
 *
 * search_user_content関数のTypeScript型定義ファイル
 * PostgreSQL関数とフロントエンド間の型安全性を保証
 */

/**
 * search_user_content関数の入力パラメータ型
 * PostgreSQL関数の引数と一致させる
 */
export interface SearchUserContentParams {
  /** 検索対象のユーザーID（必須） */
  target_user_id: string;

  /** クエリベクトル（1536次元、OpenAI text-embedding-ada-002標準） */
  query_vector: number[];

  /** 類似度閾値（0.0-1.0、デフォルト: 0.7） */
  search_similarity_threshold?: number;

  /** 返却する結果数の上限（デフォルト: 10） */
  match_count?: number;

  /** 開始日フィルタ（ISO 8601形式） */
  start_date?: string;

  /** 終了日フィルタ（ISO 8601形式） */
  end_date?: string;

  /** ソースタイプフィルタ */
  source_type_filter?:
    | 'github'
    | 'rss'
    | 'news'
    | 'api'
    | 'webhook'
    | 'manual'
    | 'test'
    | 'unknown';

  /** アクティブなコンテンツのみ検索するか（デフォルト: true） */
  active_only?: boolean;
}

/**
 * search_user_content関数の返却値型
 * PostgreSQL関数のRETURNS TABLEと一致させる
 */
export interface SearchUserContentResult {
  /** コンテンツID */
  id: string;

  /** コンテンツテキスト */
  content_text: string;

  /** ソースタイプ */
  source_type:
    | 'github'
    | 'rss'
    | 'news'
    | 'api'
    | 'webhook'
    | 'manual'
    | 'test'
    | 'unknown';

  /** ソースURL */
  source_url: string | null;

  /** 類似度スコア（0.0-1.0） */
  similarity: number;

  /** 拡張メタデータ */
  metadata: {
    /** 使用された埋め込みモデル名 */
    model_name: string;

    /** 埋め込み作成日時 */
    embedding_created_at: string;

    /** 類似度閾値設定 */
    similarity_threshold: number;

    /** アクティブ状態 */
    is_active: boolean;

    /** 追加メタデータ */
    metadata: Record<string, unknown>;

    /** クエリ情報 */
    query_info: {
      /** クエリ実行時刻 */
      query_timestamp: string;

      /** リクエストされた閾値 */
      requested_threshold: number;

      /** リクエストされた結果数 */
      requested_count: number;

      /** ソースフィルタ */
      source_filter: string | null;

      /** 日付フィルタ */
      date_filter: {
        start_date: string | null;
        end_date: string | null;
      };
    };
  };

  /** 作成日時 */
  created_at: string;
}

/**
 * API レスポンス型（エラーハンドリング含む）
 */
export interface SearchUserContentResponse {
  /** 検索結果 */
  results: SearchUserContentResult[];

  /** 実行時間（ミリ秒） */
  execution_time_ms?: number;

  /** 結果数 */
  total_count: number;

  /** エラー情報（エラー時のみ） */
  error?: {
    /** エラーコード */
    code: string;

    /** エラーメッセージ */
    message: string;

    /** エラー詳細 */
    details?: string;
  };
}

/**
 * バリデーション用の制約定数
 */
export const SEARCH_USER_CONTENT_CONSTRAINTS = {
  /** ベクトル次元数（OpenAI標準） */
  VECTOR_DIMENSIONS: 1536,

  /** 類似度閾値の範囲 */
  SIMILARITY_THRESHOLD: {
    MIN: 0.0,
    MAX: 1.0,
    DEFAULT: 0.7,
  },

  /** 結果数の範囲 */
  MATCH_COUNT: {
    MIN: 0,
    MAX: 1000,
    DEFAULT: 10,
  },

  /** サポートされるソースタイプ */
  SOURCE_TYPES: [
    'github',
    'rss',
    'news',
    'api',
    'webhook',
    'manual',
    'test',
    'unknown',
  ] as const,

  /** パフォーマンス制限 */
  PERFORMANCE: {
    /** 期待される最大実行時間（ミリ秒） */
    MAX_EXECUTION_TIME_MS: 3000,

    /** 警告閾値（ミリ秒） */
    WARNING_THRESHOLD_MS: 1000,
  },
} as const;

/**
 * 型ガード: SearchUserContentParamsの検証
 */
export function isValidSearchUserContentParams(
  params: unknown
): params is SearchUserContentParams {
  if (!params || typeof params !== 'object') {
    return false;
  }

  const p = params as Record<string, unknown>;

  // 必須フィールドのチェック
  if (!p.target_user_id || typeof p.target_user_id !== 'string') {
    return false;
  }

  if (
    !Array.isArray(p.query_vector) ||
    p.query_vector.length !== SEARCH_USER_CONTENT_CONSTRAINTS.VECTOR_DIMENSIONS
  ) {
    return false;
  }

  // オプショナルフィールドのチェック
  if (p.search_similarity_threshold !== undefined) {
    if (
      typeof p.search_similarity_threshold !== 'number' ||
      p.search_similarity_threshold <
        SEARCH_USER_CONTENT_CONSTRAINTS.SIMILARITY_THRESHOLD.MIN ||
      p.search_similarity_threshold >
        SEARCH_USER_CONTENT_CONSTRAINTS.SIMILARITY_THRESHOLD.MAX
    ) {
      return false;
    }
  }

  if (p.match_count !== undefined) {
    if (
      typeof p.match_count !== 'number' ||
      p.match_count < SEARCH_USER_CONTENT_CONSTRAINTS.MATCH_COUNT.MIN ||
      p.match_count > SEARCH_USER_CONTENT_CONSTRAINTS.MATCH_COUNT.MAX
    ) {
      return false;
    }
  }

  if (p.source_type_filter !== undefined) {
    if (
      typeof p.source_type_filter !== 'string' ||
      !SEARCH_USER_CONTENT_CONSTRAINTS.SOURCE_TYPES.includes(
        p.source_type_filter as (typeof SEARCH_USER_CONTENT_CONSTRAINTS.SOURCE_TYPES)[number]
      )
    ) {
      return false;
    }
  }

  return true;
}

/**
 * デフォルトパラメータを生成するヘルパー関数
 */
export function createDefaultSearchParams(
  target_user_id: string,
  query_vector: number[]
): SearchUserContentParams {
  return {
    target_user_id,
    query_vector,
    search_similarity_threshold:
      SEARCH_USER_CONTENT_CONSTRAINTS.SIMILARITY_THRESHOLD.DEFAULT,
    match_count: SEARCH_USER_CONTENT_CONSTRAINTS.MATCH_COUNT.DEFAULT,
    active_only: true,
  };
}

/**
 * PostgreSQL timestamptz形式からISO 8601への変換
 */
export function formatTimestampForPostgres(date: Date): string {
  return date.toISOString();
}

/**
 * クエリベクトルの正規化（単位ベクトル化）
 */
export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) {
    throw new Error('Cannot normalize zero vector');
  }
  return vector.map(val => val / magnitude);
}

/**
 * 検索結果のソート関数
 */
export function sortSearchResultsBySimilarity(
  results: SearchUserContentResult[],
  descending: boolean = true
): SearchUserContentResult[] {
  return [...results].sort((a, b) => {
    const comparison = a.similarity - b.similarity;
    return descending ? -comparison : comparison;
  });
}

/**
 * エラーレスポンスの型ガード
 */
export function isSearchError(
  response: SearchUserContentResponse
): response is SearchUserContentResponse & {
  error: NonNullable<SearchUserContentResponse['error']>;
} {
  return response.error !== undefined;
}
