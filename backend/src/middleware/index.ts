/**
 * Issue #23: JWT認証ミドルウェア - エクスポート
 *
 * 認証ミドルウェアと関連するユーティリティ関数のエクスポート
 */

export {
  authMiddleware,
  extractUserId,
  isAuthenticated,
} from "./auth";

export type {
  AuthContext,
  AuthenticatedAPIGatewayProxyEvent,
  JWTAuthPayload,
  UserIdExtractionError,
  RateLimitInfo,
  AuthMiddlewareOptions,
} from "../types/auth";

export {
  AuthError,
  AuthErrorCode,
  isAuthenticatedEvent,
  isValidJWTPayload,
} from "../types/auth";