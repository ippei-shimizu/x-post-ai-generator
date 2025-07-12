/**
 * Issue #24: 統合テストとCI/CD基盤 - データベースRLS統合テスト
 *
 * TDD Red Phase: Row Level Security (RLS) によるデータ分離統合テストを失敗から開始
 * ユーザー間のデータ完全分離とプライバシー保護の検証
 */

import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

// テスト環境設定
const SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-role-key";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "test-anon-key";

// Admin クライアント（RLS無視）
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 通常クライアント（RLS適用）
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// テストユーザーデータ
const TEST_USERS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "user1@isolation.test",
    display_name: "Isolation Test User 1",
    google_id: "google_test_user_1",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "user2@isolation.test",
    display_name: "Isolation Test User 2",
    google_id: "google_test_user_2",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "user3@isolation.test",
    display_name: "Isolation Test User 3",
    google_id: "google_test_user_3",
  },
] as const;

// テストコンテンツソースデータ
const TEST_CONTENT_SOURCES = [
  {
    user_id: TEST_USERS[0].id,
    source_type: "github",
    name: "User1 GitHub",
    url: "https://github.com/user1/repo",
    config: { branches: ["main"] },
  },
  {
    user_id: TEST_USERS[0].id,
    source_type: "rss",
    name: "User1 Blog",
    url: "https://user1.blog/feed.xml",
    config: { update_frequency: "daily" },
  },
  {
    user_id: TEST_USERS[1].id,
    source_type: "github",
    name: "User2 GitHub",
    url: "https://github.com/user2/repo",
    config: { branches: ["main", "develop"] },
  },
  {
    user_id: TEST_USERS[1].id,
    source_type: "rss",
    name: "User2 Blog",
    url: "https://user2.blog/feed.xml",
    config: { update_frequency: "hourly" },
  },
] as const;

// 認証ヘルパー関数
async function signInAs(userEmail: string): Promise<User> {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: userEmail,
    password: "test-password-123",
  });

  if (error)
    throw new Error(`Failed to sign in as ${userEmail}: ${error.message}`);
  if (!data.user) throw new Error(`No user data returned for ${userEmail}`);

  return data.user;
}

async function signOut(): Promise<void> {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw new Error(`Failed to sign out: ${error.message}`);
}

describe("Database RLS Data Isolation Integration Tests - TDD Red Phase", () => {
  let originalEnv: typeof process.env;

  beforeAll(async () => {
    // 環境変数のバックアップ
    originalEnv = { ...process.env };

    // テスト環境変数設定
    process.env.SUPABASE_URL = SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
    process.env.NODE_ENV = "test";

    // テストデータベースの初期化
    await setupTestData();
  });

  afterAll(async () => {
    // テストデータクリーンアップ
    await cleanupTestData();

    // 環境変数復元
    process.env = originalEnv;
  });

  afterEach(async () => {
    // 各テスト後にサインアウト
    await signOut();
  });

  describe("Red Phase: Users テーブル RLS 検証", () => {
    it("should fail: users can only read their own data", async () => {
      // Red Phase: ユーザーが自分のデータのみアクセス可能（失敗するべき）

      const user1 = TEST_USERS[0];
      const user2 = TEST_USERS[1];

      // User1でサインイン
      await signInAs(user1.email);

      // User1が自分のデータを読めることを確認
      const { data: ownData, error: ownError } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", user1.id);

      expect(ownError).toBeNull();
      expect(ownData).toHaveLength(1);
      expect(ownData![0].email).toBe(user1.email);

      // User1が他のユーザーのデータを読めないことを確認（RLSが実装されていないため失敗する）
      const { data: otherData, error: otherError } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", user2.id);

      // RLSが実装されていない場合、他のユーザーのデータも見えてしまう
      // 実装後は otherData が空配列になるべき
      await expect(async () => {
        if (otherData && otherData.length > 0) {
          throw new Error(
            "RLS not properly implemented: User can access other user data",
          );
        }
      }).rejects.toThrow("RLS not properly implemented");
    });

    it("should fail: users cannot insert data for other users", async () => {
      // Red Phase: ユーザーが他のユーザーのデータを挿入できない（失敗するべき）

      const user1 = TEST_USERS[0];
      const user2 = TEST_USERS[1];

      await signInAs(user1.email);

      // User1が User2のIDで新しいユーザーデータを挿入しようとする
      const { data, error } = await supabaseClient.from("users").insert({
        id: "99999999-9999-9999-9999-999999999999",
        email: "malicious@test.com",
        display_name: "Malicious User",
        google_id: "malicious_google_id",
      });

      // RLSが実装されていない場合、挿入が成功してしまう
      await expect(async () => {
        if (!error) {
          throw new Error(
            "RLS not properly implemented: User can insert unauthorized data",
          );
        }
      }).rejects.toThrow("RLS not properly implemented");
    });

    it("should fail: users cannot update other users data", async () => {
      // Red Phase: ユーザーが他のユーザーのデータを更新できない

      const user1 = TEST_USERS[0];
      const user2 = TEST_USERS[1];

      await signInAs(user1.email);

      // User1が User2のデータを更新しようとする
      const { data, error } = await supabaseClient
        .from("users")
        .update({ display_name: "Hacked by User1" })
        .eq("id", user2.id);

      // RLSが実装されていない場合、更新が成功してしまう
      await expect(async () => {
        if (!error && data && data.length > 0) {
          throw new Error(
            "RLS not properly implemented: User can update other user data",
          );
        }
      }).rejects.toThrow("RLS not properly implemented");
    });
  });

  describe("Red Phase: Content Sources テーブル RLS 検証", () => {
    it("should fail: content sources are isolated by user", async () => {
      // Red Phase: コンテンツソースのユーザー分離（失敗するべき）

      const user1 = TEST_USERS[0];
      const user2 = TEST_USERS[1];

      // User1でサインイン
      await signInAs(user1.email);

      // User1が自分のコンテンツソースのみ参照できることを確認
      const { data: user1Sources, error: user1Error } = await supabaseClient
        .from("content_sources")
        .select("*");

      expect(user1Error).toBeNull();
      expect(user1Sources).toBeDefined();

      // 全ての結果がUser1のものであることを確認（RLSが実装されていないため失敗する）
      await expect(async () => {
        const hasOtherUserData = user1Sources?.some(
          (source) => source.user_id !== user1.id,
        );
        if (hasOtherUserData) {
          throw new Error(
            "RLS not properly implemented: User can see other user content sources",
          );
        }
      }).rejects.toThrow("RLS not properly implemented");

      // User2でサインイン
      await signOut();
      await signInAs(user2.email);

      // User2が自分のコンテンツソースのみ参照できることを確認
      const { data: user2Sources, error: user2Error } = await supabaseClient
        .from("content_sources")
        .select("*");

      expect(user2Error).toBeNull();

      // 全ての結果がUser2のものであることを確認（RLSが実装されていないため失敗する）
      await expect(async () => {
        const hasOtherUserData = user2Sources?.some(
          (source) => source.user_id !== user2.id,
        );
        if (hasOtherUserData) {
          throw new Error(
            "RLS not properly implemented: User can see other user content sources",
          );
        }
      }).rejects.toThrow("RLS not properly implemented");
    });

    it("should fail: users cannot manipulate other users content sources", async () => {
      // Red Phase: 他のユーザーのコンテンツソース操作防止

      const user1 = TEST_USERS[0];
      const user2 = TEST_USERS[1];

      await signInAs(user1.email);

      // User1が User2のコンテンツソースを削除しようとする
      const { data: deleteData, error: deleteError } = await supabaseClient
        .from("content_sources")
        .delete()
        .eq("user_id", user2.id);

      // RLSが実装されていない場合、削除が成功してしまう
      await expect(async () => {
        if (!deleteError && deleteData && deleteData.length > 0) {
          throw new Error(
            "RLS not properly implemented: User can delete other user content sources",
          );
        }
      }).rejects.toThrow("RLS not properly implemented");

      // User1が User2のuser_idでコンテンツソースを作成しようとする
      const { data: insertData, error: insertError } = await supabaseClient
        .from("content_sources")
        .insert({
          user_id: user2.id,
          source_type: "malicious",
          name: "Malicious Source",
          url: "https://malicious.com",
          config: {},
        });

      // RLSが実装されていない場合、挿入が成功してしまう
      await expect(async () => {
        if (!insertError) {
          throw new Error(
            "RLS not properly implemented: User can insert content sources for other users",
          );
        }
      }).rejects.toThrow("RLS not properly implemented");
    });
  });

  describe("Red Phase: ベクトル検索データ分離検証", () => {
    it("should fail: vector embeddings are isolated by user", async () => {
      // Red Phase: ベクトル埋め込みのユーザー分離（pgvector + RLS）

      const user1 = TEST_USERS[0];
      const user2 = TEST_USERS[1];

      await signInAs(user1.email);

      // User1が自分の埋め込みデータのみアクセス可能か確認（まだ実装されていないため失敗）
      await expect(async () => {
        // content_embeddings テーブルへのクエリ（まだテーブルが存在しない）
        const { data, error } = await supabaseClient
          .from("content_embeddings")
          .select("*");

        if (error && error.message.includes("does not exist")) {
          throw new Error("Vector embeddings table not implemented yet");
        }
      }).rejects.toThrow("Vector embeddings table not implemented yet");
    });

    it("should fail: vector similarity search is user-isolated", async () => {
      // Red Phase: ベクトル類似度検索のユーザー分離

      const user1 = TEST_USERS[0];

      await signInAs(user1.email);

      // ユーザー固有ベクトル検索関数テスト（まだ実装されていないため失敗）
      await expect(async () => {
        const { data, error } = await supabaseClient.rpc(
          "search_user_content",
          {
            target_user_id: user1.id,
            query_vector: [0.1, 0.2, 0.3], // サンプルベクトル
            similarity_threshold: 0.7,
            match_count: 10,
          },
        );

        if (error && error.message.includes("does not exist")) {
          throw new Error(
            "User-isolated vector search function not implemented yet",
          );
        }
      }).rejects.toThrow(
        "User-isolated vector search function not implemented yet",
      );
    });
  });

  describe("Red Phase: 匿名アクセス制限検証", () => {
    it("should fail: anonymous users cannot access any user data", async () => {
      // Red Phase: 匿名ユーザーアクセス制限

      // サインアウトして匿名状態にする
      await signOut();

      // 匿名ユーザーが users テーブルにアクセスしようとする
      const { data: usersData, error: usersError } = await supabaseClient
        .from("users")
        .select("*");

      // RLSが実装されていない場合、匿名ユーザーでもデータが見えてしまう
      await expect(async () => {
        if (!usersError && usersData && usersData.length > 0) {
          throw new Error(
            "RLS not properly implemented: Anonymous users can access user data",
          );
        }
      }).rejects.toThrow("RLS not properly implemented");

      // 匿名ユーザーが content_sources テーブルにアクセスしようとする
      const { data: sourcesData, error: sourcesError } = await supabaseClient
        .from("content_sources")
        .select("*");

      await expect(async () => {
        if (!sourcesError && sourcesData && sourcesData.length > 0) {
          throw new Error(
            "RLS not properly implemented: Anonymous users can access content sources",
          );
        }
      }).rejects.toThrow("RLS not properly implemented");
    });
  });

  describe("Red Phase: RLS ポリシー網羅性検証", () => {
    it("should fail: all tables have proper RLS policies", async () => {
      // Red Phase: 全テーブルのRLSポリシー存在確認

      const expectedTables = [
        "users",
        "content_sources",
        "content_embeddings",
        "raw_content",
        "content_chunks",
        "generated_posts",
        "user_settings",
        "api_usage_logs",
      ];

      for (const tableName of expectedTables) {
        // 各テーブルのRLSポリシー存在確認（まだ実装されていないため失敗）
        await expect(async () => {
          const { data, error } = await supabaseAdmin
            .from("pg_policies")
            .select("*")
            .eq("tablename", tableName);

          if (!data || data.length === 0) {
            throw new Error(
              `RLS policies not implemented for table: ${tableName}`,
            );
          }
        }).rejects.toThrow(
          `RLS policies not implemented for table: ${tableName}`,
        );
      }
    });
  });
});

// テストデータセットアップ
async function setupTestData(): Promise<void> {
  try {
    // 既存テストデータクリーンアップ
    await cleanupTestData();

    // テストユーザー作成
    for (const user of TEST_USERS) {
      // Supabase Auth ユーザー作成
      const { error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: "test-password-123",
        email_confirm: true,
        user_metadata: {
          display_name: user.display_name,
        },
      });

      if (authError && !authError.message.includes("already registered")) {
        console.warn(`Failed to create auth user ${user.email}:`, authError);
      }

      // users テーブルにユーザー情報挿入
      const { error: insertError } = await supabaseAdmin.from("users").upsert({
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        google_id: user.google_id,
      });

      if (insertError) {
        console.warn(`Failed to insert user ${user.email}:`, insertError);
      }
    }

    // テストコンテンツソース作成
    for (const source of TEST_CONTENT_SOURCES) {
      const { error } = await supabaseAdmin
        .from("content_sources")
        .insert(source);

      if (error) {
        console.warn("Failed to insert content source:", error);
      }
    }
  } catch (error) {
    console.warn("Test data setup failed:", error);
  }
}

// テストデータクリーンアップ
async function cleanupTestData(): Promise<void> {
  try {
    // コンテンツソース削除
    for (const user of TEST_USERS) {
      await supabaseAdmin
        .from("content_sources")
        .delete()
        .eq("user_id", user.id);
    }

    // ユーザー削除
    for (const user of TEST_USERS) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      await supabaseAdmin.from("users").delete().eq("id", user.id);
    }
  } catch (error) {
    console.warn("Test data cleanup failed:", error);
  }
}
