/**
 * Issue #23: JWT認証ミドルウェア - TDDテスト
 *
 * Red Phase: JWT認証ミドルウェアの要件を満たす失敗テストを作成
 */

import { authMiddleware } from "../../src/middleware/auth";
import type { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda";
import * as jwt from "jsonwebtoken";

// テスト用の設定
const TEST_JWT_SECRET = "test-jwt-secret-for-testing";
const TEST_USER_ID = "11111111-1111-1111-1111-111111111111";
const TEST_EMAIL = "test@example.com";

// モック環境変数
const mockEnv = {
  JWT_SECRET: TEST_JWT_SECRET,
};

// テスト用APIGatewayイベント生成
const createMockEvent = (
  authHeader?: string,
  overrides?: Partial<APIGatewayProxyEvent>
): APIGatewayProxyEvent => ({
  httpMethod: "GET",
  path: "/test",
  pathParameters: null,
  queryStringParameters: null,
  headers: {
    ...(authHeader ? { authorization: authHeader } : {}),
    "user-agent": "test-user-agent",
    origin: "http://localhost:3010",
  },
  multiValueHeaders: {},
  multiValueQueryStringParameters: null,
  body: null,
  isBase64Encoded: false,
  resource: "/test",
  stageVariables: null,
  requestContext: {
    requestId: "test-request-id",
    stage: "test",
    resourceId: "test-resource",
    httpMethod: "GET",
    resourcePath: "/test",
    path: "/test/test",
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
      userAgent: "test-user-agent",
      userArn: null,
    },
    authorizer: null,
  },
  ...overrides,
});

// 有効なJWTトークン生成
const createValidJWT = (expiresIn: string = "1h"): string => {
  return jwt.sign(
    {
      sub: TEST_USER_ID,
      email: TEST_EMAIL,
    },
    TEST_JWT_SECRET,
    { expiresIn } as jwt.SignOptions
  );
};

// 期限切れのJWTトークン生成
const createExpiredJWT = (): string => {
  return jwt.sign(
    {
      sub: TEST_USER_ID,
      email: TEST_EMAIL,
    },
    TEST_JWT_SECRET,
    { expiresIn: "-1h" } as jwt.SignOptions // 1時間前に期限切れ
  );
};

// テスト用Lambdaコンテキスト
const createMockContext = (): Context => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: "test-function",
  functionVersion: "$LATEST",
  invokedFunctionArn:
    "arn:aws:lambda:us-east-1:123456789012:function:test-function",
  memoryLimitInMB: "512",
  awsRequestId: "test-request-id",
  logGroupName: "/aws/lambda/test-function",
  logStreamName: "2024/01/01/[$LATEST]test",
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
});

describe("Auth Middleware - TDD", () => {
  let originalEnv: typeof process.env;

  beforeEach(() => {
    // 環境変数のバックアップと設定
    originalEnv = { ...process.env };
    Object.assign(process.env, mockEnv);
  });

  afterEach(() => {
    // 環境変数の復元
    process.env = originalEnv;
  });

  describe("Red Phase: ミドルウェア基本機能", () => {
    it("should be a higher-order function that returns a wrapped handler", () => {
      const mockHandler = jest.fn();
      const wrappedHandler = authMiddleware(mockHandler);

      expect(typeof wrappedHandler).toBe("function");
      expect(wrappedHandler).not.toBe(mockHandler);
    });

    it("should extract user ID from valid JWT token", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);
      const context = createMockContext();

      const mockHandler = jest.fn().mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      });

      const wrappedHandler = authMiddleware(mockHandler);
      await wrappedHandler(event, context, () => {});

      // ハンドラーが呼ばれたことを確認
      expect(mockHandler).toHaveBeenCalled();

      // イベントにuserIdが追加されていることを確認
      const modifiedEvent = mockHandler.mock.calls[0][0];
      expect(modifiedEvent.requestContext.authorizer).toBeDefined();
      expect(modifiedEvent.requestContext.authorizer.userId).toBe(TEST_USER_ID);
      expect(modifiedEvent.requestContext.authorizer.email).toBe(TEST_EMAIL);
    });

    it("should reject request when authorization header is missing", async () => {
      const event = createMockEvent(); // Authorizationヘッダーなし
      const context = createMockContext();

      const mockHandler = jest.fn();
      const wrappedHandler = authMiddleware(mockHandler);

      const result = await wrappedHandler(event, context, () => {}) as APIGatewayProxyResult;

      // ハンドラーが呼ばれないことを確認
      expect(mockHandler).not.toHaveBeenCalled();

      // 401エラーが返されることを確認
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toContain("Authorization header");
    });

    it("should reject request with invalid token format", async () => {
      const event = createMockEvent("InvalidToken"); // Bearer形式ではない
      const context = createMockContext();

      const mockHandler = jest.fn();
      const wrappedHandler = authMiddleware(mockHandler);

      const result = await wrappedHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toContain("invalid format");
    });

    it("should reject request with expired token", async () => {
      const expiredToken = createExpiredJWT();
      const event = createMockEvent(`Bearer ${expiredToken}`);
      const context = createMockContext();

      const mockHandler = jest.fn();
      const wrappedHandler = authMiddleware(mockHandler);

      const result = await wrappedHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe("TOKEN_EXPIRED");
      expect(body.error.message).toContain("expired");
    });

    it("should reject request with invalid JWT signature", async () => {
      const wrongSecretToken = jwt.sign(
        { sub: TEST_USER_ID, email: TEST_EMAIL },
        "wrong-secret",
        { expiresIn: "1h" } as jwt.SignOptions
      );
      const event = createMockEvent(`Bearer ${wrongSecretToken}`);
      const context = createMockContext();

      const mockHandler = jest.fn();
      const wrappedHandler = authMiddleware(mockHandler);

      const result = await wrappedHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(401);
    });
  });

  describe("Red Phase: ユーザーID抽出機能", () => {
    it("should have extractUserId utility function", async () => {
      const { extractUserId } = await import("../../src/middleware/auth");
      expect(typeof extractUserId).toBe("function");
    });

    it("should extract user ID from API Gateway event with authorizer", async () => {
      const { extractUserId } = await import("../../src/middleware/auth");

      const event = createMockEvent();
      event.requestContext.authorizer = {
        userId: TEST_USER_ID,
        email: TEST_EMAIL,
      };

      const userId = extractUserId(event);
      expect(userId).toBe(TEST_USER_ID);
    });

    it("should return null when no authorizer data exists", async () => {
      const { extractUserId } = await import("../../src/middleware/auth");

      const event = createMockEvent();
      const userId = extractUserId(event);
      expect(userId).toBeNull();
    });
  });

  describe("Red Phase: エラーハンドリング", () => {
    it("should return 500 when JWT_SECRET is not configured", async () => {
      delete process.env.JWT_SECRET;

      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);
      const context = createMockContext();

      const mockHandler = jest.fn();
      const wrappedHandler = authMiddleware(mockHandler);

      const result = await wrappedHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });

    it("should handle handler errors gracefully", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);
      const context = createMockContext();

      const mockHandler = jest.fn().mockRejectedValue(new Error("Handler error"));
      const wrappedHandler = authMiddleware(mockHandler);

      const result = await wrappedHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });

    it("should handle case-insensitive authorization headers", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent();
      event.headers.Authorization = `Bearer ${validToken}`; // 大文字

      const mockHandler = jest.fn().mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      });

      const wrappedHandler = authMiddleware(mockHandler);
      await wrappedHandler(event, createMockContext(), () => {});

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe("Red Phase: CORS ヘッダー", () => {
    it("should add CORS headers to successful responses", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);

      const mockHandler = jest.fn().mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      });

      const wrappedHandler = authMiddleware(mockHandler);
      const result = await wrappedHandler(event, createMockContext(), () => {}) as APIGatewayProxyResult;

      expect(result.headers).toBeDefined();
      expect(result.headers?.["Access-Control-Allow-Origin"]).toBe("*");
      expect(result.headers?.["Access-Control-Allow-Headers"]).toContain("Authorization");
    });

    it("should add CORS headers to error responses", async () => {
      const event = createMockEvent(); // 認証ヘッダーなし

      const mockHandler = jest.fn();
      const wrappedHandler = authMiddleware(mockHandler);
      const result = await wrappedHandler(event, createMockContext(), () => {}) as APIGatewayProxyResult;

      expect(result.headers?.["Access-Control-Allow-Origin"]).toBe("*");
    });
  });

  describe("Red Phase: レート制限準備", () => {
    it("should track request metadata for rate limiting", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);

      const mockHandler = jest.fn().mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      });

      const wrappedHandler = authMiddleware(mockHandler);
      await wrappedHandler(event, createMockContext(), () => {});

      const modifiedEvent = mockHandler.mock.calls[0][0];
      expect(modifiedEvent.requestContext.authorizer.requestMetadata).toBeDefined();
      expect(modifiedEvent.requestContext.authorizer.requestMetadata.ip).toBe("127.0.0.1");
      expect(modifiedEvent.requestContext.authorizer.requestMetadata.userAgent).toBe("test-user-agent");
    });
  });

  describe("Red Phase: 型安全性", () => {
    it("should export proper TypeScript types", async () => {
      const authModule = await import("../../src/middleware/auth");

      // 型定義のエクスポート確認
      expect(authModule).toHaveProperty("authMiddleware");
      expect(authModule).toHaveProperty("extractUserId");

      // 型アノテーションが正しく機能することを間接的に確認
      const handler = authModule.authMiddleware(async () => ({
        statusCode: 200,
        body: "test",
      }));

      expect(typeof handler).toBe("function");
    });
  });
});