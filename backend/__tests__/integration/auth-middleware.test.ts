/**
 * Issue #23: JWT認証ミドルウェア - 統合テスト
 *
 * 実際のLambda関数での認証ミドルウェアの動作を検証
 */

import { handler as exampleHandler } from "../../functions/personas/example";
import type { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda";
import * as jwt from "jsonwebtoken";

// テスト用の設定
const TEST_JWT_SECRET = "test-jwt-secret-for-integration-testing";
const TEST_USER_ID = "22222222-2222-2222-2222-222222222222";
const TEST_EMAIL = "integration@example.com";

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
  path: "/personas",
  pathParameters: null,
  queryStringParameters: null,
  headers: {
    ...(authHeader ? { authorization: authHeader } : {}),
    "content-type": "application/json",
  },
  multiValueHeaders: {},
  multiValueQueryStringParameters: null,
  body: null,
  isBase64Encoded: false,
  resource: "/personas",
  stageVariables: null,
  requestContext: {
    requestId: "integration-test-request-id",
    stage: "test",
    resourceId: "test-resource",
    httpMethod: "GET",
    resourcePath: "/personas",
    path: "/test/personas",
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
      sourceIp: "192.168.1.100",
      user: null,
      userAgent: "Mozilla/5.0 Integration Test",
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

// テスト用Lambdaコンテキスト
const createMockContext = (): Context => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: "integration-test-function",
  functionVersion: "$LATEST",
  invokedFunctionArn:
    "arn:aws:lambda:us-east-1:123456789012:function:integration-test-function",
  memoryLimitInMB: "512",
  awsRequestId: "integration-test-request-id",
  logGroupName: "/aws/lambda/integration-test-function",
  logStreamName: "2024/01/01/[$LATEST]integration",
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
});

describe("Auth Middleware - Integration Tests", () => {
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

  describe("認証付きLambda関数の動作", () => {
    it("should successfully process authenticated request", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);
      const context = createMockContext();

      const result = await exampleHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      expect(body.success).toBe(true);
      expect(body.data.user_id).toBe(TEST_USER_ID);
      expect(body.data.personas).toBeDefined();
      expect(Array.isArray(body.data.personas)).toBe(true);
      expect(body.data.total).toBe(2);
    });

    it("should return 401 for unauthenticated request", async () => {
      const event = createMockEvent(); // 認証ヘッダーなし
      const context = createMockContext();

      const result = await exampleHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("should return user-specific data only", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);
      const context = createMockContext();

      const result = await exampleHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      // 返されたペルソナがすべて認証されたユーザーのものであることを確認
      body.data.personas.forEach((persona: any) => {
        expect(persona.user_id).toBe(TEST_USER_ID);
      });
    });

    it("should include CORS headers in response", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);
      const context = createMockContext();

      const result = await exampleHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.headers).toBeDefined();
      expect(result.headers?.["Access-Control-Allow-Origin"]).toBe("*");
      expect(result.headers?.["Access-Control-Allow-Headers"]).toContain("Authorization");
    });

    it("should handle request metadata correctly", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);
      const context = createMockContext();

      // リクエストメタデータが正しく処理されることを間接的に確認
      const result = await exampleHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      
      // 正常に処理されたということは、メタデータも正しく渡されたことを意味する
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });
  });

  describe("エラーケースの統合テスト", () => {
    it("should handle invalid JWT gracefully", async () => {
      const invalidToken = "invalid.jwt.token";
      const event = createMockEvent(`Bearer ${invalidToken}`);
      const context = createMockContext();

      const result = await exampleHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INVALID_TOKEN");
    });

    it("should handle expired JWT gracefully", async () => {
      const expiredToken = jwt.sign(
        { sub: TEST_USER_ID, email: TEST_EMAIL },
        TEST_JWT_SECRET,
        { expiresIn: "-1h" } as jwt.SignOptions
      );
      const event = createMockEvent(`Bearer ${expiredToken}`);
      const context = createMockContext();

      const result = await exampleHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("TOKEN_EXPIRED");
    });

    it("should handle missing JWT_SECRET gracefully", async () => {
      delete process.env.JWT_SECRET;

      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);
      const context = createMockContext();

      const result = await exampleHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });

  describe("パフォーマンステスト", () => {
    it("should complete request within reasonable time", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);
      const context = createMockContext();

      const startTime = Date.now();
      await exampleHandler(event, context, () => {});
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1000); // 1秒以内
    });
  });
});