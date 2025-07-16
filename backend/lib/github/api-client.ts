// ===================================
// Issue #29: GitHub API クライアント - TDD Green Phase
// ===================================
// GitHub Free アカウント対応・GraphQL最適化・レート制限統合

import { Octokit } from "@octokit/rest";
import { graphql } from "@octokit/graphql";
import {
  GitHubApiConfig,
  defaultGitHubConfig,
  GitHubGraphQLQueries,
  GitHubApiError,
  GitHubApiErrorCode,
  validateGitHubConfig,
} from "../../config/github-api";
import { GitHubRateLimiter } from "./rate-limiter";

export interface GitHubRepositoryData {
  id: string;
  name: string;
  nameWithOwner: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: {
    name: string;
    color: string;
  } | null;
  updatedAt: string;
  readme?: {
    text: string;
    byteSize: number;
  };
  issues: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        body: string;
        state: string;
        createdAt: string;
        updatedAt: string;
      };
    }>;
  };
  pullRequests: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        body: string;
        state: string;
        createdAt: string;
        updatedAt: string;
      };
    }>;
  };
  releases: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        description: string;
        tagName: string;
        createdAt: string;
      };
    }>;
  };
}

export interface GitHubApiResponse<T = any> {
  data: T;
  rateLimit: {
    remaining: number;
    resetAt: string;
    cost: number;
  };
}

export class GitHubApiClient {
  private octokit: Octokit;
  private graphqlClient: typeof graphql;
  private rateLimiter: GitHubRateLimiter;
  private config: GitHubApiConfig;

  constructor(config: Partial<GitHubApiConfig> = {}) {
    // 設定のマージとバリデーション
    this.config = { ...defaultGitHubConfig, ...config };

    const validationErrors = validateGitHubConfig(this.config);
    if (validationErrors.length > 0) {
      throw new GitHubApiError(
        GitHubApiErrorCode.AUTHENTICATION_FAILED,
        `GitHub API configuration error: ${validationErrors.join(", ")}`,
      );
    }

    // Octokitクライアント初期化
    this.octokit = new Octokit({
      auth: this.config.token,
      userAgent: this.config.userAgent,
      timeZone: "Asia/Tokyo",
      request: {
        timeout: this.config.requestTimeout,
      },
    });

    // GraphQLクライアント初期化
    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${this.config.token}`,
        "user-agent": this.config.userAgent,
      },
    });

    // レート制限管理
    this.rateLimiter = new GitHubRateLimiter({
      maxRequestsPerHour: this.config.maxRequestsPerHour,
      warningThreshold: this.config.warningThreshold,
    });
  }

  /**
   * GraphQL バッチクエリ実行
   */
  async executeBatchQuery<T = any>(
    query: string,
    variables: Record<string, any> = {},
  ): Promise<T> {
    // レート制限チェック
    if (!this.rateLimiter.canMakeRequest()) {
      const resetTime = this.rateLimiter.getResetTime();
      throw new GitHubApiError(
        GitHubApiErrorCode.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded. Reset at: ${resetTime.toISOString()}`,
        429,
        {
          remaining: this.rateLimiter.getRemainingRequests(),
          resetAt: resetTime.toISOString(),
        },
      );
    }

    try {
      // レート制限記録
      this.rateLimiter.recordRequest();

      // GraphQLクエリ実行（リトライ付き）
      const result = (await this.executeWithRetry(async () => {
        return await this.graphqlClient(query, variables);
      })) as any;

      // レート制限情報の更新
      if (result?.rateLimit) {
        this.rateLimiter.updateFromResponse({
          remaining: result.rateLimit.remaining,
          resetAt: new Date(result.rateLimit.resetAt),
        });
      }

      return result as T;
    } catch (error: any) {
      // GitHub APIエラーの分類とハンドリング
      throw this.handleApiError(error);
    }
  }

  /**
   * リポジトリデータのバッチ取得
   */
  async getBatchRepositoryData(
    repositories: string[],
    since?: Date,
    itemsPerQuery: number = this.config.defaultItemsPerQuery,
  ): Promise<GitHubRepositoryData[]> {
    // リポジトリ名をGitHub Node IDに変換（実際の実装では別途取得が必要）
    const repoIds = await this.getRepositoryNodeIds(repositories);

    if (repoIds.length === 0) {
      return [];
    }

    const variables = {
      repos: repoIds,
      itemsPerQuery,
      since: since?.toISOString() || null,
    };

    const response = await this.executeBatchQuery(
      GitHubGraphQLQueries.batchRepositoryData,
      variables,
    );

    return ((response as any)?.repositories || []) as GitHubRepositoryData[];
  }

  /**
   * トレンドリポジトリ取得
   */
  async getTrendingRepositories(
    language?: string,
    timeframe: "day" | "week" | "month" = "week",
    limit: number = 10,
  ): Promise<GitHubRepositoryData[]> {
    const query = this.buildTrendingQuery(language, timeframe);

    const response = await this.executeBatchQuery(
      GitHubGraphQLQueries.trendingRepositories,
      { query, first: limit },
    );

    return ((response as any)?.search?.edges?.map((edge: any) => edge.node) ||
      []) as GitHubRepositoryData[];
  }

  /**
   * リポジトリ存在確認
   */
  async checkRepositoryExists(owner: string, name: string): Promise<boolean> {
    try {
      const response = await this.executeBatchQuery(
        GitHubGraphQLQueries.checkRepositoryExists,
        { owner, name },
      );

      return !!(response as any).repository;
    } catch (error: any) {
      if (error.code === GitHubApiErrorCode.REPOSITORY_NOT_FOUND) {
        return false;
      }
      throw error;
    }
  }

  /**
   * 現在のレート制限情報取得
   */
  async getRateLimitInfo(): Promise<{
    limit: number;
    remaining: number;
    resetAt: Date;
    used: number;
  }> {
    const response = await this.executeBatchQuery(
      GitHubGraphQLQueries.rateLimitInfo,
    );

    const rateLimitData = (response as any).rateLimit;
    return {
      limit: rateLimitData.limit,
      remaining: rateLimitData.remaining,
      resetAt: new Date(rateLimitData.resetAt),
      used: rateLimitData.used,
    };
  }

  /**
   * 差分収集対応のリポジトリ取得
   */
  async getRepositoryChangesSince(
    owner: string,
    name: string,
    since: Date,
  ): Promise<{
    hasChanges: boolean;
    lastModified: Date;
    newContent: any[];
  }> {
    // リポジトリの最新更新時間を確認
    const repoInfo = await this.octokit.rest.repos.get({
      owner,
      repo: name,
    });

    const lastModified = new Date(repoInfo.data.updated_at);
    const hasChanges = lastModified > since;

    if (!hasChanges) {
      return {
        hasChanges: false,
        lastModified,
        newContent: [],
      };
    }

    // 変更がある場合は詳細データを取得
    const repositoryData = await this.getBatchRepositoryData(
      [`${owner}/${name}`],
      since,
    );

    return {
      hasChanges: true,
      lastModified,
      newContent: repositoryData,
    };
  }

  /**
   * レート制限状況の取得
   */
  getRateLimitStatus(): {
    remaining: number;
    resetTime: Date;
    canMakeRequest: boolean;
    warningLevel: boolean;
  } {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      resetTime: this.rateLimiter.getResetTime(),
      canMakeRequest: this.rateLimiter.canMakeRequest(),
      warningLevel: this.rateLimiter.isWarningLevel(),
    };
  }

  // ===================================
  // プライベートメソッド
  // ===================================

  /**
   * リポジトリ名からNode ID取得（簡略実装）
   */
  private async getRepositoryNodeIds(
    repositories: string[],
  ): Promise<string[]> {
    // 実際の実装では、リポジトリ名からNode IDを取得する必要がある
    // ここでは簡略化のため、リポジトリ名をそのまま返す
    return repositories.filter((repo) => repo.includes("/"));
  }

  /**
   * トレンド検索クエリ構築
   */
  private buildTrendingQuery(
    language?: string,
    timeframe: "day" | "week" | "month" = "week",
  ): string {
    const date = new Date();
    const daysAgo = { day: 1, week: 7, month: 30 }[timeframe];

    date.setDate(date.getDate() - daysAgo);
    const sinceDate = date.toISOString().split("T")[0];

    let query = `created:>${sinceDate} sort:stars-desc`;

    if (language) {
      query += ` language:${language}`;
    }

    return query;
  }

  /**
   * リトライ機能付きAPI実行
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    attempt: number = 1,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      // リトライ可能なエラーかチェック
      const shouldRetry = this.shouldRetry(error);

      if (shouldRetry && attempt < this.config.maxRetries) {
        const delay = this.calculateBackoffDelay(attempt);

        console.warn(
          `GitHub API request failed (attempt ${attempt}), retrying in ${delay}ms:`,
          error.message,
        );

        await this.sleep(delay);
        return this.executeWithRetry(operation, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * エラーがリトライ可能かチェック
   */
  private shouldRetry(error: unknown): boolean {
    // ネットワークエラー
    const networkErrors = [
      "ECONNRESET",
      "ETIMEDOUT",
      "ENOTFOUND",
      "ECONNREFUSED",
    ];
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      networkErrors.some((code) => (error as { code: string }).code === code)
    ) {
      return true;
    }

    // 一時的なサーバーエラー
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof (error as { status: number }).status === "number"
    ) {
      const status = (error as { status: number }).status;
      if (status >= 500 && status < 600) {
        return true;
      }
    }

    // レート制限（429）は別途ハンドリング
    return false;
  }

  /**
   * 指数バックオフ遅延計算
   */
  private calculateBackoffDelay(attempt: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // ランダムジッター

    return Math.min(exponentialDelay + jitter, this.config.maxDelay);
  }

  /**
   * GitHub APIエラーハンドリング
   */
  private handleApiError(error: any): GitHubApiError {
    // 認証エラー
    if (error.status === 401) {
      return new GitHubApiError(
        GitHubApiErrorCode.AUTHENTICATION_FAILED,
        "GitHub API authentication failed. Check your token.",
        401,
      );
    }

    // レート制限エラー
    if (error.status === 429) {
      const resetAt = error.response?.headers?.["x-ratelimit-reset"];
      const remaining = error.response?.headers?.["x-ratelimit-remaining"];

      return new GitHubApiError(
        GitHubApiErrorCode.RATE_LIMIT_EXCEEDED,
        "GitHub API rate limit exceeded",
        429,
        {
          remaining: parseInt(remaining || "0"),
          resetAt: resetAt
            ? new Date(parseInt(resetAt) * 1000).toISOString()
            : new Date().toISOString(),
        },
      );
    }

    // リポジトリ未発見
    if (error.status === 404) {
      return new GitHubApiError(
        GitHubApiErrorCode.REPOSITORY_NOT_FOUND,
        "Repository not found or access denied",
        404,
      );
    }

    // GraphQLエラー
    if (error.errors && Array.isArray(error.errors)) {
      return new GitHubApiError(
        GitHubApiErrorCode.INVALID_QUERY,
        `GraphQL error: ${error.errors.map((e: any) => e.message).join(", ")}`,
      );
    }

    // ネットワークエラー
    const networkErrors = [
      "ECONNRESET",
      "ETIMEDOUT",
      "ENOTFOUND",
      "ECONNREFUSED",
    ];
    if (networkErrors.some((code) => error.code === code)) {
      return new GitHubApiError(
        GitHubApiErrorCode.NETWORK_ERROR,
        `Network error: ${error.message}`,
      );
    }

    // その他のエラー
    return new GitHubApiError(
      GitHubApiErrorCode.UNKNOWN_ERROR,
      `Unexpected GitHub API error: ${error.message}`,
      error.status,
    );
  }

  /**
   * スリープユーティリティ
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
