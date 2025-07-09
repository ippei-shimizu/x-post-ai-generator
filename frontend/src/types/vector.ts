/**
 * Vector Embeddings & Search 型定義
 * pgvector拡張を使用したベクトル検索システムの型定義
 */

import type { UUID, ISODateTime } from './database';

/**
 * ベクトル埋め込みのソースタイプ
 */
export type EmbeddingSourceType =
  | 'github'
  | 'rss'
  | 'news'
  | 'api'
  | 'webhook'
  | 'manual'
  | 'test'
  | 'unknown';

/**
 * ベクトル埋め込みの次元数（OpenAI Embeddings標準）
 */
export type VectorDimensions = 1536;

/**
 * ベクトル埋め込み型（PostgreSQL vector型対応）
 */
export type Vector1536 = number[]; // 1536次元の数値配列

/**
 * Content Embeddings テーブルの型定義
 */
export interface ContentEmbedding {
  /** 埋め込みの一意識別子 */
  id: UUID;

  /** 埋め込み所有者のユーザーID */
  user_id: UUID;

  /** 元のテキストコンテンツ */
  content_text: string;

  /** 重複防止用ハッシュ */
  content_hash: string | null;

  /** コンテンツのソースタイプ */
  source_type: EmbeddingSourceType;

  /** ソースURL */
  source_url: string | null;

  /** ベクトル埋め込み（1536次元） */
  embedding: Vector1536;

  /** 使用された埋め込みモデル名 */
  model_name: string;

  /** 埋め込み生成日時 */
  embedding_created_at: ISODateTime;

  /** 類似度検索閾値 */
  similarity_threshold: number;

  /** アクティブ状態 */
  is_active: boolean;

  /** 追加メタデータ */
  metadata: Record<string, unknown>;

  /** 作成日時 */
  created_at: ISODateTime;

  /** 更新日時 */
  updated_at: ISODateTime;
}

/**
 * Content Embeddings テーブルへの INSERT 用型
 */
export interface ContentEmbeddingInsert {
  /** 埋め込みID（省略時は自動生成） */
  id?: UUID;

  /** 埋め込み所有者のユーザーID（必須） */
  user_id: UUID;

  /** 元のテキストコンテンツ（必須） */
  content_text: string;

  /** 重複防止用ハッシュ（省略可） */
  content_hash?: string | null;

  /** コンテンツのソースタイプ（省略時は'unknown'） */
  source_type?: EmbeddingSourceType;

  /** ソースURL（省略可） */
  source_url?: string | null;

  /** ベクトル埋め込み（必須） */
  embedding: Vector1536;

  /** 使用された埋め込みモデル名（省略時は'text-embedding-ada-002'） */
  model_name?: string;

  /** 埋め込み生成日時（省略時は自動設定） */
  embedding_created_at?: ISODateTime;

  /** 類似度検索閾値（省略時は0.7） */
  similarity_threshold?: number;

  /** アクティブ状態（省略時はtrue） */
  is_active?: boolean;

  /** 追加メタデータ（省略時は空オブジェクト） */
  metadata?: Record<string, unknown>;

  /** 作成日時（省略時は自動設定） */
  created_at?: ISODateTime;

  /** 更新日時（省略時は自動設定） */
  updated_at?: ISODateTime;
}

/**
 * Content Embeddings テーブルの UPDATE 用型
 */
export interface ContentEmbeddingUpdate {
  /** 元のテキストコンテンツ */
  content_text?: string;

  /** 重複防止用ハッシュ */
  content_hash?: string | null;

  /** コンテンツのソースタイプ */
  source_type?: EmbeddingSourceType;

  /** ソースURL */
  source_url?: string | null;

  /** ベクトル埋め込み */
  embedding?: Vector1536;

  /** 使用された埋め込みモデル名 */
  model_name?: string;

  /** 埋め込み生成日時 */
  embedding_created_at?: ISODateTime;

  /** 類似度検索閾値 */
  similarity_threshold?: number;

  /** アクティブ状態 */
  is_active?: boolean;

  /** 追加メタデータ */
  metadata?: Record<string, unknown>;

  /** 更新日時（自動更新されるが明示的に設定も可能） */
  updated_at?: ISODateTime;
}

/**
 * ベクトル類似度検索のクエリパラメータ
 */
export interface VectorSearchQuery {
  /** 検索対象のユーザーID */
  user_id: UUID;

  /** クエリベクトル（1536次元） */
  query_vector: Vector1536;

  /** 類似度閾値（0.0 - 1.0） */
  similarity_threshold?: number;

  /** 返す結果の最大数 */
  match_count?: number;

  /** ソースタイプでフィルタ */
  source_type?: EmbeddingSourceType | EmbeddingSourceType[];

  /** アクティブなもののみ検索するか */
  active_only?: boolean;
}

/**
 * ベクトル類似度検索の結果
 */
export interface VectorSearchResult {
  /** 埋め込みID */
  id: UUID;

  /** 元のテキストコンテンツ */
  content_text: string;

  /** コンテンツのソースタイプ */
  source_type: EmbeddingSourceType;

  /** ソースURL */
  source_url: string | null;

  /** 類似度スコア（0.0 - 1.0） */
  similarity: number;

  /** 追加メタデータ */
  metadata: Record<string, unknown>;

  /** 作成日時 */
  created_at: ISODateTime;
}

/**
 * バッチベクトル検索クエリ
 */
export interface BatchVectorSearchQuery {
  /** 検索対象のユーザーID */
  user_id: UUID;

  /** 複数のクエリベクトル */
  query_vectors: Vector1536[];

  /** 類似度閾値 */
  similarity_threshold?: number;

  /** 各クエリでの最大結果数 */
  match_count_per_query?: number;

  /** 重複結果の除去 */
  deduplicate?: boolean;
}

/**
 * バッチベクトル検索の結果
 */
export interface BatchVectorSearchResult {
  /** クエリベクトルのインデックス */
  query_index: number;

  /** 検索結果リスト */
  results: VectorSearchResult[];
}

/**
 * ベクトル埋め込み統計情報
 */
export interface VectorEmbeddingStats {
  /** 総埋め込み数 */
  total_embeddings: number;

  /** アクティブな埋め込み数 */
  active_embeddings: number;

  /** ソースタイプ別カウント */
  by_source_type: Record<EmbeddingSourceType, number>;

  /** 平均類似度閾値 */
  avg_similarity_threshold: number;

  /** 最終活動日時 */
  last_activity: ISODateTime | null;
}

/**
 * ベクトル類似度計算方式
 */
export type VectorSimilarityMethod = 'cosine' | 'euclidean' | 'dot_product';

/**
 * ベクトル類似度計算リクエスト
 */
export interface VectorSimilarityRequest {
  /** ベクトル1 */
  vector1: Vector1536;

  /** ベクトル2 */
  vector2: Vector1536;

  /** 計算方式 */
  method?: VectorSimilarityMethod;
}

/**
 * ベクトル類似度計算結果
 */
export interface VectorSimilarityResult {
  /** 類似度スコア */
  similarity: number;

  /** 使用された計算方式 */
  method: VectorSimilarityMethod;

  /** 計算時間（ミリ秒） */
  computation_time_ms?: number;
}

/**
 * ベクトル埋め込み生成リクエスト
 */
export interface CreateEmbeddingRequest {
  /** ユーザーID */
  user_id: UUID;

  /** 埋め込み対象のテキスト */
  text: string;

  /** ソースタイプ */
  source_type?: EmbeddingSourceType;

  /** ソースURL */
  source_url?: string;

  /** 追加メタデータ */
  metadata?: Record<string, unknown>;

  /** 使用するモデル名 */
  model_name?: string;
}

/**
 * ベクトル埋め込み生成結果
 */
export interface CreateEmbeddingResult {
  /** 生成された埋め込みID */
  embedding_id: UUID;

  /** 生成されたベクトル */
  embedding: Vector1536;

  /** 使用されたモデル名 */
  model_name: string;

  /** 生成にかかった時間（ミリ秒） */
  generation_time_ms: number;

  /** 使用されたトークン数 */
  token_count?: number;
}

/**
 * ベクトル検索フィルタ条件
 */
export interface VectorSearchFilter {
  /** ソースタイプでフィルタ */
  source_type?: EmbeddingSourceType | EmbeddingSourceType[];

  /** 作成日時の範囲 */
  created_at?: {
    from?: ISODateTime;
    to?: ISODateTime;
  };

  /** メタデータでのフィルタ */
  metadata?: Record<string, unknown>;

  /** 類似度閾値の範囲 */
  similarity_threshold?: {
    min?: number;
    max?: number;
  };

  /** アクティブ状態 */
  is_active?: boolean;
}

/**
 * ベクトル検索オプション
 */
export interface VectorSearchOptions {
  /** フィルタ条件 */
  filter?: VectorSearchFilter;

  /** ソート設定 */
  sort?: {
    field: 'similarity' | 'created_at' | 'updated_at';
    order: 'asc' | 'desc';
  };

  /** ページネーション設定 */
  pagination?: {
    offset: number;
    limit: number;
  };

  /** インデックスヒント */
  index_hint?: 'ivfflat' | 'hnsw' | 'auto';
}

/**
 * ベクトル検索パフォーマンス情報
 */
export interface VectorSearchPerformance {
  /** 検索実行時間（ミリ秒） */
  execution_time_ms: number;

  /** 検索されたベクトル数 */
  vectors_scanned: number;

  /** 返された結果数 */
  results_returned: number;

  /** 使用されたインデックス */
  index_used: string | null;

  /** クエリ最適化情報 */
  query_plan?: string;
}

/**
 * ベクトル検索レスポンス
 */
export interface VectorSearchResponse {
  /** 検索結果 */
  results: VectorSearchResult[];

  /** パフォーマンス情報 */
  performance: VectorSearchPerformance;

  /** 総結果数（ページネーション用） */
  total_count?: number;

  /** 次のページが存在するか */
  has_more?: boolean;
}

/**
 * ベクトルインデックス情報
 */
export interface VectorIndexInfo {
  /** インデックス名 */
  name: string;

  /** インデックスタイプ */
  type: 'ivfflat' | 'hnsw';

  /** インデックスサイズ */
  size_bytes: number;

  /** インデックス作成日時 */
  created_at: ISODateTime;

  /** インデックス設定 */
  settings: Record<string, unknown>;
}

/**
 * ベクトルデータベース統計
 */
export interface VectorDatabaseStats {
  /** 総ベクトル数 */
  total_vectors: number;

  /** ユーザー別ベクトル数 */
  vectors_by_user: Record<UUID, number>;

  /** ソースタイプ別ベクトル数 */
  vectors_by_source: Record<EmbeddingSourceType, number>;

  /** インデックス情報 */
  indexes: VectorIndexInfo[];

  /** データベースサイズ */
  database_size_bytes: number;

  /** 最終更新日時 */
  last_updated: ISODateTime;
}
