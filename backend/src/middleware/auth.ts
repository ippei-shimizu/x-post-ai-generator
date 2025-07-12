/**
 * Issue #23: JWT認証ミドルウェア - Lambda用認証検証
 *
 * Green Phase: テストを通すための最小限の実装
 */

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import * as jwt from "jsonwebtoken";
import {
  AuthenticatedAPIGatewayProxyEvent,
  AuthError,
  AuthErrorCode,
  JWTAuthPayload,
  isValidJWTPayload,
  AuthMiddlewareOptions,
} from "../types/auth";

/**
 * デフォルトのCORSヘッダー
 */
const DEFAULT_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, X-Amz-Date, X-Api-Key, X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

/**
 * エラーレスポンスを生成
 */
function createErrorResponse(
  statusCode: number,
  code: string,
  message: string,
  headers: Record<string, string> = {},
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      ...DEFAULT_CORS_HEADERS,
      ...headers,
    },
    body: JSON.stringify({
      success: false,
      error: {
        code,
        message,
      },
    }),
  };
}

/**
 * Authorizationヘッダーからトークンを抽出
 */
function extractTokenFromHeader(
  headers: APIGatewayProxyEvent["headers"],
): string | null {
  const authHeader =
    headers.authorization || headers.Authorization || headers.AUTHORIZATION;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

/**
 * JWTトークンを検証し、ペイロードを返す
 */
function verifyToken(token: string, secret: string): JWTAuthPayload {
  try {
    const payload = jwt.verify(token, secret);

    if (!isValidJWTPayload(payload)) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        "Invalid token payload structure",
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError(AuthErrorCode.TOKEN_EXPIRED, "Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError(AuthErrorCode.INVALID_TOKEN, "Invalid token");
    }
    throw error;
  }
}

/**
 * JWT認証ミドルウェア
 *
 * Lambda関数をラップして、JWT認証を行います。
 * 認証成功時は、event.requestContext.authorizerにユーザー情報を追加します。
 */
export function authMiddleware(
  handler: APIGatewayProxyHandler,
  options: AuthMiddlewareOptions = {},
): APIGatewayProxyHandler {
  return async (
    event: APIGatewayProxyEvent,
    context: Context,
    callback?: any,
  ): Promise<APIGatewayProxyResult> => {
    try {
      // JWT Secret の取得
      const jwtSecret = options.jwtSecret || process.env.JWT_SECRET;
      if (!jwtSecret) {
        return createErrorResponse(
          500,
          AuthErrorCode.INTERNAL_SERVER_ERROR,
          "JWT_SECRET is not configured",
        );
      }

      // トークンの抽出
      const token = extractTokenFromHeader(event.headers);
      if (!token) {
        return createErrorResponse(
          401,
          AuthErrorCode.UNAUTHORIZED,
          "Authorization header missing or invalid format",
        );
      }

      // トークンの検証
      const payload = verifyToken(token, jwtSecret);

      // 認証情報をイベントに追加
      const authenticatedEvent: AuthenticatedAPIGatewayProxyEvent = {
        ...event,
        requestContext: {
          ...event.requestContext,
          authorizer: {
            userId: payload.sub,
            email: payload.email,
            requestMetadata: {
              ip: event.requestContext.identity?.sourceIp || null,
              userAgent: event.requestContext.identity?.userAgent || null,
              origin: event.headers.origin || event.headers.Origin || null,
            },
          },
        },
      };

      // 元のハンドラーを実行
      const result = await handler(authenticatedEvent, context, callback);

      // 結果がundefinedの場合のハンドリング
      if (!result) {
        return createErrorResponse(
          500,
          AuthErrorCode.INTERNAL_SERVER_ERROR,
          "Handler returned no result",
        );
      }

      // CORSヘッダーを追加
      return {
        ...result,
        headers: {
          ...DEFAULT_CORS_HEADERS,
          ...result.headers,
        },
      };
    } catch (error) {
      // 認証エラーの処理
      if (error instanceof AuthError) {
        return createErrorResponse(error.statusCode, error.code, error.message);
      }

      // その他のエラー
      console.error("Auth middleware error:", error);
      return createErrorResponse(
        500,
        AuthErrorCode.INTERNAL_SERVER_ERROR,
        "Internal server error",
      );
    }
  };
}

/**
 * APIGatewayProxyEventからユーザーIDを抽出
 *
 * authMiddlewareで認証された場合、event.requestContext.authorizerから
 * ユーザーIDを取得できます。
 */
export function extractUserId(event: APIGatewayProxyEvent): string | null {
  const authorizer = (event.requestContext as any).authorizer;

  if (!authorizer || typeof authorizer.userId !== "string") {
    return null;
  }

  return authorizer.userId;
}

/**
 * 型ガード: イベントが認証済みかどうかを判定
 */
export function isAuthenticated(
  event: APIGatewayProxyEvent,
): event is AuthenticatedAPIGatewayProxyEvent {
  return extractUserId(event) !== null;
}
