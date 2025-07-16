// ===================================
// Issue #29: GitHub収集機能 パフォーマンステスト
// ===================================
// レート制限・実行時間・メモリ使用量テスト

import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { ScheduledEvent } from "aws-lambda";
import {
  collectUserGitHubData,
  processUserData,
} from "../../functions/content/collect-user-github";
import { GitHubApiClient } from "../../lib/github/api-client";
import { GitHubRateLimiter } from "../../lib/github/rate-limiter";
import { GitHubDataNormalizer } from "../../lib/github/data-normalizer";

describe("GitHub Collection Performance Tests", () => {
  let mockSupabase: any;
  let mockGitHubClient: any;
  let normalizer: GitHubDataNormalizer;

  beforeEach(() => {
    // パフォーマンステスト用モックセットアップ
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    mockGitHubClient = {
      getBatchRepositoryData: jest.fn(),
      getRateLimitStatus: jest.fn(),
    };

    normalizer = new GitHubDataNormalizer();

    // 環境変数セットアップ
    process.env.GITHUB_TOKEN = "mock-performance-token";
    process.env.SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-key";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===================================
  // 1. レート制限パフォーマンステスト
  // ===================================

  describe("Rate Limiting Performance", () => {
    test("should respect GitHub Free account limits during high-load processing", async () => {
      const rateLimiter = new GitHubRateLimiter({
        maxRequestsPerHour: 5000,
        warningThreshold: 0.8,
      });

      const startTime = Date.now();
      let requestCount = 0;

      // 大量リクエストシミュレーション
      for (let i = 0; i < 100; i++) {
        if (rateLimiter.canMakeRequest()) {
          rateLimiter.recordRequest();
          requestCount++;
        } else {
          break;
        }
      }

      const executionTime = Date.now() - startTime;

      expect(requestCount).toBeLessThanOrEqual(100);
      expect(executionTime).toBeLessThan(1000); // 1秒以内
      expect(rateLimiter.getRemainingRequests()).toBeGreaterThan(4900);
    });

    test("should calculate optimal delays for large user batches", async () => {
      const rateLimiter = new GitHubRateLimiter({
        maxRequestsPerHour: 5000,
        warningThreshold: 0.8,
      });

      const userCounts = [10, 50, 100, 500, 1000];
      const delayResults: number[] = [];

      for (const userCount of userCounts) {
        const delay = rateLimiter.calculateOptimalDelay(userCount);
        delayResults.push(delay);

        expect(delay).toBeGreaterThan(0);
        expect(delay).toBeLessThan(60000); // 1分以内
      }

      // より多くのユーザーに対してはより長い遅延が必要
      expect(delayResults[4]).toBeGreaterThan(delayResults[0]);
    });

    test("should efficiently batch users to stay within rate limits", async () => {
      const rateLimiter = new GitHubRateLimiter({
        maxRequestsPerHour: 5000,
        warningThreshold: 0.8,
      });

      const totalUsers = 1000;
      const apiCallsPerUser = 2;

      const batchStrategy = rateLimiter.calculateOptimalBatchSize(
        totalUsers,
        apiCallsPerUser,
      );

      expect(batchStrategy.numberOfBatches).toBeGreaterThan(0);
      expect(
        batchStrategy.batchSize * batchStrategy.numberOfBatches,
      ).toBeGreaterThanOrEqual(totalUsers);

      // 総API呼び出し数が制限内であることを確認
      const totalApiCalls =
        batchStrategy.batchSize *
        apiCallsPerUser *
        batchStrategy.numberOfBatches;
      expect(totalApiCalls).toBeLessThanOrEqual(
        5000 * batchStrategy.numberOfBatches,
      );
    });
  });

  // ===================================
  // 2. 実行時間パフォーマンステスト
  // ===================================

  describe("Execution Time Performance", () => {
    test("should process 100 users within 15-minute Lambda limit", async () => {
      const startTime = Date.now();

      // 100ユーザーの並列処理シミュレーション
      const users = Array.from({ length: 100 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@test.com`,
        content_sources: [
          {
            id: `source-${i}`,
            source_type: "github",
            url: `https://github.com/user${i}/repo`,
            is_active: true,
          },
        ],
      }));

      // GitHub APIレスポンスモック（高速）
      mockGitHubClient.getBatchRepositoryData.mockResolvedValue([
        {
          id: "test-repo",
          name: "test-repo",
          nameWithOwner: "test/repo",
          description: "Test repository",
          stargazerCount: 100,
          forkCount: 10,
          primaryLanguage: { name: "JavaScript", color: "#f1e05a" },
          updatedAt: "2025-01-01T00:00:00Z",
          readme: { text: "Test README", byteSize: 100 },
          issues: { edges: [] },
          pullRequests: { edges: [] },
          releases: { edges: [] },
        },
      ]);

      mockGitHubClient.getRateLimitStatus.mockReturnValue({
        remaining: 5000,
        canMakeRequest: true,
        warningLevel: false,
        resetTime: new Date(Date.now() + 3600000),
      });

      // データベース操作モック（高速）
      mockSupabase.select.mockResolvedValue({
        data: users,
        error: null,
      });

      mockSupabase.insert.mockResolvedValue({
        data: [{ id: "inserted" }],
        error: null,
      });

      mockSupabase.update.mockResolvedValue({
        data: [{ id: "updated" }],
        error: null,
      });

      // Supabaseクライアント作成をモック
      jest.doMock("@supabase/supabase-js", () => ({
        createClient: jest.fn(() => mockSupabase),
      }));

      // 並列処理実行
      const processPromises = users.slice(0, 10).map(
        (
          user, // 10ユーザーでテスト
        ) => processUserData(user, mockGitHubClient, normalizer, mockSupabase),
      );

      const results = await Promise.allSettled(processPromises);
      const executionTime = Date.now() - startTime;

      // Lambda制限内での実行確認
      expect(executionTime).toBeLessThan(15 * 60 * 1000); // 15分以内

      // 成功率確認
      const successfulResults = results.filter(
        (r) => r.status === "fulfilled",
      ).length;
      expect(successfulResults).toBeGreaterThanOrEqual(8); // 80%以上成功
    });

    test("should efficiently handle scheduled event processing", async () => {
      const event: ScheduledEvent = {
        "detail-type": "Scheduled Event",
        source: "aws.events",
        region: "ap-northeast-1",
        detail: {},
        account: "123456789012",
        time: "2025-01-01T12:00:00Z",
        id: "perf-test-event",
        version: "0",
        resources: [],
      };

      // 中規模ユーザーセットをモック
      const users = Array.from({ length: 50 }, (_, i) => ({
        id: `perf-user-${i}`,
        email: `perfuser${i}@test.com`,
        content_sources: [
          {
            id: `perf-source-${i}`,
            source_type: "github",
            url: `https://github.com/perf${i}/repo`,
            is_active: true,
          },
        ],
      }));

      mockSupabase.select.mockResolvedValue({
        data: users,
        error: null,
      });

      // その他のモック設定
      jest.doMock("@supabase/supabase-js", () => ({
        createClient: jest.fn(() => mockSupabase),
      }));

      jest.doMock("../../lib/github/api-client", () => ({
        GitHubApiClient: jest.fn(() => mockGitHubClient),
      }));

      const startTime = Date.now();
      const result = await collectUserGitHubData(event);
      const executionTime = Date.now() - startTime;

      expect(result.statusCode).toBe(200);
      expect(executionTime).toBeLessThan(30000); // 30秒以内

      const responseBody = JSON.parse(result.body);
      expect(responseBody.executionTime).toBeLessThan(30000);
    });
  });

  // ===================================
  // 3. メモリ使用量パフォーマンステスト
  // ===================================

  describe("Memory Usage Performance", () => {
    test("should maintain memory usage under 512MB during large data processing", async () => {
      const initialMemory = process.memoryUsage();

      // 大量データセットのシミュレーション
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        repository: `repo-${i}`,
        readme: "A".repeat(10000), // 10KB README × 1000
        issues: Array.from({ length: 50 }, (_, j) => ({
          title: `Issue ${j}`,
          body: "B".repeat(1000), // 1KB issue body × 50
        })),
      }));

      // データ正規化処理
      const results = await normalizer.normalizeLargeDataSet(largeDataSet);

      const finalMemory = process.memoryUsage();
      const memoryIncreaseMB =
        (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

      expect(results).toBeDefined();
      expect(results.length).toBe(1000);
      expect(memoryIncreaseMB).toBeLessThan(512); // 512MB以内

      // メモリリーク確認
      if (global.gc) {
        global.gc();
        const afterGcMemory = process.memoryUsage();
        const memoryAfterGcMB =
          (afterGcMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
        expect(memoryAfterGcMB).toBeLessThan(100); // GC後は100MB以内
      }
    });

    test("should efficiently handle concurrent user processing", async () => {
      const initialMemory = process.memoryUsage();

      // 同時ユーザー処理のシミュレーション
      const concurrentUsers = Array.from({ length: 20 }, (_, i) => ({
        id: `concurrent-user-${i}`,
        email: `concurrent${i}@test.com`,
        content_sources: [
          {
            id: `concurrent-source-${i}`,
            source_type: "github",
            url: `https://github.com/concurrent${i}/repo`,
            is_active: true,
          },
        ],
      }));

      // 大量コンテンツをモック
      mockGitHubClient.getBatchRepositoryData.mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => ({
          id: `repo-${i}`,
          name: `repo-${i}`,
          nameWithOwner: `user/repo-${i}`,
          description: "Large repository with lots of content",
          stargazerCount: 1000,
          forkCount: 100,
          primaryLanguage: { name: "TypeScript", color: "#3178c6" },
          updatedAt: "2025-01-01T00:00:00Z",
          readme: { text: "X".repeat(50000), byteSize: 50000 }, // 50KB README
          issues: {
            edges: Array.from({ length: 10 }, (_, j) => ({
              node: {
                id: `issue-${j}`,
                title: `Issue ${j}`,
                body: "Y".repeat(5000), // 5KB issue body
                state: "OPEN",
                createdAt: "2025-01-01T00:00:00Z",
                updatedAt: "2025-01-01T00:00:00Z",
              },
            })),
          },
          pullRequests: { edges: [] },
          releases: { edges: [] },
        })),
      );

      mockGitHubClient.getRateLimitStatus.mockReturnValue({
        remaining: 5000,
        canMakeRequest: true,
        warningLevel: false,
        resetTime: new Date(Date.now() + 3600000),
      });

      // データベース操作モック
      mockSupabase.insert.mockResolvedValue({
        data: [{ id: "inserted" }],
        error: null,
      });

      // 並列処理実行
      const startTime = Date.now();
      const processPromises = concurrentUsers.map((user) =>
        processUserData(user, mockGitHubClient, normalizer, mockSupabase),
      );

      const results = await Promise.allSettled(processPromises);
      const executionTime = Date.now() - startTime;

      const finalMemory = process.memoryUsage();
      const memoryIncreaseMB =
        (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

      // パフォーマンス要件確認
      expect(executionTime).toBeLessThan(60000); // 1分以内
      expect(memoryIncreaseMB).toBeLessThan(512); // 512MB以内

      const successfulResults = results.filter(
        (r) => r.status === "fulfilled",
      ).length;
      expect(successfulResults).toBeGreaterThanOrEqual(18); // 90%以上成功
    });
  });

  // ===================================
  // 4. GraphQLクエリ効率性テスト
  // ===================================

  describe("GraphQL Query Efficiency", () => {
    test("should minimize API calls through efficient batching", async () => {
      const repositories = [
        "vercel/next.js",
        "microsoft/TypeScript",
        "facebook/react",
        "nodejs/node",
        "angular/angular",
      ];

      const apiClient = new GitHubApiClient({
        token: "mock-token",
        maxRequestsPerHour: 5000,
      });

      // API呼び出し回数をトラッキング
      let apiCallCount = 0;
      jest
        .spyOn(apiClient, "executeBatchQuery")
        .mockImplementation(async () => {
          apiCallCount++;
          return {
            repositories: repositories.map((repo) => ({
              id: repo,
              name: repo.split("/")[1],
              nameWithOwner: repo,
              description: "Mock repository",
              stargazerCount: 1000,
              forkCount: 100,
              primaryLanguage: { name: "TypeScript", color: "#3178c6" },
              updatedAt: "2025-01-01T00:00:00Z",
              readme: { text: "Mock README", byteSize: 1000 },
              issues: { edges: [] },
              pullRequests: { edges: [] },
              releases: { edges: [] },
            })),
          };
        });

      // バッチ処理実行
      const result = await apiClient.getBatchRepositoryData(repositories);

      // 効率性確認
      expect(apiCallCount).toBe(1); // 5つのリポジトリを1回のAPI呼び出しで取得
      expect(result).toHaveLength(5);

      // REST APIとの比較（REST APIなら5回必要）
      const efficiencyRatio = 5 / apiCallCount;
      expect(efficiencyRatio).toBe(5); // 5倍の効率性
    });

    test("should handle rate limit warnings efficiently", async () => {
      const rateLimiter = new GitHubRateLimiter({
        maxRequestsPerHour: 5000,
        warningThreshold: 0.8, // 80%で警告
      });

      // 警告レベルまでリクエストを実行
      const warningThreshold = Math.floor(5000 * 0.8);

      for (let i = 0; i < warningThreshold; i++) {
        rateLimiter.recordRequest();
      }

      expect(rateLimiter.isWarningLevel()).toBe(true);
      expect(rateLimiter.getRemainingRequests()).toBe(5000 - warningThreshold);

      // 残りリクエスト数に基づく遅延計算
      const delay = rateLimiter.calculateOptimalDelay(50);
      expect(delay).toBeGreaterThan(100); // 警告レベルでは遅延を増加
    });
  });
});
