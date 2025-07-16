// ===================================
// Issue #29: ユーザー別GitHub API収集Lambda - TDD Green Phase
// ===================================
// 24時間ごと・GitHub Free アカウント・GraphQL最適化対応

import { ScheduledEvent } from "aws-lambda";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { GitHubApiClient } from "../../lib/github/api-client";
import {
  GitHubDataNormalizer,
  NormalizedContent,
} from "../../lib/github/data-normalizer";

// 環境変数の型定義
interface EnvironmentConfig {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GITHUB_TOKEN: string;
}

// ユーザーデータの型定義
interface UserData {
  id: string;
  email: string;
  content_sources: Array<{
    id: string;
    source_type: string;
    url: string;
    is_active: boolean;
    last_fetched_at?: string;
    config?: Record<string, unknown>;
  }>;
}

// 処理結果の型定義
interface ProcessingResult {
  userId: string;
  collectedItems: number;
  apiCallsUsed: number;
  processingTime: number;
  skipped?: boolean;
  reason?: string;
  errors?: string[];
}

// Lambda実行結果の型定義
interface LambdaExecutionResult {
  statusCode: number;
  body: string;
}

/**
 * EventBridge スケジュール実行のメインハンドラー
 */
export const collectUserGitHubData = async (
  event: ScheduledEvent,
): Promise<LambdaExecutionResult> => {
  const startTime = Date.now();
  console.log("GitHub collection started:", JSON.stringify(event, null, 2));

  try {
    // 環境変数チェック
    const config = validateEnvironment();

    // Supabase初期化
    const supabase = createClient(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY,
    );

    // GitHub API クライアント初期化
    const githubClient = new GitHubApiClient({
      token: config.GITHUB_TOKEN,
      maxRequestsPerHour: 5000, // GitHub Free
    });

    // データ正規化クライアント初期化
    const normalizer = new GitHubDataNormalizer();

    // アクティブユーザーの取得
    const users = await getActiveUsers(supabase);
    console.log(`Found ${users.length} active users with GitHub sources`);

    if (users.length === 0) {
      return createSuccessResponse({
        message: "No active users with GitHub sources found",
        processedUsers: 0,
        totalApiCalls: 0,
        executionTime: Date.now() - startTime,
      });
    }

    // レート制限チェック
    const rateLimitStatus = githubClient.getRateLimitStatus();
    console.log("Rate limit status:", rateLimitStatus);

    // バッチサイズ計算
    const estimatedApiCallsPerUser = 2; // 平均値
    const { batchSize, numberOfBatches, delayBetweenBatches } =
      calculateBatchStrategy(
        users.length,
        estimatedApiCallsPerUser,
        rateLimitStatus.remaining,
      );

    console.log(
      `Processing strategy: ${numberOfBatches} batches of ${batchSize} users each`,
    );

    // バッチ処理実行
    const allResults: ProcessingResult[] = [];
    let totalApiCalls = 0;

    for (let batchIndex = 0; batchIndex < numberOfBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, users.length);
      const batchUsers = users.slice(batchStart, batchEnd);

      console.log(
        `Processing batch ${batchIndex + 1}/${numberOfBatches} (${batchUsers.length} users)`,
      );

      // バッチ内ユーザーの並列処理
      const batchPromises = batchUsers.map((user) =>
        processUserData(user, githubClient, normalizer, supabase),
      );

      const batchResults = await Promise.allSettled(batchPromises);

      // 結果の集計
      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          allResults.push(result.value);
          totalApiCalls += result.value.apiCallsUsed;
        } else {
          console.error("User processing failed:", result.reason);
          allResults.push({
            userId: "unknown",
            collectedItems: 0,
            apiCallsUsed: 0,
            processingTime: 0,
            skipped: true,
            reason: "Processing failed",
            errors: [
              result.reason instanceof Error
                ? result.reason.message
                : "Unknown error",
            ],
          });
        }
      }

      // バッチ間の遅延
      if (batchIndex < numberOfBatches - 1 && delayBetweenBatches > 0) {
        console.log(`Waiting ${delayBetweenBatches}ms before next batch`);
        await sleep(delayBetweenBatches);
      }
    }

    // 実行統計
    const executionTime = Date.now() - startTime;
    const successfulUsers = allResults.filter((r) => !r.skipped).length;
    const totalItems = allResults.reduce((sum, r) => sum + r.collectedItems, 0);

    console.log(`Collection completed:
      Total users: ${users.length}
      Successful: ${successfulUsers}
      Total items collected: ${totalItems}
      Total API calls: ${totalApiCalls}
      Execution time: ${executionTime}ms
    `);

    return createSuccessResponse({
      message: "GitHub collection completed successfully",
      processedUsers: users.length,
      successfulUsers,
      totalItems,
      totalApiCalls,
      executionTime,
      results: allResults.filter((r) => r.errors?.length), // エラーがあったもののみ
    });
  } catch (error: unknown) {
    console.error("GitHub collection failed:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "GitHub collection failed",
        message: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
      }),
    };
  }
};

/**
 * 単一ユーザーのGitHubデータ処理
 */
export const processUserData = async (
  user: UserData,
  githubClient: GitHubApiClient,
  normalizer: GitHubDataNormalizer,
  supabase: SupabaseClient,
): Promise<ProcessingResult> => {
  const startTime = Date.now();
  const result: ProcessingResult = {
    userId: user.id,
    collectedItems: 0,
    apiCallsUsed: 0,
    processingTime: 0,
  };

  try {
    // GitHubソースのフィルタリング
    const githubSources = user.content_sources.filter(
      (source) => source.source_type === "github" && source.is_active,
    );

    if (githubSources.length === 0) {
      return {
        ...result,
        processingTime: Date.now() - startTime,
        skipped: true,
        reason: "No active GitHub sources",
      };
    }

    // レート制限チェック
    const rateLimitStatus = githubClient.getRateLimitStatus();
    if (!rateLimitStatus.canMakeRequest) {
      return {
        ...result,
        processingTime: Date.now() - startTime,
        skipped: true,
        reason: "Rate limit exceeded",
      };
    }

    const allNormalizedData: NormalizedContent[] = [];
    let apiCallsUsed = 0;

    // 各GitHubソースの処理
    for (const source of githubSources) {
      try {
        const sourceResult = await processGitHubSource(
          user.id,
          source,
          githubClient,
          normalizer,
        );

        allNormalizedData.push(...sourceResult.data);
        apiCallsUsed += sourceResult.apiCalls;
      } catch (error: unknown) {
        console.error(
          `Error processing source ${source.url} for user ${user.id}:`,
          error,
        );
        result.errors = result.errors || [];
        result.errors.push(
          `Source ${source.url}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // データベースへの保存
    if (allNormalizedData.length > 0) {
      await saveCollectedData(supabase, allNormalizedData);

      // ソースの最終取得時間更新
      await updateSourceLastFetched(
        supabase,
        githubSources.map((s) => s.id),
      );
    }

    // API使用量ログ記録
    await logApiUsage(supabase, user.id, apiCallsUsed);

    result.collectedItems = allNormalizedData.length;
    result.apiCallsUsed = apiCallsUsed;
    result.processingTime = Date.now() - startTime;

    return result;
  } catch (error: unknown) {
    console.error(`Error processing user ${user.id}:`, error);

    return {
      ...result,
      processingTime: Date.now() - startTime,
      skipped: true,
      reason: "Processing error",
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
};

/**
 * 差分収集対応のデータ取得
 */
export const collectDifferentialData = async (
  _userId: string,
  repositoryUrl: string,
  lastCollectionTime: Date,
): Promise<{
  hasChanges: boolean;
  newContent: unknown[];
  lastModified: Date;
}> => {
  // URLからowner/repoを抽出
  const match = repositoryUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${repositoryUrl}`);
  }

  const [, owner, repo] = match;

  const config = validateEnvironment();
  const githubClient = new GitHubApiClient({ token: config.GITHUB_TOKEN });

  // 差分収集実行
  const changes = await githubClient.getRepositoryChangesSince(
    owner,
    repo,
    lastCollectionTime,
  );

  return changes;
};

// ===================================
// ヘルパー関数
// ===================================

/**
 * 環境変数の検証
 */
function validateEnvironment(): EnvironmentConfig {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GITHUB_TOKEN",
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  return {
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
  };
}

/**
 * アクティブユーザーの取得
 */
async function getActiveUsers(supabase: SupabaseClient): Promise<UserData[]> {
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id,
      email,
      content_sources!inner (
        id,
        source_type,
        url,
        is_active,
        last_fetched_at,
        config
      )
    `,
    )
    .eq("content_sources.source_type", "github")
    .eq("content_sources.is_active", true);

  if (error) {
    throw new Error(`Failed to fetch active users: ${error.message}`);
  }

  return data || [];
}

/**
 * GitHubソースの処理
 */
async function processGitHubSource(
  userId: string,
  source: UserData["content_sources"][0],
  githubClient: GitHubApiClient,
  normalizer: GitHubDataNormalizer,
): Promise<{
  data: NormalizedContent[];
  apiCalls: number;
}> {
  const initialApiCalls = githubClient.getRateLimitStatus().remaining;

  // URLからリポジトリ情報を抽出
  const repoMatch = source.url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!repoMatch) {
    throw new Error(`Invalid GitHub URL: ${source.url}`);
  }

  const repositoryName = `${repoMatch[1]}/${repoMatch[2]}`;

  // 差分収集の確認
  const lastFetched = source.last_fetched_at
    ? new Date(source.last_fetched_at)
    : null;
  const since = lastFetched || new Date(Date.now() - 24 * 60 * 60 * 1000); // 24時間前

  // リポジトリデータ取得
  const repositoryData = await githubClient.getBatchRepositoryData(
    [repositoryName],
    since,
  );

  // データ正規化
  const normalizedData = await normalizer.normalizeRepositoryData(
    { repositories: repositoryData },
    userId,
    source.id,
  );

  const finalApiCalls = githubClient.getRateLimitStatus().remaining;
  const apiCallsUsed = initialApiCalls - finalApiCalls;

  return {
    data: normalizedData,
    apiCalls: apiCallsUsed,
  };
}

/**
 * 収集データの保存
 */
async function saveCollectedData(
  supabase: SupabaseClient,
  data: NormalizedContent[],
): Promise<void> {
  const { error } = await supabase.from("raw_content").insert(data);

  if (error) {
    throw new Error(`Failed to save collected data: ${error.message}`);
  }
}

/**
 * ソースの最終取得時間更新
 */
async function updateSourceLastFetched(
  supabase: SupabaseClient,
  sourceIds: string[],
): Promise<void> {
  const { error } = await supabase
    .from("content_sources")
    .update({ last_fetched_at: new Date().toISOString() })
    .in("id", sourceIds);

  if (error) {
    console.error("Failed to update source last_fetched_at:", error);
    // 非致命的エラーとして処理継続
  }
}

/**
 * API使用量ログ記録
 */
async function logApiUsage(
  supabase: SupabaseClient,
  userId: string,
  apiCallsUsed: number,
): Promise<void> {
  const { error } = await supabase.from("api_usage_logs").insert({
    user_id: userId,
    api_provider: "github",
    operation: "collect_github_data",
    input_tokens: 0, // GitHub APIはトークン課金なし
    output_tokens: 0,
    cost_usd: 0, // GitHub API無料
    created_at: new Date().toISOString(),
    metadata: {
      api_calls_used: apiCallsUsed,
      collection_type: "daily_scheduled",
    },
  });

  if (error) {
    console.error("Failed to log API usage:", error);
    // 非致命的エラーとして処理継続
  }
}

/**
 * バッチ処理戦略の計算
 */
function calculateBatchStrategy(
  totalUsers: number,
  apiCallsPerUser: number,
  remainingApiCalls: number,
): {
  batchSize: number;
  numberOfBatches: number;
  delayBetweenBatches: number;
} {
  const totalApiCallsNeeded = totalUsers * apiCallsPerUser;

  if (totalApiCallsNeeded <= remainingApiCalls) {
    // 一括処理可能
    return {
      batchSize: totalUsers,
      numberOfBatches: 1,
      delayBetweenBatches: 0,
    };
  }

  // バッチ分割が必要
  const maxUsersPerBatch = Math.floor(remainingApiCalls / apiCallsPerUser);
  const numberOfBatches = Math.ceil(totalUsers / maxUsersPerBatch);

  // Lambda制限15分を考慮した遅延計算
  const maxExecutionTime = 14 * 60 * 1000; // 14分（余裕を持たせる）
  const delayBetweenBatches = Math.floor(
    maxExecutionTime / numberOfBatches / 2,
  );

  return {
    batchSize: maxUsersPerBatch,
    numberOfBatches,
    delayBetweenBatches: Math.max(delayBetweenBatches, 1000), // 最小1秒
  };
}

/**
 * 成功レスポンスの作成
 */
function createSuccessResponse(data: unknown): LambdaExecutionResult {
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
}

/**
 * スリープユーティリティ
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
