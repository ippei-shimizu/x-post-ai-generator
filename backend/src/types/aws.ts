/**
 * Issue #22: Serverless Framework セットアップ - AWS Lambda型定義
 *
 * AWS Lambda関数とAPI Gateway統合のためのTypeScript型定義
 */

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";

/**
 * 拡張されたAPI Gateway Event型
 * JWT認証とユーザー情報を含む
 */
export interface AuthenticatedAPIGatewayEvent extends APIGatewayProxyEvent {
  user?: {
    id: string;
    email: string;
    iat?: number;
    exp?: number;
  };
}

/**
 * 標準化されたAPI レスポンス型
 */
export interface StandardAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    executionTime?: number;
  };
}

/**
 * Lambda関数のハンドラー型
 */
export type LambdaHandler = Handler<
  AuthenticatedAPIGatewayEvent,
  APIGatewayProxyResult
>;

/**
 * エラーレスポンス生成用のヘルパー型
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  code?: string;
  details?: string;
}

/**
 * 成功レスポンス生成用のヘルパー型
 */
export interface SuccessResponse<T = unknown> {
  statusCode: number;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
    executionTime?: number;
  };
}

/**
 * JWT ペイロード型
 */
export interface JWTPayload {
  sub: string; // User ID
  email: string;
  iat: number;
  exp: number;
}

/**
 * CORS設定型
 */
export interface CORSConfig {
  origins: string[];
  methods: string[];
  headers: string[];
  credentials: boolean;
}

/**
 * Lambda関数の設定型
 */
export interface LambdaConfig {
  timeout: number;
  memorySize: number;
  environment: Record<string, string>;
  layers?: string[];
  reservedConcurrency?: number;
}

/**
 * API Gateway統合設定型
 */
export interface APIGatewayIntegration {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
  path: string;
  cors: boolean;
  authorizer?: string;
}

/**
 * CloudWatch ログ設定型
 */
export interface CloudWatchLogConfig {
  logGroupName: string;
  retentionInDays: number;
  logLevel: "ERROR" | "WARN" | "INFO" | "DEBUG";
}

/**
 * 環境変数設定型
 */
export interface EnvironmentConfig {
  STAGE: string;
  AWS_REGION: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_SECRET: string;
  OPENAI_API_KEY: string;
  GITHUB_TOKEN?: string;
  CLOUDWATCH_LOG_GROUP: string;
  CORS_ORIGINS: string;
  RATE_LIMIT_REQUESTS_PER_MINUTE: string;
}

/**
 * レート制限設定型
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit: number;
  quotaLimit: number;
  quotaPeriod: "DAY" | "WEEK" | "MONTH";
}

/**
 * デプロイ設定型
 */
export interface DeploymentConfig {
  stage: string;
  region: string;
  profile?: string;
  stackName: string;
  s3Bucket?: string;
  s3Prefix?: string;
}

/**
 * セキュリティ設定型
 */
export interface SecurityConfig {
  encryption: {
    kmsKeyId?: string;
    encryptionAtRest: boolean;
    encryptionInTransit: boolean;
  };
  vpc?: {
    securityGroupIds: string[];
    subnetIds: string[];
  };
  iamRole?: {
    statements: Array<{
      Effect: "Allow" | "Deny";
      Action: string[];
      Resource: string[];
    }>;
  };
}

/**
 * モニタリング設定型
 */
export interface MonitoringConfig {
  alarms: {
    errorRate: {
      threshold: number;
      period: number;
    };
    duration: {
      threshold: number;
      period: number;
    };
    throttles: {
      threshold: number;
      period: number;
    };
  };
  dashboards: {
    enabled: boolean;
    widgets: string[];
  };
}

// 型ガード関数
export function isAuthenticatedEvent(
  event: APIGatewayProxyEvent,
): event is AuthenticatedAPIGatewayEvent {
  return "user" in event && event.user !== undefined;
}

export function isValidJWTPayload(payload: unknown): payload is JWTPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "sub" in payload &&
    "email" in payload &&
    "iat" in payload &&
    "exp" in payload &&
    typeof (payload as JWTPayload).sub === "string" &&
    typeof (payload as JWTPayload).email === "string" &&
    typeof (payload as JWTPayload).iat === "number" &&
    typeof (payload as JWTPayload).exp === "number"
  );
}

// 定数
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export const LAMBDA_LIMITS = {
  TIMEOUT_MAX: 900, // 15 minutes
  MEMORY_MIN: 128,
  MEMORY_MAX: 10240,
  PAYLOAD_MAX: 6291456, // 6MB
} as const;

export const API_GATEWAY_LIMITS = {
  INTEGRATION_TIMEOUT: 30, // 30 seconds
  PAYLOAD_MAX: 10485760, // 10MB
} as const;
