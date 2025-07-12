/**
 * Issue #24: 統合テストとCI/CD基盤 - グローバルティアダウン
 *
 * 全統合テスト実行後のグローバルクリーンアップ処理
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { resolve } from "path";

/**
 * グローバルティアダウン関数
 * Jest の全テスト実行後に一度だけ実行される
 */
export default async function globalTeardown(): Promise<void> {
  console.log("🧹 Starting global integration test teardown...");

  try {
    // 1. テストデータのクリーンアップ
    await cleanupTestData();

    // 2. テスト結果のサマリー生成
    await generateTestSummary();

    // 3. リソースのクリーンアップ
    await cleanupResources();

    // 4. CI 環境での追加クリーンアップ
    if (process.env.CI) {
      await cleanupCIEnvironment();
    }

    console.log("✅ Global integration test teardown completed successfully");
  } catch (error) {
    console.error("❌ Global integration test teardown failed:", error);
    // ティアダウンのエラーはログ出力のみで、テスト結果には影響させない
  }
}

/**
 * テストデータのクリーンアップ
 */
async function cleanupTestData(): Promise<void> {
  console.log("🗑️ Cleaning up test data...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️ Supabase configuration missing, skipping data cleanup");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // テストユーザーの削除
    const testUserEmails = [
      "test1@integration.test",
      "test2@integration.test",
      "user1@isolation.test",
      "user2@isolation.test",
      "user3@isolation.test",
      "frontend-test@example.com",
    ];

    for (const email of testUserEmails) {
      try {
        // Auth ユーザーを削除
        const { data: users } = await supabase.auth.admin.listUsers();
        const testUser = users.users.find((user) => user.email === email);

        if (testUser) {
          await supabase.auth.admin.deleteUser(testUser.id);
          console.log(`🗑️ Deleted auth user: ${email}`);
        }

        // users テーブルからも削除
        await supabase.from("users").delete().eq("email", email);
      } catch (userError) {
        console.warn(`⚠️ Failed to delete test user ${email}:`, userError);
      }
    }

    // テスト用コンテンツソースの削除
    const testContentSources = await supabase
      .from("content_sources")
      .select("*")
      .or("url.like.*test*,name.like.*Test*");

    if (testContentSources.data && testContentSources.data.length > 0) {
      await supabase
        .from("content_sources")
        .delete()
        .or("url.like.*test*,name.like.*Test*");

      console.log(
        `🗑️ Deleted ${testContentSources.data.length} test content sources`,
      );
    }

    // 古いテストデータの削除（作成日時が1日以上古い）
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const tables = [
      "raw_content",
      "content_chunks",
      "generated_posts",
      "api_usage_logs",
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .lt("created_at", oneDayAgo);

        if (!error) {
          console.log(`🗑️ Cleaned up old test data from ${table}`);
        }
      } catch (tableError) {
        console.warn(`⚠️ Failed to cleanup ${table}:`, tableError);
      }
    }

    console.log("✅ Test data cleanup completed");
  } catch (error) {
    console.warn("⚠️ Test data cleanup warning:", error);
  }
}

/**
 * テスト結果のサマリー生成
 */
async function generateTestSummary(): Promise<void> {
  console.log("📊 Generating test summary...");

  try {
    const rootDir = resolve(__dirname, "../../");
    const summaryPath = resolve(
      rootDir,
      "test-results/integration/summary.json",
    );

    // テスト実行情報の収集
    const testSummary = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        ci: !!process.env.CI,
        platform: process.platform,
        nodeVersion: process.version,
      },
      configuration: {
        supabaseUrl: process.env.SUPABASE_URL,
        frontendUrl: process.env.FRONTEND_URL,
        backendApiUrl: process.env.BACKEND_API_URL,
        mockExternalServices: process.env.MOCK_EXTERNAL_SERVICES,
      },
      resources: {
        maxMemoryUsed: process.memoryUsage().heapUsed,
        executionTime: process.uptime(),
      },
      gitInfo: {
        branch:
          process.env.GITHUB_REF_NAME || process.env.GIT_BRANCH || "unknown",
        commit: process.env.GITHUB_SHA || process.env.GIT_COMMIT || "unknown",
        pullRequest: process.env.GITHUB_PR_NUMBER || null,
      },
    };

    // サマリーファイルの書き出し
    writeFileSync(summaryPath, JSON.stringify(testSummary, null, 2));
    console.log(`📄 Test summary saved to: ${summaryPath}`);

    // CI 環境での追加情報出力
    if (process.env.CI) {
      console.log("📋 Test Summary:");
      console.log(`   Environment: ${testSummary.environment.nodeEnv}`);
      console.log(`   Platform: ${testSummary.environment.platform}`);
      console.log(`   Node Version: ${testSummary.environment.nodeVersion}`);
      console.log(`   Branch: ${testSummary.gitInfo.branch}`);
      console.log(`   Commit: ${testSummary.gitInfo.commit.substring(0, 8)}`);
      console.log(
        `   Memory Used: ${Math.round(testSummary.resources.maxMemoryUsed / 1024 / 1024)}MB`,
      );
      console.log(
        `   Execution Time: ${Math.round(testSummary.resources.executionTime)}s`,
      );
    }
  } catch (error) {
    console.warn("⚠️ Failed to generate test summary:", error);
  }
}

/**
 * リソースのクリーンアップ
 */
async function cleanupResources(): Promise<void> {
  console.log("♻️ Cleaning up resources...");

  try {
    // 開いているファイルハンドルやネットワーク接続のクリーンアップ

    // タイマーのクリア
    const timers = (global as any).__timers__;
    if (timers) {
      timers.forEach((timer: any) => {
        clearTimeout(timer);
        clearInterval(timer);
      });
    }

    // プロセスのクリーンアップ
    process.removeAllListeners("unhandledRejection");
    process.removeAllListeners("uncaughtException");

    // メモリ使用量の確認
    const memoryUsage = process.memoryUsage();
    console.log(
      `💾 Final memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    );

    // ガベージコレクションの実行（Node.js に --expose-gc フラグが必要）
    if (global.gc) {
      global.gc();
      console.log("♻️ Garbage collection executed");
    }

    console.log("✅ Resource cleanup completed");
  } catch (error) {
    console.warn("⚠️ Resource cleanup warning:", error);
  }
}

/**
 * CI 環境での追加クリーンアップ
 */
async function cleanupCIEnvironment(): Promise<void> {
  console.log("🤖 Cleaning up CI environment...");

  try {
    // GitHub Actions での追加クリーンアップ
    if (process.env.GITHUB_ACTIONS) {
      // アーティファクトの最終整理
      console.log("📦 Finalizing GitHub Actions artifacts...");

      // テスト結果の GitHub Actions 出力
      if (process.env.GITHUB_OUTPUT) {
        const outputLine = `integration-tests-completed=true\n`;
        require("fs").appendFileSync(process.env.GITHUB_OUTPUT, outputLine);
      }
    }

    // Docker 環境でのクリーンアップ
    if (process.env.DOCKER_ENV) {
      console.log("🐳 Docker environment cleanup...");
      // Docker 固有のクリーンアップがあればここに追加
    }

    console.log("✅ CI environment cleanup completed");
  } catch (error) {
    console.warn("⚠️ CI environment cleanup warning:", error);
  }
}
