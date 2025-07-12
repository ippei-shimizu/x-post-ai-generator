/**
 * Issue #23: JWT認証ミドルウェア - 認証関連型定義
 */

import type { APIGatewayProxyEvent } from "aws-lambda";

/**
 * JWT トークンのペイロード構造
 */
export interface JWTAuthPayload {
  sub: string; // ユーザーID
  email: string; // ユーザーのメールアドレス
  iat: number; // 発行時刻
  exp: number; // 有効期限
}

/**
 * 認証情報を含む拡張されたAuthorizer
 */
export interface AuthContext {
  userId: string;
  email: string;
  requestMetadata?: {
    ip: string | null;
    userAgent: string | null;
    origin?: string | null;
  };
}

/**
 * 認証情報を含む拡張されたAPIGatewayProxyEvent
 */
export interface AuthenticatedAPIGatewayProxyEvent
  extends APIGatewayProxyEvent {
  requestContext: APIGatewayProxyEvent["requestContext"] & {
    authorizer: AuthContext;
  };
}

/**
 * 認証エラーコード
 */
export enum AuthErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  MISSING_AUTH_HEADER = "MISSING_AUTH_HEADER",
  INVALID_TOKEN_FORMAT = "INVALID_TOKEN_FORMAT",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

/**
 * 認証エラー
 */
export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * ユーザーID抽出エラー
 */
export class UserIdExtractionError extends Error {
  constructor(message: string = "Failed to extract user ID") {
    super(message);
    this.name = "UserIdExtractionError";
  }
}

/**
 * レート制限情報
 */
export interface RateLimitInfo {
  userId: string;
  endpoint: string;
  timestamp: number;
  count: number;
}

/**
 * 認証ミドルウェアオプション
 */
export interface AuthMiddlewareOptions {
  /**
   * JWTシークレットキー（省略時は環境変数から取得）
   */
  jwtSecret?: string;

  /**
   * CORS設定を有効にするか（デフォルト: true）
   */
  enableCors?: boolean;

  /**
   * カスタムCORSオリジン（デフォルト: "*"）
   */
  corsOrigin?: string | string[];

  /**
   * レート制限を有効にするか（デフォルト: false）
   */
  enableRateLimit?: boolean;

  /**
   * レート制限設定
   */
  rateLimitConfig?: {
    maxRequests: number;
    windowMs: number;
  };
}

/**
 * 型ガード: AuthenticatedAPIGatewayProxyEvent かどうかを判定
 */
export function isAuthenticatedEvent(
  event: APIGatewayProxyEvent
): event is AuthenticatedAPIGatewayProxyEvent {
  return (
    event.requestContext?.authorizer !== null &&
    event.requestContext?.authorizer !== undefined &&
    typeof (event.requestContext.authorizer as any).userId === "string"
  );
}

/**
 * JWT ペイロードの型ガード
 */
export function isValidJWTPayload(payload: any): payload is JWTAuthPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof payload.sub === "string" &&
    typeof payload.email === "string" &&
    typeof payload.iat === "number" &&
    typeof payload.exp === "number"
  );
}