/**
 * Issue #23: バックエンドライブラリ - メインエクスポート
 *
 * Lambda関数で使用する共通ライブラリのエクスポート
 */

// 認証ミドルウェアと関連型定義
export {
  authMiddleware,
  extractUserId,
  isAuthenticated,
  AuthError,
  AuthErrorCode,
  isAuthenticatedEvent,
  isValidJWTPayload,
} from "./middleware";

export type {
  AuthContext,
  AuthenticatedAPIGatewayProxyEvent,
  JWTAuthPayload,
  UserIdExtractionError,
  RateLimitInfo,
  AuthMiddlewareOptions,
} from "./middleware";

// AWS 型定義
export * from "./types/aws";