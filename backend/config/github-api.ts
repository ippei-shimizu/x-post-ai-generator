// ===================================
// Issue #29: GitHub API 設定
// ===================================
// GitHub Free アカウント対応・レート制限・GraphQL最適化設定

export interface GitHubApiConfig {
  // 認証設定
  token: string;
  userAgent: string;

  // レート制限設定（GitHub Free アカウント）
  maxRequestsPerHour: number;
  warningThreshold: number;

  // GraphQL設定
  graphqlEndpoint: string;
  maxBatchSize: number;

  // リトライ設定
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;

  // タイムアウト設定
  requestTimeout: number;

  // データ収集設定
  defaultItemsPerQuery: number;
  maxContentLength: number;
}

// GitHub Free アカウント用のデフォルト設定
export const defaultGitHubConfig: GitHubApiConfig = {
  // 認証
  token: process.env.GITHUB_TOKEN || "",
  userAgent: "x-post-ai-generator/1.0",

  // GitHub Free制限: 認証済み 5,000リクエスト/時間
  maxRequestsPerHour: 5000,
  warningThreshold: 0.8, // 80%で警告

  // GraphQL
  graphqlEndpoint: "https://api.github.com/graphql",
  maxBatchSize: 10, // 1クエリで最大10リポジトリ

  // リトライ
  maxRetries: 3,
  baseDelay: 1000, // 1秒
  maxDelay: 30000, // 30秒

  // タイムアウト
  requestTimeout: 30000, // 30秒

  // データ収集
  defaultItemsPerQuery: 10, // Issues/PRs等の取得数
  maxContentLength: 50000, // 50KB制限
};

// GraphQLクエリテンプレート
export const GitHubGraphQLQueries = {
  // バッチリポジトリ情報取得
  batchRepositoryData: `
    query BatchRepositoryData($repos: [String!]!) {
      rateLimit {
        remaining
        resetAt
        cost
      }
      repositories: nodes(ids: $repos) {
        ... on Repository {
          id
          name
          nameWithOwner
          description
          stargazerCount
          forkCount
          primaryLanguage {
            name
            color
          }
          updatedAt
          pushedAt
          createdAt
          
          # README取得
          readme: object(expression: "HEAD:README.md") {
            ... on Blob {
              text
              byteSize
            }
          }
          
          # 最新Issues (差分収集対応)
          issues(
            first: $itemsPerQuery
            orderBy: {field: UPDATED_AT, direction: DESC}
            filterBy: {since: $since}
            states: [OPEN, CLOSED]
          ) {
            edges {
              node {
                id
                title
                body
                state
                createdAt
                updatedAt
                author {
                  login
                }
                labels(first: 5) {
                  edges {
                    node {
                      name
                      color
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
          
          # 最新Pull Requests (差分収集対応)
          pullRequests(
            first: $itemsPerQuery
            orderBy: {field: UPDATED_AT, direction: DESC}
            baseRefName: "main"
            states: [OPEN, CLOSED, MERGED]
          ) {
            edges {
              node {
                id
                title
                body
                state
                createdAt
                updatedAt
                mergedAt
                author {
                  login
                }
                mergeable
                additions
                deletions
              }
            }
          }
          
          # 最新リリース
          releases(
            first: 5
            orderBy: {field: CREATED_AT, direction: DESC}
          ) {
            edges {
              node {
                id
                name
                description
                tagName
                createdAt
                publishedAt
                isPrerelease
                url
              }
            }
          }
          
          # 最新コミット
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: $itemsPerQuery, since: $since) {
                  edges {
                    node {
                      id
                      message
                      messageHeadline
                      committedDate
                      author {
                        name
                        email
                        date
                      }
                      additions
                      deletions
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `,

  // トレンド情報取得（検索API使用）
  trendingRepositories: `
    query TrendingRepositories($query: String!, $first: Int!) {
      search(query: $query, type: REPOSITORY, first: $first) {
        repositoryCount
        edges {
          node {
            ... on Repository {
              id
              name
              nameWithOwner
              description
              stargazerCount
              forkCount
              primaryLanguage {
                name
              }
              createdAt
              pushedAt
              
              readme: object(expression: "HEAD:README.md") {
                ... on Blob {
                  text(truncateAt: 5000)
                }
              }
            }
          }
        }
      }
      rateLimit {
        remaining
        resetAt
      }
    }
  `,

  // リポジトリ存在確認（軽量クエリ）
  checkRepositoryExists: `
    query CheckRepository($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        id
        name
        nameWithOwner
        updatedAt
        isPrivate
        isArchived
      }
      rateLimit {
        remaining
        resetAt
      }
    }
  `,

  // レート制限情報のみ取得
  rateLimitInfo: `
    query RateLimitInfo {
      rateLimit {
        limit
        remaining
        resetAt
        used
      }
    }
  `,
};

// トレンド検索クエリの生成
export const buildTrendingQuery = (
  language?: string,
  timeframe: "day" | "week" | "month" = "week",
): string => {
  const date = new Date();

  // 期間に応じた日付計算
  const daysAgo = {
    day: 1,
    week: 7,
    month: 30,
  }[timeframe];

  date.setDate(date.getDate() - daysAgo);
  const sinceDate = date.toISOString().split("T")[0];

  let query = `created:>${sinceDate} sort:stars-desc`;

  if (language) {
    query += ` language:${language}`;
  }

  return query;
};

// API使用量計算ユーティリティ
export const calculateApiUsage = (
  usersCount: number,
  repositoriesPerUser: number = 5,
  includesTrending: boolean = true,
): {
  totalApiCalls: number;
  dailyUsage: number;
  monthlyUsage: number;
  isWithinFreeLimit: boolean;
} => {
  // GraphQL効率化: 5つのRESTコールを1つのGraphQLクエリに集約
  const apiCallsPerUser =
    Math.ceil(repositoriesPerUser / 10) + (includesTrending ? 1 : 0);

  const totalApiCalls = usersCount * apiCallsPerUser;
  const dailyUsage = totalApiCalls; // 24時間ごと
  const monthlyUsage = dailyUsage * 30;

  // GitHub Free: 5,000リクエスト/時間 = 120,000/日 = 3,600,000/月
  const isWithinFreeLimit = monthlyUsage <= 3600000;

  return {
    totalApiCalls,
    dailyUsage,
    monthlyUsage,
    isWithinFreeLimit,
  };
};

// エラーコード定義
export enum GitHubApiErrorCode {
  AUTHENTICATION_FAILED = "GITHUB_AUTH_FAILED",
  RATE_LIMIT_EXCEEDED = "GITHUB_RATE_LIMIT",
  REPOSITORY_NOT_FOUND = "GITHUB_REPO_NOT_FOUND",
  NETWORK_ERROR = "GITHUB_NETWORK_ERROR",
  INVALID_QUERY = "GITHUB_INVALID_QUERY",
  TIMEOUT = "GITHUB_TIMEOUT",
  UNKNOWN_ERROR = "GITHUB_UNKNOWN_ERROR",
}

// GitHub API エラークラス
export class GitHubApiError extends Error {
  constructor(
    public code: GitHubApiErrorCode,
    message: string,
    public statusCode?: number,
    public rateLimitInfo?: {
      remaining: number;
      resetAt: string;
    },
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

// 設定バリデーション
export const validateGitHubConfig = (
  config: Partial<GitHubApiConfig>,
): string[] => {
  const errors: string[] = [];

  if (!config.token) {
    errors.push("GITHUB_TOKEN is required");
  }

  if (config.maxRequestsPerHour && config.maxRequestsPerHour <= 0) {
    errors.push("maxRequestsPerHour must be positive");
  }

  if (
    config.warningThreshold &&
    (config.warningThreshold <= 0 || config.warningThreshold > 1)
  ) {
    errors.push("warningThreshold must be between 0 and 1");
  }

  if (config.maxBatchSize && config.maxBatchSize <= 0) {
    errors.push("maxBatchSize must be positive");
  }

  return errors;
};
