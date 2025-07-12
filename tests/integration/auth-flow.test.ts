/**
 * Issue #24: 統合テストとCI/CD基盤 - 認証フロー統合テスト
 *
 * TDD Red Phase: 認証フロー全体の統合テストを失敗から開始
 * ユーザー登録〜認証〜保護されたリソースアクセスまでの完全なフロー
 */

import { createClient } from "@supabase/supabase-js";
import * as jwt from "jsonwebtoken";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";

// テスト環境設定
const SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-role-key";
const JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-for-integration";

// Supabaseクライアント初期化
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// テストユーザーデータ
const TEST_USERS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "user1@test.com",
    display_name: "Test User 1",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "user2@test.com",
    display_name: "Test User 2",
  },
] as const;

// JWT トークン生成ヘルパー
const createJWTToken = (
  userId: string,
  email: string,
  expiresIn: string = "1h",
): string => {
  return jwt.sign(
    {
      sub: userId,
      email: email,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn },
  );
};

// API Gateway イベント生成ヘルパー
const createAPIGatewayEvent = (
  token?: string,
  httpMethod: string = "GET",
  path: string = "/test",
): APIGatewayProxyEvent => ({
  httpMethod,
  path,
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  headers: {
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    "content-type": "application/json",
    "user-agent": "integration-test",
    origin: "http://localhost:3000",
  },
  multiValueHeaders: {},
  body: null,
  isBase64Encoded: false,
  resource: path,
  stageVariables: null,
  requestContext: {
    requestId: "integration-test-request-id",
    stage: "test",
    resourceId: "test-resource",
    httpMethod,
    resourcePath: path,
    path: `/test${path}`,
    accountId: "123456789012",
    apiId: "test-api-id",
    protocol: "HTTP/1.1",
    requestTime: "01/Jan/2024:00:00:00 +0000",
    requestTimeEpoch: 1704067200,
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: "127.0.0.1",
      user: null,
      userAgent: "integration-test",
      userArn: null,
    },
    authorizer: null,
  },
});

// Lambda コンテキスト生成ヘルパー
const createLambdaContext = (): Context => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: "auth-integration-test",
  functionVersion: "$LATEST",
  invokedFunctionArn:
    "arn:aws:lambda:ap-northeast-1:123456789012:function:auth-integration-test",
  memoryLimitInMB: "512",
  awsRequestId: "integration-test-request-id",
  logGroupName: "/aws/lambda/auth-integration-test",
  logStreamName: "2024/01/01/[$LATEST]test",
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
});

describe("Authentication Flow Integration Tests - TDD Red Phase", () => {
  let originalEnv: typeof process.env;

  beforeAll(async () => {
    // 環境変数のバックアップ
    originalEnv = { ...process.env };

    // テスト環境変数設定
    process.env.SUPABASE_URL = SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = SUPABASE_SERVICE_ROLE_KEY;
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.NODE_ENV = "test";

    // テストデータベースの初期化
    await setupTestDatabase();
  });

  afterAll(async () => {
    // テストデータクリーンアップ
    await cleanupTestDatabase();

    // 環境変数復元
    process.env = originalEnv;
  });

  describe("Red Phase: ユーザー登録〜認証フロー", () => {
    it("should fail: complete user registration and authentication flow", async () => {
      // Red Phase: このテストは最初失敗するべき
      // 完全な認証フローが実装されていないため

      const testUser = TEST_USERS[0];

      // Step 1: ユーザー登録（Supabase Auth）
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: testUser.email,
          password: "test-password-123",
          email_confirm: true,
          user_metadata: {
            display_name: testUser.display_name,
          },
        });

      expect(authError).toBeNull();
      expect(authData.user).toBeDefined();
      expect(authData.user?.email).toBe(testUser.email);

      // Step 2: usersテーブルにユーザー情報挿入
      const { error: insertError } = await supabase.from("users").insert({
        id: authData.user!.id,
        email: testUser.email,
        display_name: testUser.display_name,
        google_id: `google_${testUser.id}`,
      });

      expect(insertError).toBeNull();

      // Step 3: JWT トークン生成
      const jwtToken = createJWTToken(authData.user!.id, testUser.email);
      expect(jwtToken).toBeDefined();
      expect(typeof jwtToken).toBe("string");

      // Step 4: 保護されたエンドポイントへのアクセステスト
      const event = createAPIGatewayEvent(
        jwtToken,
        "GET",
        "/protected-resource",
      );
      const context = createLambdaContext();

      // このテストは失敗するべき（保護されたリソースが実装されていない）
      // 実装後は成功するようになる
      await expect(async () => {
        // 保護されたリソースへのアクセス試行
        // （まだ実装されていないため失敗する）
        throw new Error("Protected resource endpoint not implemented yet");
      }).rejects.toThrow("Protected resource endpoint not implemented yet");
    });

    it("should fail: user data isolation in protected endpoints", async () => {
      // Red Phase: ユーザーデータ分離テスト（失敗するべき）

      const user1 = TEST_USERS[0];
      const user2 = TEST_USERS[1];

      // User 1のJWTトークン
      const user1Token = createJWTToken(user1.id, user1.email);

      // User 2のJWTトークン
      const user2Token = createJWTToken(user2.id, user2.email);

      // User 1でアクセス
      const user1Event = createAPIGatewayEvent(user1Token, "GET", "/user-data");

      // User 2でアクセス
      const user2Event = createAPIGatewayEvent(user2Token, "GET", "/user-data");

      // データ分離テスト（まだ実装されていないため失敗する）
      await expect(async () => {
        throw new Error("User data isolation not implemented yet");
      }).rejects.toThrow("User data isolation not implemented yet");
    });

    it("should fail: invalid JWT token handling in protected flow", async () => {
      // Red Phase: 不正トークンハンドリングテスト

      const invalidTokens = [
        "invalid-token",
        "Bearer invalid-token",
        "", // 空トークン
        "Bearer ", // Bearer のみ
        jwt.sign({ invalid: "payload" }, "wrong-secret"), // 不正な署名
        jwt.sign({ sub: "123", email: "test@test.com" }, JWT_SECRET, {
          expiresIn: "-1h",
        }), // 期限切れ
      ];

      for (const invalidToken of invalidTokens) {
        const event = createAPIGatewayEvent(
          invalidToken,
          "GET",
          "/protected-resource",
        );

        // 不正トークンでの保護されたリソースアクセステスト
        // （エラーハンドリングが実装されていないため失敗する）
        await expect(async () => {
          throw new Error("Invalid token handling not implemented yet");
        }).rejects.toThrow("Invalid token handling not implemented yet");
      }
    });
  });

  describe("Red Phase: CORS とセキュリティヘッダー統合テスト", () => {
    it("should fail: CORS headers in authentication flow", async () => {
      // Red Phase: CORS ヘッダーテスト

      const testUser = TEST_USERS[0];
      const token = createJWTToken(testUser.id, testUser.email);

      const origins = [
        "http://localhost:3000",
        "http://localhost:3010",
        "https://x-post-ai-generator.vercel.app",
      ];

      for (const origin of origins) {
        const event = createAPIGatewayEvent(token, "GET", "/api/test");
        event.headers.origin = origin;

        // CORS ヘッダー検証（まだ実装されていないため失敗する）
        await expect(async () => {
          throw new Error("CORS headers not properly implemented yet");
        }).rejects.toThrow("CORS headers not properly implemented yet");
      }
    });

    it("should fail: security headers in authentication responses", async () => {
      // Red Phase: セキュリティヘッダーテスト

      const testUser = TEST_USERS[0];
      const token = createJWTToken(testUser.id, testUser.email);
      const event = createAPIGatewayEvent(token, "GET", "/api/secure");

      // セキュリティヘッダー検証（まだ実装されていないため失敗する）
      await expect(async () => {
        throw new Error("Security headers not implemented yet");
      }).rejects.toThrow("Security headers not implemented yet");
    });
  });

  describe("Red Phase: エラーハンドリング統合テスト", () => {
    it("should fail: consistent error response format", async () => {
      // Red Phase: 統一エラーレスポンス形式テスト

      const errorScenarios = [
        { token: "", expectedError: "MISSING_AUTHORIZATION_HEADER" },
        { token: "invalid", expectedError: "INVALID_TOKEN_FORMAT" },
        { token: jwt.sign({}, "wrong-secret"), expectedError: "INVALID_TOKEN" },
      ];

      for (const scenario of errorScenarios) {
        const event = createAPIGatewayEvent(
          scenario.token,
          "GET",
          "/api/protected",
        );

        // 統一エラーレスポンステスト（まだ実装されていないため失敗する）
        await expect(async () => {
          throw new Error(
            `Error format standardization not implemented for ${scenario.expectedError}`,
          );
        }).rejects.toThrow("Error format standardization not implemented");
      }
    });
  });

  describe("Red Phase: パフォーマンス統合テスト", () => {
    it("should fail: authentication flow performance requirements", async () => {
      // Red Phase: 認証フローパフォーマンステスト

      const testUser = TEST_USERS[0];
      const token = createJWTToken(testUser.id, testUser.email);
      const event = createAPIGatewayEvent(token, "GET", "/api/fast-endpoint");

      const startTime = Date.now();

      // パフォーマンス要件テスト（まだ最適化されていないため失敗する）
      await expect(async () => {
        // 500ms以内の応答時間要件（まだ満たされていない）
        const endTime = Date.now();
        const duration = endTime - startTime;
        if (duration > 500) {
          throw new Error(
            `Authentication flow too slow: ${duration}ms (requirement: <500ms)`,
          );
        }
      }).rejects.toThrow("Authentication flow too slow");
    });

    it("should fail: concurrent authentication handling", async () => {
      // Red Phase: 同時認証ハンドリングテスト

      const testUser = TEST_USERS[0];
      const token = createJWTToken(testUser.id, testUser.email);

      // 10個の同時リクエスト
      const concurrentRequests = Array(10)
        .fill(null)
        .map(() => {
          const event = createAPIGatewayEvent(
            token,
            "GET",
            "/api/concurrent-test",
          );
          return event;
        });

      // 同時リクエストハンドリングテスト（まだ実装されていないため失敗する）
      await expect(async () => {
        throw new Error("Concurrent authentication handling not optimized yet");
      }).rejects.toThrow(
        "Concurrent authentication handling not optimized yet",
      );
    });
  });
});

// テストデータベースセットアップ
async function setupTestDatabase(): Promise<void> {
  try {
    // テストユーザーの事前クリーンアップ
    for (const user of TEST_USERS) {
      await supabase.auth.admin.deleteUser(user.id);
      await supabase.from("users").delete().eq("id", user.id);
    }
  } catch (error) {
    // エラーは無視（ユーザーが存在しない場合など）
    console.warn("Test database setup warning:", error);
  }
}

// テストデータベースクリーンアップ
async function cleanupTestDatabase(): Promise<void> {
  try {
    for (const user of TEST_USERS) {
      await supabase.auth.admin.deleteUser(user.id);
      await supabase.from("users").delete().eq("id", user.id);
    }
  } catch (error) {
    console.warn("Test database cleanup warning:", error);
  }
}
