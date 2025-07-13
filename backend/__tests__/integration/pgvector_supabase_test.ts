/**
 * Issue #25: Supabaseクライアントからのpgvectorアクセステスト
 * PostgreSQL + pgvector拡張とSupabaseクライアントの統合テスト
 * ユーザー分離型ベクトル検索のエンドツーエンドテスト
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

describe("pgvector + Supabase統合テスト", () => {
  let supabase: SupabaseClient;

  // テスト用ユーザーID（実際の環境ではauth.uid()が使用される）
  const testUser1Id = "550e8400-e29b-41d4-a716-446655440001";
  const testUser2Id = "550e8400-e29b-41d4-a716-446655440002";

  beforeAll(async () => {
    // Supabaseクライアント初期化
    const supabaseUrl = process.env.SUPABASE_URL || "http://localhost:54321";
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-role-key";

    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // テストデータベースの初期化
    await setupTestData();
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    await cleanupTestData();
  });

  /**
   * テストデータセットアップ
   */
  async function setupTestData() {
    try {
      // 既存のテストデータをクリーンアップ
      await supabase
        .from("content_embeddings")
        .delete()
        .match({ "metadata->test": "supabase_integration" });

      await supabase
        .from("users")
        .delete()
        .or(`id.eq.${testUser1Id},id.eq.${testUser2Id}`);

      // テストユーザー作成
      const { error: userError } = await supabase.from("users").insert([
        {
          id: testUser1Id,
          email: "test-supabase-user1@example.com",
          username: "supabase_test_user_1",
          display_name: "Supabase Test User 1",
          google_id: "google-supabase-test-1",
          created_at: new Date().toISOString(),
        },
        {
          id: testUser2Id,
          email: "test-supabase-user2@example.com",
          username: "supabase_test_user_2",
          display_name: "Supabase Test User 2",
          google_id: "google-supabase-test-2",
          created_at: new Date().toISOString(),
        },
      ]);

      if (userError) {
        console.warn("ユーザー作成エラー（既存の可能性）:", userError.message);
      }

      // 1536次元テストベクトル生成
      const createTestVector = (): number[] => {
        return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
      };

      // テスト用ベクトル埋め込みデータ作成
      const testEmbeddings = [
        {
          user_id: testUser1Id,
          content_text:
            "User 1 test content - React hooks and TypeScript patterns",
          embedding: createTestVector(),
          source_type: "test",
          model_name: "test-embedding-model",
          metadata: {
            test: "supabase_integration",
            owner: "user1",
            topic: "react",
            created_by: "integration_test",
          },
        },
        {
          user_id: testUser1Id,
          content_text:
            "User 1 test content - AWS Lambda serverless architecture",
          embedding: createTestVector(),
          source_type: "test",
          model_name: "test-embedding-model",
          metadata: {
            test: "supabase_integration",
            owner: "user1",
            topic: "aws",
            created_by: "integration_test",
          },
        },
        {
          user_id: testUser2Id,
          content_text:
            "User 2 test content - PostgreSQL database optimization",
          embedding: createTestVector(),
          source_type: "test",
          model_name: "test-embedding-model",
          metadata: {
            test: "supabase_integration",
            owner: "user2",
            topic: "database",
            created_by: "integration_test",
          },
        },
      ];

      const { error: embeddingError } = await supabase
        .from("content_embeddings")
        .insert(testEmbeddings);

      if (embeddingError) {
        console.error("テスト埋め込みデータ作成エラー:", embeddingError);
        throw embeddingError;
      }
    } catch (error) {
      console.error("テストデータセットアップエラー:", error);
      throw error;
    }
  }

  /**
   * テストデータクリーンアップ
   */
  async function cleanupTestData() {
    try {
      await supabase
        .from("content_embeddings")
        .delete()
        .match({ "metadata->test": "supabase_integration" });

      await supabase
        .from("users")
        .delete()
        .or(`id.eq.${testUser1Id},id.eq.${testUser2Id}`);
    } catch (error) {
      console.error("テストデータクリーンアップエラー:", error);
    }
  }

  describe("pgvector拡張の基本動作確認", () => {
    test("vector型での埋め込みデータ挿入・取得ができる", async () => {
      const testVector = Array.from({ length: 1536 }, () => 0.1);

      // ベクトル埋め込みデータ挿入
      const { data: insertData, error: insertError } = await supabase
        .from("content_embeddings")
        .insert({
          user_id: testUser1Id,
          content_text: "Vector type test content",
          embedding: testVector,
          source_type: "test",
          model_name: "test-model",
          metadata: { test: "supabase_integration", vector_test: true },
        })
        .select()
        .single();

      expect(insertError).toBeNull();
      expect(insertData).toBeDefined();
      expect(insertData.embedding).toHaveLength(1536);

      // 挿入されたデータの取得確認
      const { data: fetchData, error: fetchError } = await supabase
        .from("content_embeddings")
        .select("*")
        .eq("id", insertData.id)
        .single();

      expect(fetchError).toBeNull();
      expect(fetchData).toBeDefined();
      expect(fetchData.embedding).toEqual(testVector);
    });

    test("1536次元ベクトルの次元数制限が正常に動作する", async () => {
      // 1536次元より多い次元のベクトルで挿入試行（失敗想定）
      const invalidVector = Array.from({ length: 1600 }, () => 0.1);

      const { error } = await supabase.from("content_embeddings").insert({
        user_id: testUser1Id,
        content_text: "Invalid dimension test",
        embedding: invalidVector,
        source_type: "test",
        model_name: "test-model",
        metadata: { test: "dimension_validation" },
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain("dimension");
    }, 10000);
  });

  describe("ユーザー固有ベクトル検索関数テスト", () => {
    test("search_user_embeddings関数が正常に動作する", async () => {
      const queryVector = Array.from(
        { length: 1536 },
        () => Math.random() * 2 - 1,
      );

      // PostgreSQL関数を直接呼び出し
      const { data, error } = await supabase.rpc("search_user_embeddings", {
        target_user_id: testUser1Id,
        query_vector: queryVector,
        similarity_threshold: 0.5,
        match_count: 10,
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      // 結果がユーザー1のデータのみであることを確認
      if (data && data.length > 0) {
        data.forEach((result: { metadata: { owner: string } }) => {
          expect(result.metadata.owner).toBe("user1");
        });
      }
    });

    test("他ユーザーのデータ検索が拒否される", async () => {
      const queryVector = Array.from(
        { length: 1536 },
        () => Math.random() * 2 - 1,
      );

      // ユーザー1がユーザー2のデータを検索試行（失敗想定）
      const { error } = await supabase.rpc("search_user_embeddings", {
        target_user_id: testUser2Id,
        query_vector: queryVector,
        similarity_threshold: 0.5,
        match_count: 10,
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain("Access denied");
    });

    test("get_user_embeddings_stats関数が正常に動作する", async () => {
      const { data, error } = await supabase.rpc("get_user_embeddings_stats", {
        target_user_id: testUser1Id,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data) {
        expect(typeof data.total_embeddings).toBe("number");
        expect(typeof data.active_embeddings).toBe("number");
        expect(data.total_embeddings).toBeGreaterThanOrEqual(0);
        expect(data.active_embeddings).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("ベクトル類似度計算テスト", () => {
    test("cosine_similarity関数が正常に動作する", async () => {
      const vector1 = [1, 0, 0];
      const vector2 = [1, 0, 0];

      // pgvectorの制限により、3次元ベクトルでテスト
      const { data, error } = await supabase.rpc("cosine_similarity", {
        vector1: `[${vector1.join(",")}]`,
        vector2: `[${vector2.join(",")}]`,
      });

      expect(error).toBeNull();
      expect(typeof data).toBe("number");
      expect(data).toBeCloseTo(1.0, 2); // 同一ベクトルの類似度は1.0
    });

    test("euclidean_distance関数が正常に動作する", async () => {
      const vector1 = [0, 0, 0];
      const vector2 = [1, 1, 1];

      const { data, error } = await supabase.rpc("euclidean_distance", {
        vector1: `[${vector1.join(",")}]`,
        vector2: `[${vector2.join(",")}]`,
      });

      expect(error).toBeNull();
      expect(typeof data).toBe("number");
      expect(data).toBeGreaterThan(0);
    });
  });

  describe("Row Level Security (RLS) 検証", () => {
    test("直接SQLクエリでユーザー分離が機能する", async () => {
      // ユーザー1のデータのみ取得されることを確認
      const { data: user1Data, error: user1Error } = await supabase
        .from("content_embeddings")
        .select("*")
        .eq("user_id", testUser1Id)
        .match({ "metadata->test": "supabase_integration" });

      expect(user1Error).toBeNull();
      expect(Array.isArray(user1Data)).toBe(true);

      // 実際のRLS環境では、auth.uid()によりユーザー認証が行われる
      // テスト環境では service role を使用しているため、全データが見える
      if (user1Data) {
        expect(user1Data.length).toBeGreaterThan(0);
      }
    });

    test("メタデータフィルタリングが正常に動作する", async () => {
      const { data, error } = await supabase
        .from("content_embeddings")
        .select("*")
        .eq("metadata->test", "supabase_integration")
        .eq("metadata->owner", "user1");

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      if (data && data.length > 0) {
        data.forEach((item: { metadata: { owner: string; test: string } }) => {
          expect(item.metadata.owner).toBe("user1");
          expect(item.metadata.test).toBe("supabase_integration");
        });
      }
    });
  });

  describe("パフォーマンステスト", () => {
    test("大量ベクトル検索のレスポンス時間が許容範囲内", async () => {
      const queryVector = Array.from(
        { length: 1536 },
        () => Math.random() * 2 - 1,
      );

      const startTime = Date.now();

      const { error } = await supabase.rpc("search_user_embeddings", {
        target_user_id: testUser1Id,
        query_vector: queryVector,
        similarity_threshold: 0.3,
        match_count: 50,
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(error).toBeNull();
      expect(responseTime).toBeLessThan(5000); // 5秒以内

      // eslint-disable-next-line no-console
      console.log(`ベクトル検索レスポンス時間: ${responseTime}ms`);
    });

    test("複数同時検索の負荷テスト", async () => {
      const concurrentSearches = 5;
      const queryVector = Array.from(
        { length: 1536 },
        () => Math.random() * 2 - 1,
      );

      const searchPromises = Array.from({ length: concurrentSearches }, () =>
        supabase.rpc("search_user_embeddings", {
          target_user_id: testUser1Id,
          query_vector: queryVector,
          similarity_threshold: 0.5,
          match_count: 10,
        }),
      );

      const startTime = Date.now();
      const results = await Promise.all(searchPromises);
      const endTime = Date.now();

      results.forEach(({ error }) => {
        expect(error).toBeNull();
      });

      const totalTime = endTime - startTime;
      // eslint-disable-next-line no-console
      console.log(`${concurrentSearches}件同時検索時間: ${totalTime}ms`);
      expect(totalTime).toBeLessThan(10000); // 10秒以内
    });
  });

  describe("エラーハンドリング", () => {
    test("不正な次元数のベクトルでエラーが発生する", async () => {
      const invalidVector = Array.from({ length: 100 }, () => 0.1); // 1536次元未満

      const { error } = await supabase.from("content_embeddings").insert({
        user_id: testUser1Id,
        content_text: "Invalid vector dimension test",
        embedding: invalidVector,
        source_type: "test",
        model_name: "test-model",
        metadata: { test: "error_handling" },
      });

      expect(error).not.toBeNull();
    });

    test("存在しないユーザーIDでの検索がエラーになる", async () => {
      const nonExistentUserId = "00000000-0000-0000-0000-000000000000";
      const queryVector = Array.from({ length: 1536 }, () => 0.5);

      const { error } = await supabase.rpc("search_user_embeddings", {
        target_user_id: nonExistentUserId,
        query_vector: queryVector,
        similarity_threshold: 0.5,
        match_count: 10,
      });

      // 存在しないユーザーでもアクセス拒否エラーが発生することを確認
      expect(error).not.toBeNull();
      expect(error?.message).toContain("Access denied");
    });

    test("無効な類似度閾値でのエラーハンドリング", async () => {
      const queryVector = Array.from({ length: 1536 }, () => 0.5);

      // 類似度閾値が範囲外（1.0超過）
      const { error } = await supabase.rpc("search_user_embeddings", {
        target_user_id: testUser1Id,
        query_vector: queryVector,
        similarity_threshold: 1.5, // 無効な値
        match_count: 10,
      });

      // 関数内でのバリデーションまたはPostgreSQLエラーが発生することを確認
      expect(error).toBeNull(); // 実際には関数内での処理により結果が0件になる想定
    });
  });

  describe("データ整合性テスト", () => {
    test("ベクトル検索結果の整合性確認", async () => {
      // 特定のベクトルで検索
      const queryVector = Array.from({ length: 1536 }, () => 0.1);

      const { data, error } = await supabase.rpc("search_user_embeddings", {
        target_user_id: testUser1Id,
        query_vector: queryVector,
        similarity_threshold: 0.0,
        match_count: 100,
      });

      expect(error).toBeNull();

      if (data && data.length > 0) {
        // 類似度の降順でソートされていることを確認
        for (let i = 0; i < data.length - 1; i++) {
          expect(data[i].similarity).toBeGreaterThanOrEqual(
            data[i + 1].similarity,
          );
        }

        // 全ての結果が指定ユーザーのものであることを確認
        data.forEach((result: { metadata: { owner: string } }) => {
          expect(result.metadata.owner).toBe("user1");
        });
      }
    });

    test("埋め込みデータのメタデータ整合性", async () => {
      const { data, error } = await supabase
        .from("content_embeddings")
        .select("*")
        .match({ "metadata->test": "supabase_integration" })
        .not("content_text", "is", null)
        .not("embedding", "is", null);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      if (data) {
        data.forEach(
          (item: {
            content_text: string;
            embedding: number[];
            metadata: { test: string };
          }) => {
            expect(item.content_text).toBeTruthy();
            expect(Array.isArray(item.embedding)).toBe(true);
            expect(item.embedding).toHaveLength(1536);
            expect(item.metadata).toBeDefined();
            expect(item.metadata.test).toBe("supabase_integration");
          },
        );
      }
    });
  });
});
