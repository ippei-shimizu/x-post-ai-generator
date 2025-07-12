/**
 * Issue #22: Serverless Framework セットアップ - 認証テスト関数
 *
 * JWT認証機能のテストとデバッグ用エンドポイント
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type {
  StandardAPIResponse,
  LambdaHandler,
  JWTPayload,
} from "../../src/types/aws";
import { HTTP_STATUS_CODES, isValidJWTPayload } from "../../src/types/aws";
import * as jwt from "jsonwebtoken";

/**
 * 認証テストレスポンスの型定義
 */
interface AuthTestData {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    iat: number;
    exp: number;
  };
  token?: {
    valid: boolean;
    expired: boolean;
    remainingTime?: number;
  };
  headers: {
    authorization?: string;
    userAgent?: string;
    origin?: string;
  };
}

/**
 * 認証テスト関数ハンドラー
 *
 * TDD要件:
 * - GET /auth/test でアクセス可能
 * - Authorization ヘッダーからJWTを検証
 * - トークンの有効性と期限をチェック
 * - 認証済みユーザー情報を返却
 */
export const handler: LambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();

  try {
    // Authorizationヘッダーからトークン抽出
    const authHeader =
      event.headers.authorization || event.headers.Authorization;
    const userAgent =
      event.headers["user-agent"] || event.headers["User-Agent"];
    const origin = event.headers.origin || event.headers.Origin;

    // レスポンス用ヘッダー情報
    const headerInfo = {
      authorization: authHeader ? "***[REDACTED]***" : undefined,
      userAgent,
      origin,
    };

    if (!authHeader) {
      const response: StandardAPIResponse<AuthTestData> = {
        success: false,
        data: {
          authenticated: false,
          headers: headerInfo,
        },
        error: {
          code: "MISSING_AUTHORIZATION_HEADER",
          message: "Authorization header is required",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: event.requestContext?.requestId || "unknown",
          executionTime: Date.now() - startTime,
        },
      };

      return {
        statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(response),
      };
    }

    // Bearer トークンの抽出
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      const response: StandardAPIResponse<AuthTestData> = {
        success: false,
        data: {
          authenticated: false,
          headers: headerInfo,
        },
        error: {
          code: "INVALID_TOKEN_FORMAT",
          message: "Token must be in Bearer format",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: event.requestContext?.requestId || "unknown",
          executionTime: Date.now() - startTime,
        },
      };

      return {
        statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(response),
      };
    }

    // JWT検証
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is not configured");
    }

    try {
      // トークン検証とデコード
      const decoded = jwt.verify(token, jwtSecret) as unknown;

      if (!isValidJWTPayload(decoded)) {
        throw new Error("Invalid JWT payload structure");
      }

      const payload = decoded as JWTPayload;
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < now;
      const remainingTime = payload.exp - now;

      // 認証成功レスポンス
      const response: StandardAPIResponse<AuthTestData> = {
        success: true,
        data: {
          authenticated: true,
          user: {
            id: payload.sub,
            email: payload.email,
            iat: payload.iat,
            exp: payload.exp,
          },
          token: {
            valid: true,
            expired: isExpired,
            remainingTime: remainingTime > 0 ? remainingTime : undefined,
          },
          headers: headerInfo,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: event.requestContext?.requestId || "unknown",
          executionTime: Date.now() - startTime,
        },
      };

      return {
        statusCode: HTTP_STATUS_CODES.OK,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-User-ID": payload.sub,
        },
        body: JSON.stringify(response),
      };
    } catch (jwtError) {
      // JWT検証エラー
      const response: StandardAPIResponse<AuthTestData> = {
        success: false,
        data: {
          authenticated: false,
          token: {
            valid: false,
            expired: false, // 無効なので期限は関係なし
          },
          headers: headerInfo,
        },
        error: {
          code: "INVALID_TOKEN",
          message:
            jwtError instanceof Error
              ? jwtError.message
              : "Token verification failed",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: event.requestContext?.requestId || "unknown",
          executionTime: Date.now() - startTime,
        },
      };

      return {
        statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(response),
      };
    }
  } catch (error) {
    console.error("Auth test failed:", error);

    const executionTime = Date.now() - startTime;

    const errorResponse: StandardAPIResponse<never> = {
      success: false,
      error: {
        code: "AUTH_TEST_ERROR",
        message:
          error instanceof Error ? error.message : "Unknown auth test error",
        details: error instanceof Error ? error.stack : undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: event.requestContext?.requestId || "unknown",
        executionTime,
      },
    };

    return {
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(errorResponse),
    };
  }
};
