/**
 * Issue #24: 統合テストとCI/CD基盤 - 環境変数セットアップ
 *
 * テスト実行前の環境変数設定
 */

import { config } from "dotenv";
import { resolve } from "path";

// プロジェクトルートからの相対パス
const rootDir = resolve(__dirname, "../../");

// 環境別の .env ファイル読み込み
const envFiles = [".env.test.local", ".env.test", ".env.local", ".env"];

// 環境変数読み込み
for (const envFile of envFiles) {
  const envPath = resolve(rootDir, envFile);
  config({ path: envPath });
}

// テスト用環境変数のデフォルト値設定
const testDefaults = {
  NODE_ENV: "test",

  // Supabase 設定
  SUPABASE_URL: process.env.SUPABASE_URL || "http://localhost:54321",
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-role-key",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "test-anon-key",

  // JWT 設定
  JWT_SECRET: process.env.JWT_SECRET || "test-jwt-secret-for-integration-tests",

  // NextAuth.js 設定
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "test-nextauth-secret",

  // Google OAuth 設定（テスト用ダミー値）
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "test-google-client-id",
  GOOGLE_CLIENT_SECRET:
    process.env.GOOGLE_CLIENT_SECRET || "test-google-client-secret",

  // OpenAI 設定（テスト用ダミー値）
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "sk-test-openai-api-key",

  // AWS 設定
  AWS_REGION: process.env.AWS_REGION || "ap-northeast-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "test-access-key",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "test-secret-key",

  // API エンドポイント
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  BACKEND_API_URL: process.env.BACKEND_API_URL || "http://localhost:3001",

  // データベース設定
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/test_db",

  // ログレベル
  LOG_LEVEL: process.env.LOG_LEVEL || "error",

  // テストフラグ
  DISABLE_REAL_API_CALLS: process.env.DISABLE_REAL_API_CALLS || "true",
  MOCK_EXTERNAL_SERVICES: process.env.MOCK_EXTERNAL_SERVICES || "true",

  // タイムアウト設定
  TEST_TIMEOUT: process.env.TEST_TIMEOUT || "30000",
  API_TIMEOUT: process.env.API_TIMEOUT || "5000",

  // 並列実行設定
  JEST_MAX_WORKERS: process.env.JEST_MAX_WORKERS || "2",
};

// デフォルト値を環境変数に設定（既存の値は上書きしない）
Object.entries(testDefaults).forEach(([key, defaultValue]) => {
  if (!process.env[key]) {
    process.env[key] = defaultValue;
  }
});

// 本番環境での誤実行防止
if (process.env.NODE_ENV === "production") {
  throw new Error(
    "🚨 CRITICAL: Integration tests should never run in production environment!\n" +
      "Please check your NODE_ENV setting.",
  );
}

// 危険な設定値の検証
const dangerousConfigs = [
  { key: "SUPABASE_URL", pattern: /supabase\.co$/, env: "production" },
  { key: "DATABASE_URL", pattern: /amazonaws\.com/, env: "production" },
  { key: "BACKEND_API_URL", pattern: /vercel\.app$/, env: "production" },
];

dangerousConfigs.forEach(({ key, pattern, env }) => {
  const value = process.env[key];
  if (value && pattern.test(value)) {
    console.warn(
      `⚠️  WARNING: ${key} appears to point to ${env} environment: ${value}\n` +
        "Make sure you are using test environment configuration.",
    );
  }
});

// テスト環境確認ログ
console.log("🧪 Test environment configured:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL}`);
console.log(`   BACKEND_API_URL: ${process.env.BACKEND_API_URL}`);
console.log(`   MOCK_EXTERNAL_SERVICES: ${process.env.MOCK_EXTERNAL_SERVICES}`);

export {};
