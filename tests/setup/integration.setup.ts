/**
 * Issue #24: 統合テストとCI/CD基盤 - 統合テストセットアップ
 *
 * 統合テスト実行前のセットアップ処理
 */

import { jest } from "@jest/globals";
import { config } from "dotenv";

// 環境変数読み込み
config({ path: ".env.test" });

// テストタイムアウトの設定
jest.setTimeout(30000);

// グローバルな非同期エラーハンドラー
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

// テスト環境の検証
beforeAll(async () => {
  // 必須環境変数の確認
  const requiredEnvVars = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
    "NODE_ENV",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for integration tests: ${missingVars.join(", ")}\n` +
        "Please check your .env.test file or CI environment configuration.",
    );
  }

  // テスト環境設定の確認
  if (process.env.NODE_ENV !== "test") {
    console.warn(
      'Warning: NODE_ENV is not set to "test". This may cause unexpected behavior.',
    );
  }

  // データベース接続確認
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // 簡単な接続テスト
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error && !error.message.includes("does not exist")) {
      console.warn("Database connection warning:", error.message);
    }
  } catch (error) {
    console.warn("Database setup warning:", error);
  }

  console.log("✓ Integration test environment initialized");
});

// 各テスト後のクリーンアップ
afterEach(async () => {
  // Jest のモックをクリア
  jest.clearAllMocks();

  // タイマーのクリア
  jest.clearAllTimers();
});

// グローバルクリーンアップ
afterAll(async () => {
  // 残っている非同期処理の待機
  await new Promise((resolve) => setImmediate(resolve));

  console.log("✓ Integration test cleanup completed");
});

// カスタムマッチャーの追加
expect.extend({
  /**
   * API レスポンスが正常かテスト
   */
  toBeValidAPIResponse(received: any) {
    const pass =
      typeof received === "object" &&
      typeof received.status === "number" &&
      received.status >= 200 &&
      received.status < 400 &&
      typeof received.body !== "undefined";

    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to be a valid API response`,
        pass: false,
      };
    }
  },

  /**
   * JWT トークンが有効かテスト
   */
  toBeValidJWT(received: string) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = typeof received === "string" && jwtRegex.test(received);

    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid JWT token`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to be a valid JWT token`,
        pass: false,
      };
    }
  },

  /**
   * レスポンス時間が要件を満たすかテスト
   */
  toRespondWithin(received: number, expected: number) {
    const pass = received <= expected;

    if (pass) {
      return {
        message: () =>
          `Expected response time ${received}ms not to be within ${expected}ms`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected response time ${received}ms to be within ${expected}ms`,
        pass: false,
      };
    }
  },

  /**
   * CORS ヘッダーが適切に設定されているかテスト
   */
  toHaveValidCORSHeaders(received: Record<string, string>) {
    const requiredHeaders = [
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
    ];

    const missingHeaders = requiredHeaders.filter(
      (header) => !received[header],
    );
    const pass = missingHeaders.length === 0;

    if (pass) {
      return {
        message: () => `Expected headers not to have valid CORS configuration`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected headers to have valid CORS configuration. Missing: ${missingHeaders.join(", ")}`,
        pass: false,
      };
    }
  },
});

// TypeScript の型拡張
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidAPIResponse(): R;
      toBeValidJWT(): R;
      toRespondWithin(time: number): R;
      toHaveValidCORSHeaders(): R;
    }
  }
}
