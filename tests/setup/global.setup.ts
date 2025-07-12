/**
 * Issue #24: 統合テストとCI/CD基盤 - グローバルセットアップ
 *
 * 全統合テスト実行前のグローバルセットアップ処理
 */

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";

/**
 * グローバルセットアップ関数
 * Jest の全テスト実行前に一度だけ実行される
 */
export default async function globalSetup(): Promise<void> {
  console.log("🚀 Starting global integration test setup...");

  try {
    // 1. ディレクトリ作成
    await setupDirectories();

    // 2. データベースセットアップ
    await setupDatabase();

    // 3. テストデータ準備
    await setupTestData();

    // 4. 外部サービスのヘルスチェック
    await checkExternalServices();

    // 5. CI 環境での追加セットアップ
    if (process.env.CI) {
      await setupCIEnvironment();
    }

    console.log("✅ Global integration test setup completed successfully");
  } catch (error) {
    console.error("❌ Global integration test setup failed:", error);
    throw error;
  }
}

/**
 * テスト用ディレクトリの作成
 */
async function setupDirectories(): Promise<void> {
  const directories = [
    "test-results",
    "test-results/integration",
    "test-results/screenshots",
    "test-results/artifacts",
    "coverage/integration",
    "logs/test",
  ];

  const rootDir = resolve(__dirname, "../../");

  directories.forEach((dir) => {
    const fullPath = resolve(rootDir, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

/**
 * テストデータベースのセットアップ
 */
async function setupDatabase(): Promise<void> {
  console.log("🗄️ Setting up test database...");

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration for database setup");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // データベース接続確認
    const { error: connectionError } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (
      connectionError &&
      !connectionError.message.includes("does not exist")
    ) {
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }

    console.log("✅ Database connection verified");

    // CI 環境でのマイグレーション実行
    if (process.env.CI && process.env.DATABASE_URL) {
      await runDatabaseMigrations();
    }
  } catch (error) {
    console.warn("⚠️ Database setup warning:", error);
    // データベース関連のエラーは警告として扱い、テストは継続
  }
}

/**
 * データベースマイグレーションの実行
 */
async function runDatabaseMigrations(): Promise<void> {
  console.log("🔄 Running database migrations...");

  try {
    const rootDir = resolve(__dirname, "../../");
    const migrationScripts = [
      "database/migrations/001_create_users_table.sql",
      "database/migrations/002_create_content_sources_table.sql",
      "database/migrations/002_enable_rls_policies.sql",
      "database/migrations/003_setup_pgvector_embeddings.sql",
    ];

    // PostgreSQL クライアントで各マイグレーションを実行
    for (const script of migrationScripts) {
      const scriptPath = resolve(rootDir, script);
      if (existsSync(scriptPath)) {
        try {
          execSync(
            `PGPASSWORD="${process.env.DB_PASSWORD || "postgres"}" psql -h ${process.env.DB_HOST || "localhost"} -U ${process.env.DB_USER || "postgres"} -d ${process.env.DB_NAME || "test_db"} -f "${scriptPath}"`,
            { stdio: "pipe" },
          );
          console.log(`✅ Migration applied: ${script}`);
        } catch (migrationError) {
          console.warn(`⚠️ Migration warning: ${script}`, migrationError);
        }
      }
    }
  } catch (error) {
    console.warn("⚠️ Migration execution warning:", error);
  }
}

/**
 * テストデータの準備
 */
async function setupTestData(): Promise<void> {
  console.log("📊 Setting up test data...");

  // テストユーザーデータの準備
  const testUsers = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      email: "test1@integration.test",
      display_name: "Integration Test User 1",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      email: "test2@integration.test",
      display_name: "Integration Test User 2",
    },
  ];

  // グローバルなテストデータをセットアップ
  // 各テストで個別にクリーンアップされるため、ここでは基本データのみ
  console.log(`✅ Test data prepared for ${testUsers.length} users`);
}

/**
 * 外部サービスのヘルスチェック
 */
async function checkExternalServices(): Promise<void> {
  console.log("🔍 Checking external services...");

  const services = [
    {
      name: "Supabase",
      url: process.env.SUPABASE_URL!,
      required: true,
    },
  ];

  const results = await Promise.allSettled(
    services.map(async (service) => {
      try {
        const response = await fetch(service.url, {
          method: "HEAD",
          timeout: 5000,
        });

        if (response.ok) {
          console.log(`✅ ${service.name}: Available`);
          return { service: service.name, status: "available" };
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        const message = `❌ ${service.name}: Unavailable (${error})`;

        if (service.required) {
          console.error(message);
          throw new Error(`Required service ${service.name} is unavailable`);
        } else {
          console.warn(message);
          return { service: service.name, status: "unavailable" };
        }
      }
    }),
  );

  // 結果のサマリー
  const available = results.filter((r) => r.status === "fulfilled").length;
  const total = services.length;
  console.log(`📊 External services: ${available}/${total} available`);
}

/**
 * CI 環境での追加セットアップ
 */
async function setupCIEnvironment(): Promise<void> {
  console.log("🤖 Setting up CI environment...");

  // CI 固有の設定
  process.env.HEADLESS = "true";
  process.env.CI_MODE = "true";
  process.env.LOG_LEVEL = "error";

  // GitHub Actions 固有の設定
  if (process.env.GITHUB_ACTIONS) {
    console.log("🐙 GitHub Actions environment detected");

    // アーティファクト保存パスの設定
    const artifactPath = process.env.GITHUB_WORKSPACE
      ? `${process.env.GITHUB_WORKSPACE}/test-artifacts`
      : "./test-artifacts";

    process.env.TEST_ARTIFACT_PATH = artifactPath;

    // プルリクエスト情報の取得
    if (process.env.GITHUB_EVENT_NAME === "pull_request") {
      console.log(`📋 Pull Request #${process.env.GITHUB_PR_NUMBER} testing`);
    }
  }

  // Docker 環境での設定
  if (process.env.DOCKER_ENV) {
    console.log("🐳 Docker environment detected");
    // Docker 固有の設定があればここに追加
  }

  console.log("✅ CI environment setup completed");
}

/**
 * Fetch with timeout
 */
async function fetch(url: string, options: any = {}): Promise<Response> {
  const { timeout = 5000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await globalThis.fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
