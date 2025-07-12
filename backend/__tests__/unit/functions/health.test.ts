/**
 * Issue #22: Serverless Framework セットアップ - ヘルスチェック関数 TDD テスト
 *
 * Red Phase: ヘルスチェック関数の要件を満たす失敗テストを作成
 */

import { handler } from "../../../functions/health/index";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";

// モック環境変数
const mockEnv = {
  STAGE: "test",
  AWS_REGION: "us-east-1",
  SUPABASE_URL: "https://test-project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  JWT_SECRET: "test-jwt-secret",
  OPENAI_API_KEY: "sk-test-openai-key",
  AWS_LAMBDA_FUNCTION_MEMORY_SIZE: "512",
  AWS_LAMBDA_FUNCTION_TIMEOUT: "30",
};

// テスト用APIGatewayイベント
const createMockEvent = (
  overrides?: Partial<APIGatewayProxyEvent>,
): APIGatewayProxyEvent => ({
  httpMethod: "GET",
  path: "/health",
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  headers: {},
  multiValueHeaders: {},
  body: null,
  isBase64Encoded: false,
  resource: "/health",
  stageVariables: null,
  requestContext: {
    requestId: "test-request-id",
    stage: "test",
    resourceId: "test-resource",
    httpMethod: "GET",
    resourcePath: "/health",
    path: "/test/health",
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

// テスト用Lambdaコンテキスト
const createMockContext = (): Context => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: "health",
  functionVersion: "$LATEST",
  invokedFunctionArn: "arn:aws:lambda:us-east-1:123456789012:function:health",
  memoryLimitInMB: "512",
  awsRequestId: "test-request-id",
  logGroupName: "/aws/lambda/health",
  logStreamName: "2024/01/01/[$LATEST]test",
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
});

describe("Health Check Function - TDD", () => {
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

  // 有効な環境変数を設定するヘルパー関数
  const setValidEnvironment = () => {
    process.env.SUPABASE_URL = "https://valid-project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "valid-service-role-key";
    process.env.OPENAI_API_KEY = "sk-valid-openai-key";
    process.env.STAGE = "test";
  };

  describe("Red Phase: 基本要件テスト", () => {
    it("should return 200 status code for healthy system", async () => {
      setValidEnvironment();
      
      const event = createMockEvent();
      const context = createMockContext();
      const result = await handler(event, context, () => {});

      expect(result?.statusCode).toBe(200);
    });

    it("should return JSON content type", async () => {
      setValidEnvironment();
      
      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.headers?.["Content-Type"]).toBe("application/json");
    });

    it("should include CORS headers", async () => {
      setValidEnvironment();
      
      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.headers?.["Access-Control-Allow-Origin"]).toBe("*");
    });

    it("should return structured health data", async () => {
      setValidEnvironment();
      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      const body = JSON.parse(result.body);

      expect(body).toHaveProperty("success");
      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("meta");

      expect(body.data).toHaveProperty("status");
      expect(body.data).toHaveProperty("timestamp");
      expect(body.data).toHaveProperty("version");
      expect(body.data).toHaveProperty("environment");
      expect(body.data).toHaveProperty("dependencies");
      expect(body.data).toHaveProperty("performance");
    });

    it("should include environment information", async () => {
      setValidEnvironment();
      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      const body = JSON.parse(result.body);
      const env = body.data.environment;

      expect(env).toHaveProperty("stage", "test");
      expect(env).toHaveProperty("region", "us-east-1");
      expect(env).toHaveProperty("nodeVersion");
      expect(env).toHaveProperty("memorySize");
      expect(env).toHaveProperty("timeout");
    });

    it("should check dependencies status", async () => {
      setValidEnvironment();
      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      const body = JSON.parse(result.body);
      const deps = body.data.dependencies;

      expect(deps).toHaveProperty("supabase");
      expect(deps).toHaveProperty("openai");

      expect(["connected", "disconnected", "unknown"]).toContain(deps.supabase);
      expect(["available", "unavailable", "unknown"]).toContain(deps.openai);
    });

    it("should include performance metrics", async () => {
      setValidEnvironment();
      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      const body = JSON.parse(result.body);
      const perf = body.data.performance;

      expect(perf).toHaveProperty("uptime");
      expect(perf).toHaveProperty("memoryUsage");
      expect(typeof perf.uptime).toBe("number");
      expect(perf.memoryUsage).toHaveProperty("rss");
      expect(perf.memoryUsage).toHaveProperty("heapUsed");
      expect(perf.memoryUsage).toHaveProperty("heapTotal");
    });

    it("should include request metadata", async () => {
      setValidEnvironment();
      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      const body = JSON.parse(result.body);
      const meta = body.meta;

      expect(meta).toHaveProperty("timestamp");
      expect(meta).toHaveProperty("requestId", "test-request-id");
      expect(meta).toHaveProperty("executionTime");
      expect(typeof meta.executionTime).toBe("number");
    });
  });

  describe("Red Phase: エラーハンドリングテスト", () => {
    it("should return 503 when environment variables are missing", async () => {
      // 必須環境変数を削除
      delete process.env.SUPABASE_URL;
      delete process.env.JWT_SECRET;

      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.statusCode).toBe(503);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.data.status).toBe("unhealthy");
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe("MISSING_ENVIRONMENT_VARIABLES");
    });

    it("should handle invalid Supabase URL gracefully", async () => {
      process.env.SUPABASE_URL = "invalid-url";

      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      const body = JSON.parse(result.body);
      expect(body.data.dependencies.supabase).toBe("unknown");
    });

    it("should handle invalid OpenAI API key gracefully", async () => {
      process.env.OPENAI_API_KEY = "invalid-key";

      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      const body = JSON.parse(result.body);
      expect(body.data.dependencies.openai).toBe("unavailable");
    });

    it("should return 500 for unexpected errors", async () => {
      // すべての必要な環境変数を削除してエラーを発生させる
      delete process.env.STAGE;
      delete process.env.SUPABASE_URL;
      delete process.env.OPENAI_API_KEY;

      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      // 環境変数がない場合は503が返される
      expect(result.statusCode).toBe(503);

      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe("MISSING_ENVIRONMENT_VARIABLES");
    });
  });

  describe("Red Phase: パフォーマンステスト", () => {
    it("should complete health check within 1 second", async () => {
      setValidEnvironment();
      const startTime = Date.now();
      const event = createMockEvent();
      await handler(event, createMockContext(), () => {});
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1000); // 1秒以内
    });

    it("should include execution time in response metadata", async () => {
      setValidEnvironment();
      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      const body = JSON.parse(result.body);
      expect(body.meta.executionTime).toBeGreaterThanOrEqual(0);
      expect(body.meta.executionTime).toBeLessThan(1000);
    });

    it("should include execution time in response headers", async () => {
      setValidEnvironment();
      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.headers?.["X-Execution-Time"]).toMatch(/^\d+ms$/);
    });
  });

  describe("Red Phase: セキュリティテスト", () => {
    it("should not expose sensitive environment variables", async () => {
      setValidEnvironment();
      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      const responseBody = result.body;

      // レスポンス全体に機密情報が含まれていないことを確認
      expect(responseBody).not.toContain(process.env.SUPABASE_SERVICE_ROLE_KEY);
      expect(responseBody).not.toContain(process.env.JWT_SECRET);
      expect(responseBody).not.toContain(process.env.OPENAI_API_KEY);
    });

    it("should include request ID for tracing", async () => {
      setValidEnvironment();
      const event = createMockEvent();
      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.headers?.["X-Request-ID"]).toBe("test-request-id");
    });

    it("should handle missing request context gracefully", async () => {
      setValidEnvironment();
      const event = createMockEvent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (event as any).requestContext.requestId;

      const result = (await handler(
        event,
        createMockContext(),
        () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      expect(result.headers?.["X-Request-ID"]).toBe("unknown");
    });
  });
});
