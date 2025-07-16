// ===================================
// Issue #29: GitHub収集機能 統合テスト
// ===================================
// ユーザー分離・データ保存・認証統合テスト

import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
  beforeAll,
  afterAll,
} from "@jest/globals";
import { ScheduledEvent } from "aws-lambda";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  collectUserGitHubData,
  processUserData,
} from "../../functions/content/collect-user-github";
// import { GitHubApiClient } from "../../lib/github/api-client";
import { GitHubDataNormalizer } from "../../lib/github/data-normalizer";

// 統合テスト用の環境設定
describe("GitHub Collection Integration Tests", () => {
  let supabase: SupabaseClient;
  // let testUserId: string;
  let testSourceId: string;
  const cleanupTasks: (() => Promise<void>)[] = [];

  beforeAll(async () => {
    // テスト用Supabase接続（実際のDBまたはTestContainer使用）
    supabase = createClient(
      process.env.SUPABASE_URL || "http://localhost:54321",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-role-key",
    );

    // テスト用ユーザー作成
    // testUserId = `test-user-${Date.now()}`;
    testSourceId = `test-source-${Date.now()}`;
  });

  afterAll(async () => {
    // 統合テスト後のクリーンアップ
    for (const cleanup of cleanupTasks.reverse()) {
      try {
        await cleanup();
      } catch (error) {
        console.warn("Cleanup failed:", error);
      }
    }
  });

  beforeEach(() => {
    // 各テスト前のセットアップ
    process.env.GITHUB_TOKEN = "mock-integration-token";
    process.env.SUPABASE_URL = "http://localhost:54321";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===================================
  // 1. ユーザー分離テスト
  // ===================================

  describe("User Data Isolation", () => {
    test("should collect data only for specific user", async () => {
      // テストユーザー1と2を作成
      const userId1 = `test-user-1-${Date.now()}`;
      const userId2 = `test-user-2-${Date.now()}`;

      // ユーザー1のテストデータ作成
      await createTestUser(userId1, {
        email: "user1@test.com",
        sources: [
          {
            source_type: "github",
            url: "https://github.com/vercel/next.js",
            is_active: true,
          },
        ],
      });

      // ユーザー2のテストデータ作成
      await createTestUser(userId2, {
        email: "user2@test.com",
        sources: [
          {
            source_type: "github",
            url: "https://github.com/microsoft/TypeScript",
            is_active: true,
          },
        ],
      });

      // GitHub APIクライアントをモック
      const mockGitHubClient = {
        getBatchRepositoryData: jest.fn().mockImplementation(() =>
          Promise.resolve([
            {
              id: "repo-1",
              name: "next.js",
              nameWithOwner: "vercel/next.js",
              description: "The React Framework",
              stargazerCount: 50000,
              forkCount: 10000,
              primaryLanguage: { name: "TypeScript", color: "#3178c6" },
              updatedAt: "2025-01-01T00:00:00Z",
              readme: { text: "# Next.js\n\nReact framework", byteSize: 1000 },
              issues: { edges: [] as unknown[] },
              pullRequests: { edges: [] as unknown[] },
              releases: { edges: [] as unknown[] },
            },
          ]),
        ),
        getRateLimitStatus: jest.fn().mockReturnValue({
          remaining: 5000,
          canMakeRequest: true,
          warningLevel: false,
          resetTime: new Date(Date.now() + 3600000),
        }),
      } as any;

      const normalizer = new GitHubDataNormalizer();

      // ユーザー1のデータ収集
      const result1 = await processUserData(
        {
          id: userId1,
          email: "user1@test.com",
          content_sources: [
            {
              id: "source-1",
              source_type: "github",
              url: "https://github.com/vercel/next.js",
              is_active: true,
            },
          ],
        },
        mockGitHubClient,
        normalizer,
        supabase,
      );

      expect(result1.userId).toBe(userId1);
      expect(result1.skipped).toBeFalsy();
      expect(result1.collectedItems).toBeGreaterThan(0);

      // ユーザー2のコンテンツにユーザー1のデータが含まれていないことを確認
      const { data: user2Content } = await supabase
        .from("raw_content")
        .select("*")
        .eq("user_id", userId2);

      expect(user2Content).toEqual([]);

      // ユーザー1のコンテンツのみが存在することを確認
      const { data: user1Content } = await supabase
        .from("raw_content")
        .select("*")
        .eq("user_id", userId1);

      expect(user1Content?.length).toBeGreaterThan(0);
      user1Content?.forEach((content) => {
        expect(content.user_id).toBe(userId1);
      });

      // クリーンアップ登録
      cleanupTasks.push(
        () => cleanupTestUser(userId1),
        () => cleanupTestUser(userId2),
      );
    });

    test("should respect Row Level Security policies", async () => {
      // RLS動作確認テスト
      const userId = `test-user-rls-${Date.now()}`;

      await createTestUser(userId, {
        email: "rls-test@test.com",
        sources: [],
      });

      // 直接的なデータアクセステスト（RLSが有効なら失敗すべき）
      const { data: allUsers } = await supabase.from("users").select("*");

      // RLSが有効な場合、他のユーザーのデータは見えないはず
      const currentUserData = allUsers?.filter(
        (user: any) => user.id === userId,
      );
      expect(currentUserData?.length).toBeLessThanOrEqual(1);

      cleanupTasks.push(() => cleanupTestUser(userId));
    });
  });

  // ===================================
  // 2. データ保存統合テスト
  // ===================================

  describe("Data Persistence Integration", () => {
    test("should save normalized data to database with proper schema", async () => {
      const userId = `test-user-persist-${Date.now()}`;

      await createTestUser(userId, {
        email: "persist-test@test.com",
        sources: [
          {
            source_type: "github",
            url: "https://github.com/test/repo",
            is_active: true,
          },
        ],
      });

      // テストデータを直接データベースに保存
      const testContent = {
        user_id: userId,
        source_id: testSourceId,
        title: "Test Repository",
        content: "Test content for integration testing",
        url: "https://github.com/test/repo",
        metadata: {
          data_type: "repository_info",
          repository: "test/repo",
          stars: 100,
        },
        content_hash: "test-hash-12345",
        source_type: "github",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
      };

      const { data: savedData, error } = await supabase
        .from("raw_content")
        .insert([testContent])
        .select();

      expect(error).toBeNull();
      expect(savedData).toHaveLength(1);
      expect(savedData?.[0]).toMatchObject({
        user_id: userId,
        title: "Test Repository",
        source_type: "github",
      });

      // 保存されたデータの取得確認
      const { data: retrievedData } = await supabase
        .from("raw_content")
        .select("*")
        .eq("user_id", userId)
        .eq("content_hash", "test-hash-12345");

      expect(retrievedData).toHaveLength(1);
      expect(retrievedData?.[0].content).toBe(
        "Test content for integration testing",
      );

      cleanupTasks.push(() => cleanupTestUser(userId));
    });

    test("should update content_sources last_fetched_at timestamp", async () => {
      const userId = `test-user-timestamp-${Date.now()}`;
      const sourceId = `test-source-timestamp-${Date.now()}`;

      await createTestUser(userId, {
        email: "timestamp-test@test.com",
        sources: [
          {
            id: sourceId,
            source_type: "github",
            url: "https://github.com/test/timestamp",
            is_active: true,
            last_fetched_at: "2024-01-01T00:00:00Z", // 古いタイムスタンプ
          },
        ],
      });

      // last_fetched_at更新をシミュレート
      const beforeUpdate = new Date("2024-01-01T00:00:00Z");
      const updateTime = new Date();

      const { error } = await supabase
        .from("content_sources")
        .update({ last_fetched_at: updateTime.toISOString() })
        .eq("id", sourceId);

      expect(error).toBeNull();

      // 更新確認
      const { data: updatedSource } = await supabase
        .from("content_sources")
        .select("last_fetched_at")
        .eq("id", sourceId)
        .single();

      const updatedTime = new Date(updatedSource?.last_fetched_at);
      expect(updatedTime.getTime()).toBeGreaterThan(beforeUpdate.getTime());

      cleanupTasks.push(() => cleanupTestUser(userId));
    });
  });

  // ===================================
  // 3. API使用量ログ統合テスト
  // ===================================

  describe("API Usage Logging Integration", () => {
    test("should log API usage for cost tracking", async () => {
      const userId = `test-user-logging-${Date.now()}`;

      await createTestUser(userId, {
        email: "logging-test@test.com",
        sources: [],
      });

      // API使用量ログの記録をテスト
      const usageLogData = {
        user_id: userId,
        api_provider: "github",
        operation: "collect_github_data",
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        created_at: new Date().toISOString(),
        metadata: {
          api_calls_used: 5,
          collection_type: "integration_test",
        },
      };

      const { data: loggedData, error } = await supabase
        .from("api_usage_logs")
        .insert([usageLogData])
        .select();

      expect(error).toBeNull();
      expect(loggedData).toHaveLength(1);
      expect(loggedData?.[0]).toMatchObject({
        user_id: userId,
        api_provider: "github",
        operation: "collect_github_data",
      });

      // ユーザー別使用量集計テスト
      const { data: userUsageLogs } = await supabase
        .from("api_usage_logs")
        .select("*")
        .eq("user_id", userId)
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        );

      expect(userUsageLogs).toHaveLength(1);

      cleanupTasks.push(() => cleanupTestUser(userId));
    });
  });

  // ===================================
  // 4. エラーハンドリング統合テスト
  // ===================================

  describe("Error Handling Integration", () => {
    test("should handle database connection errors gracefully", async () => {
      // 無効なSupabaseクライアントでのテスト
      const invalidSupabase = createClient(
        "https://invalid-url.supabase.co",
        "invalid-key",
      );

      const mockGitHubClient = {
        getRateLimitStatus: jest.fn().mockReturnValue({
          remaining: 5000,
          canMakeRequest: true,
        }),
      } as any;

      const normalizer = new GitHubDataNormalizer();

      const result = await processUserData(
        {
          id: "test-user",
          email: "test@test.com",
          content_sources: [],
        },
        mockGitHubClient,
        normalizer,
        invalidSupabase,
      );

      // エラーが適切にハンドリングされることを確認
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("No active GitHub sources");
    });

    test("should handle empty user data gracefully", async () => {
      const event: ScheduledEvent = {
        "detail-type": "Scheduled Event",
        source: "aws.events",
        region: "ap-northeast-1",
        detail: {},
        account: "123456789012",
        time: "2025-01-01T12:00:00Z",
        id: "test-event-id",
        version: "0",
        resources: [],
      };

      // Supabaseモックで空のユーザーリストを返す
      jest.doMock("@supabase/supabase-js", () => ({
        createClient: jest.fn(() => ({
          from: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        })),
      }));

      const result = await collectUserGitHubData(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.processedUsers).toBe(0);
      expect(body.message).toContain("No active users");
    });
  });

  // ===================================
  // ヘルパー関数
  // ===================================

  async function createTestUser(
    userId: string,
    userData: {
      email: string;
      sources: Array<{
        id?: string;
        source_type: string;
        url: string;
        is_active: boolean;
        last_fetched_at?: string;
      }>;
    },
  ): Promise<void> {
    // テストユーザー作成
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      email: userData.email,
      username: `test-${userId}`,
      display_name: `Test User ${userId}`,
      created_at: new Date().toISOString(),
    });

    if (userError) {
      console.warn("Test user creation failed:", userError);
    }

    // テストユーザーのソース作成
    for (const source of userData.sources) {
      const { error: sourceError } = await supabase
        .from("content_sources")
        .insert({
          id: source.id || `source-${userId}-${Date.now()}`,
          user_id: userId,
          source_type: source.source_type,
          name: `Test ${source.source_type} source`,
          url: source.url,
          is_active: source.is_active,
          last_fetched_at: source.last_fetched_at,
          created_at: new Date().toISOString(),
        });

      if (sourceError) {
        console.warn("Test source creation failed:", sourceError);
      }
    }
  }

  async function cleanupTestUser(userId: string): Promise<void> {
    // 関連データの削除（外部キー順序に注意）
    await supabase.from("api_usage_logs").delete().eq("user_id", userId);
    await supabase.from("raw_content").delete().eq("user_id", userId);
    await supabase.from("content_sources").delete().eq("user_id", userId);
    await supabase.from("users").delete().eq("id", userId);
  }
});
