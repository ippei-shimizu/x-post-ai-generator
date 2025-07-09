/**
 * Issue #21: ユーザー固有検索関数 - フロントエンドサービス
 *
 * search_user_content PostgreSQL関数との統合サービス
 * 型安全性とエラーハンドリングを提供
 */

import { supabase } from '@/lib/supabase';
import type {
  SearchUserContentParams,
  SearchUserContentResult,
  SearchUserContentResponse,
} from '@/types/search-user-content';
import {
  isValidSearchUserContentParams,
  formatTimestampForPostgres,
  SEARCH_USER_CONTENT_CONSTRAINTS,
} from '@/types/search-user-content';

/**
 * search_user_content関数を呼び出すメインサービス関数
 */
export async function searchUserContent(
  params: SearchUserContentParams
): Promise<SearchUserContentResponse> {
  const startTime = performance.now();

  try {
    // パラメータバリデーション
    if (!isValidSearchUserContentParams(params)) {
      throw new Error('Invalid search parameters provided');
    }

    // 現在認証されているユーザーIDを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User authentication required');
    }

    // ユーザーIDの一致確認（セキュリティチェック）
    if (user.id !== params.target_user_id) {
      throw new Error('Access denied: Cannot search other user content');
    }

    // PostgreSQL関数呼び出し
    const { data, error } = await supabase.rpc('search_user_content', {
      target_user_id: params.target_user_id,
      query_vector: params.query_vector,
      search_similarity_threshold:
        params.search_similarity_threshold ||
        SEARCH_USER_CONTENT_CONSTRAINTS.SIMILARITY_THRESHOLD.DEFAULT,
      match_count:
        params.match_count ||
        SEARCH_USER_CONTENT_CONSTRAINTS.MATCH_COUNT.DEFAULT,
      start_date: params.start_date || null,
      end_date: params.end_date || null,
      source_type_filter: params.source_type_filter || null,
      active_only: params.active_only !== undefined ? params.active_only : true,
    });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // パフォーマンス警告
    if (
      executionTime >
      SEARCH_USER_CONTENT_CONSTRAINTS.PERFORMANCE.WARNING_THRESHOLD_MS
    ) {
      console.warn(
        `search_user_content performance warning: Query took ${executionTime.toFixed(2)}ms ` +
          `(> ${SEARCH_USER_CONTENT_CONSTRAINTS.PERFORMANCE.WARNING_THRESHOLD_MS}ms)`
      );
    }

    // 正常レスポンス構築
    const response: SearchUserContentResponse = {
      results: data || [],
      execution_time_ms: executionTime,
      total_count: data?.length || 0,
    };

    return response;
  } catch (error) {
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // エラーレスポンス構築
    const errorResponse: SearchUserContentResponse = {
      results: [],
      execution_time_ms: executionTime,
      total_count: 0,
      error: {
        code: error instanceof Error ? error.constructor.name : 'UnknownError',
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
        ...(error instanceof Error && error.stack
          ? { details: error.stack }
          : {}),
      },
    };

    // エラーログ
    console.error('search_user_content error:', {
      params,
      error: errorResponse.error,
      executionTime,
    });

    return errorResponse;
  }
}

/**
 * シンプルなテキスト検索（埋め込み生成 + 検索を一括実行）
 */
export async function searchUserContentByText(
  userId: string,
  searchText: string,
  options?: Partial<
    Omit<SearchUserContentParams, 'target_user_id' | 'query_vector'>
  >
): Promise<SearchUserContentResponse> {
  try {
    // テキストを埋め込みベクトルに変換
    // 注: 実際の実装では OpenAI Embeddings API を呼び出す
    // ここでは仮の実装として、テキストハッシュベースのベクトルを生成
    const queryVector = await generateTextEmbedding(searchText);

    // 検索実行
    const searchParams: SearchUserContentParams = {
      target_user_id: userId,
      query_vector: queryVector,
      ...options,
    };

    return await searchUserContent(searchParams);
  } catch (error) {
    return {
      results: [],
      total_count: 0,
      error: {
        code: 'TextSearchError',
        message: error instanceof Error ? error.message : 'Text search failed',
      },
    };
  }
}

/**
 * 複数トピックによる並列検索
 */
export async function searchUserContentByTopics(
  userId: string,
  topics: string[],
  options?: Partial<
    Omit<SearchUserContentParams, 'target_user_id' | 'query_vector'>
  >
): Promise<SearchUserContentResponse[]> {
  try {
    // 並列で複数トピックを検索
    const searchPromises = topics.map(topic =>
      searchUserContentByText(userId, topic, options)
    );

    const results = await Promise.all(searchPromises);
    return results;
  } catch (error) {
    console.error('Multi-topic search error:', error);
    return topics.map(() => ({
      results: [],
      total_count: 0,
      error: {
        code: 'MultiTopicSearchError',
        message: 'Failed to search multiple topics',
      },
    }));
  }
}

/**
 * 日付範囲によるフィルタリング検索
 */
export async function searchUserContentByDateRange(
  userId: string,
  searchText: string,
  startDate: Date,
  endDate: Date,
  options?: Partial<
    Omit<
      SearchUserContentParams,
      'target_user_id' | 'query_vector' | 'start_date' | 'end_date'
    >
  >
): Promise<SearchUserContentResponse> {
  return await searchUserContentByText(userId, searchText, {
    ...options,
    start_date: formatTimestampForPostgres(startDate),
    end_date: formatTimestampForPostgres(endDate),
  });
}

/**
 * ソースタイプ別検索
 */
export async function searchUserContentBySourceType(
  userId: string,
  searchText: string,
  sourceType: NonNullable<SearchUserContentParams['source_type_filter']>,
  options?: Partial<
    Omit<
      SearchUserContentParams,
      'target_user_id' | 'query_vector' | 'source_type_filter'
    >
  >
): Promise<SearchUserContentResponse> {
  return await searchUserContentByText(userId, searchText, {
    ...options,
    source_type_filter: sourceType,
  });
}

/**
 * 高精度検索（高い類似度閾値）
 */
export async function searchUserContentHighPrecision(
  userId: string,
  searchText: string,
  options?: Partial<
    Omit<
      SearchUserContentParams,
      'target_user_id' | 'query_vector' | 'search_similarity_threshold'
    >
  >
): Promise<SearchUserContentResponse> {
  return await searchUserContentByText(userId, searchText, {
    ...options,
    search_similarity_threshold: 0.85, // 高い閾値
  });
}

/**
 * 幅広い検索（低い類似度閾値）
 */
export async function searchUserContentBroad(
  userId: string,
  searchText: string,
  options?: Partial<
    Omit<
      SearchUserContentParams,
      'target_user_id' | 'query_vector' | 'search_similarity_threshold'
    >
  >
): Promise<SearchUserContentResponse> {
  return await searchUserContentByText(userId, searchText, {
    ...options,
    search_similarity_threshold: 0.5, // 低い閾値
  });
}

// ========================================
// ヘルパー関数
// ========================================

/**
 * テキストを埋め込みベクトルに変換
 * 注: 実際の実装では OpenAI Embeddings API を使用
 */
async function generateTextEmbedding(text: string): Promise<number[]> {
  try {
    // TODO: OpenAI Embeddings API 統合
    // const response = await openai.embeddings.create({
    //   model: "text-embedding-ada-002",
    //   input: text,
    // });
    // return response.data[0].embedding;

    // 仮実装: テキストハッシュベースの疑似ベクトル
    const hash = simpleHash(text);
    const vector = Array.from(
      { length: SEARCH_USER_CONTENT_CONSTRAINTS.VECTOR_DIMENSIONS },
      (_, i) => {
        return Math.sin(hash + i) * 0.5; // -0.5 から 0.5 の範囲
      }
    );

    return vector;
  } catch (error) {
    throw new Error(
      `Failed to generate text embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 文字列の簡単なハッシュ生成（疑似ベクトル用）
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return hash;
}

/**
 * 検索結果の重複除去
 */
export function deduplicateSearchResults(
  results: SearchUserContentResult[]
): SearchUserContentResult[] {
  const seen = new Set<string>();
  return results.filter(result => {
    if (seen.has(result.id)) {
      return false;
    }
    seen.add(result.id);
    return true;
  });
}

/**
 * 検索結果のマージ（複数検索の結果統合）
 */
export function mergeSearchResults(
  responses: SearchUserContentResponse[]
): SearchUserContentResponse {
  const allResults = responses.flatMap(response => response.results);
  const deduplicatedResults = deduplicateSearchResults(allResults);

  const totalExecutionTime = responses.reduce(
    (sum, response) => sum + (response.execution_time_ms || 0),
    0
  );

  const errors = responses
    .filter(response => response.error)
    .map(response => response.error!);

  return {
    results: deduplicatedResults,
    execution_time_ms: totalExecutionTime,
    total_count: deduplicatedResults.length,
    ...(errors.length > 0
      ? {
          error: {
            code: 'MultipleErrors',
            message: `${errors.length} errors occurred during search`,
            details: JSON.stringify(errors),
          },
        }
      : {}),
  };
}

/**
 * 検索パフォーマンス統計の取得
 */
export interface SearchPerformanceStats {
  averageExecutionTime: number;
  maxExecutionTime: number;
  minExecutionTime: number;
  totalSearches: number;
  successRate: number;
}

const performanceHistory: number[] = [];
const errorHistory: boolean[] = [];

export function updatePerformanceStats(
  executionTime: number,
  hasError: boolean
): void {
  performanceHistory.push(executionTime);
  errorHistory.push(hasError);

  // 履歴サイズ制限
  if (performanceHistory.length > 100) {
    performanceHistory.shift();
    errorHistory.shift();
  }
}

export function getSearchPerformanceStats(): SearchPerformanceStats {
  if (performanceHistory.length === 0) {
    return {
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: 0,
      totalSearches: 0,
      successRate: 0,
    };
  }

  const successCount = errorHistory.filter(hasError => !hasError).length;

  return {
    averageExecutionTime:
      performanceHistory.reduce((sum, time) => sum + time, 0) /
      performanceHistory.length,
    maxExecutionTime: Math.max(...performanceHistory),
    minExecutionTime: Math.min(...performanceHistory),
    totalSearches: performanceHistory.length,
    successRate: successCount / errorHistory.length,
  };
}
