/**
 * Issue #22: Serverless Framework セットアップ - 認証テスト関数 TDD テスト
 *
 * Red Phase: JWT認証機能の要件を満たす失敗テストを作成
 */

import { handler } from "../../../functions/auth/test";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import * as jwt from "jsonwebtoken";

// テスト用の設定
const TEST_JWT_SECRET = "test-jwt-secret-for-testing";
const TEST_USER_ID = "11111111-1111-1111-1111-111111111111";
const TEST_EMAIL = "test@example.com";

// モック環境変数
const mockEnv = {
  STAGE: "test",
  AWS_REGION: "us-east-1",
  JWT_SECRET: TEST_JWT_SECRET,
};

// テスト用APIGatewayイベント生成
const createMockEvent = (
  authHeader?: string,
  overrides?: Partial<APIGatewayProxyEvent>,
): APIGatewayProxyEvent => ({
  httpMethod: "GET",
  path: "/auth/test",
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
  resource: "/auth/test",
  stageVariables: null,
  requestContext: {
    requestId: "test-auth-request-id",
    stage: "test",
    resourceId: "test-resource",
    httpMethod: "GET",
    resourcePath: "/auth/test",
    path: "/test/auth/test",
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
    { expiresIn } as jwt.SignOptions,
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
    { expiresIn: "-1h" } as jwt.SignOptions, // 1時間前に期限切れ
  );
};

// テスト用Lambdaコンテキスト
const createMockContext = (): Context => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: "auth-test",
  functionVersion: "$LATEST",
  invokedFunctionArn:
    "arn:aws:lambda:us-east-1:123456789012:function:auth-test",
  memoryLimitInMB: "512",
  awsRequestId: "test-request-id",
  logGroupName: "/aws/lambda/auth-test",
  logStreamName: "2024/01/01/[$LATEST]test",
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
});

describe("Auth Test Function - TDD", () => {
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

  describe("Red Phase: 認証成功ケース", () => {
    it("should return 200 for valid JWT token", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.statusCode).toBe(200);
    });

    it("should return user information for valid token", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;
      const body = JSON.parse(result.body);

      expect(body.success).toBe(true);
      expect(body.data.authenticated).toBe(true);
      expect(body.data.user).toBeDefined();
      expect(body.data.user.id).toBe(TEST_USER_ID);
      expect(body.data.user.email).toBe(TEST_EMAIL);
    });

    it("should include token validity information", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;
      const body = JSON.parse(result.body);

      expect(body.data.token).toBeDefined();
      expect(body.data.token.valid).toBe(true);
      expect(body.data.token.expired).toBe(false);
      expect(body.data.token.remainingTime).toBeGreaterThan(0);
    });

    it("should include request headers information", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;
      const body = JSON.parse(result.body);

      expect(body.data.headers).toBeDefined();
      expect(body.data.headers.authorization).toBe("***[REDACTED]***");
      expect(body.data.headers.userAgent).toBe("test-user-agent");
      expect(body.data.headers.origin).toBe("http://localhost:3010");
    });

    it("should include user ID in response headers", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.headers?.["X-User-ID"]).toBe(TEST_USER_ID);
    });
  });

  describe("Red Phase: 認証失敗ケース", () => {
    it("should return 401 when authorization header is missing", async () => {
      const event = createMockEvent(); // Authorizationヘッダーなし

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.statusCode).toBe(401);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.data.authenticated).toBe(false);
      expect(body.error.code).toBe("MISSING_AUTHORIZATION_HEADER");
    });

    it("should return 401 when token format is invalid", async () => {
      const event = createMockEvent("InvalidToken"); // Bearer形式ではない

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.statusCode).toBe(401);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INVALID_TOKEN_FORMAT");
    });

    it("should return 401 when token is malformed", async () => {
      const event = createMockEvent("Bearer invalid.jwt.token");

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.statusCode).toBe(401);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.data.authenticated).toBe(false);
      expect(body.data.token?.valid).toBe(false);
      expect(body.error.code).toBe("INVALID_TOKEN");
    });

    it("should return 401 when token is signed with wrong secret", async () => {
      const wrongSecretToken = jwt.sign(
        { sub: TEST_USER_ID, email: TEST_EMAIL },
        "wrong-secret",
        { expiresIn: "1h" } as jwt.SignOptions,
      );
      const event = createMockEvent(`Bearer ${wrongSecretToken}`);

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.statusCode).toBe(401);

      const body = JSON.parse(result.body);
      expect(body.error.code).toBe("INVALID_TOKEN");
    });

    it("should handle expired token correctly", async () => {
      const expiredToken = createExpiredJWT();
      const event = createMockEvent(`Bearer ${expiredToken}`);

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.statusCode).toBe(401);

      const body = JSON.parse(result.body);
      expect(body.error.code).toBe("INVALID_TOKEN");
      expect(body.error.message).toContain("expired");
    });

    it("should return 500 when JWT_SECRET is not configured", async () => {
      delete process.env.JWT_SECRET;

      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.statusCode).toBe(500);

      const body = JSON.parse(result.body);
      expect(body.error.code).toBe("AUTH_TEST_ERROR");
      expect(body.error.message).toContain("JWT_SECRET");
    });
  });

  describe("Red Phase: セキュリティテスト", () => {
    it("should not expose JWT secret in response", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.body).not.toContain(TEST_JWT_SECRET);
    });

    it("should mask authorization header in response", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;
      const body = JSON.parse(result.body);

      expect(body.data.headers.authorization).toBe("***[REDACTED]***");
      expect(body.data.headers.authorization).not.toContain(validToken);
    });

    it("should include CORS headers", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.headers?.["Access-Control-Allow-Origin"]).toBe("*");
    });

    it("should handle both lowercase and uppercase authorization headers", async () => {
      const validToken = createValidJWT();

      // 大文字のヘッダーをテスト
      const eventUppercase = createMockEvent();
      eventUppercase.headers.Authorization = `Bearer ${validToken}`;

      const result = (await handler(
        eventUppercase,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.statusCode).toBe(200);
    });
  });

  describe("Red Phase: パフォーマンステスト", () => {
    it("should complete auth test within 1 second", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);

      const startTime = Date.now();
      await handler(event, createMockContext(), () => {});
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1000); // 1秒以内
    });

    it("should include execution time in response metadata", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;
      const body = JSON.parse(result.body);

      expect(body.meta.executionTime).toBeGreaterThan(0);
      expect(body.meta.executionTime).toBeLessThan(1000);
    });
  });

  describe("Red Phase: エッジケーステスト", () => {
    it("should handle empty Bearer token", async () => {
      const event = createMockEvent("Bearer ");

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).error.code).toBe("INVALID_TOKEN_FORMAT");
    });

    it("should handle token with invalid payload structure", async () => {
      const invalidPayloadToken = jwt.sign(
        { invalid: "payload" }, // sub, email がない
        TEST_JWT_SECRET,
        { expiresIn: "1h" } as jwt.SignOptions,
      );
      const event = createMockEvent(`Bearer ${invalidPayloadToken}`);

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).error.code).toBe("INVALID_TOKEN");
    });

    it("should handle missing request context gracefully", async () => {
      const validToken = createValidJWT();
      const event = createMockEvent(`Bearer ${validToken}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (event as any).requestContext.requestId;

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;
      const body = JSON.parse(result.body);

      expect(body.meta.requestId).toBe("unknown");
    });
  });
});
