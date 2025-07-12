/**
 * Issue #23: JWT認証ミドルウェア使用例 - ペルソナ管理関数
 *
 * authMiddleware の使用方法を示すサンプル関数
 */

import type { APIGatewayProxyHandler } from "aws-lambda";
import { authMiddleware, extractUserId } from "../../src/middleware/auth";
import { HTTP_STATUS_CODES } from "../../src/types/aws";

/**
 * ペルソナ一覧取得関数（認証必須）
 *
 * このようにauthMiddlewareでラップすることで、
 * JWT認証が自動的に行われ、失敗時は401エラーが返される
 */
const getPersonasHandler: APIGatewayProxyHandler = async (event) => {
  // authMiddlewareにより、この時点で認証済み
  const userId = extractUserId(event);
  
  if (!userId) {
    // これは通常発生しないが、安全のため
    return {
      statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        success: false,
        error: {
          code: "USER_ID_EXTRACTION_FAILED",
          message: "Failed to extract user ID",
        },
      }),
    };
  }

  // ユーザー固有のペルソナ処理を実行
  // 実際の実装では、ここでSupabaseからデータを取得
  const mockPersonas = [
    {
      id: "persona-1",
      user_id: userId,
      name: "テックブロガー",
      description: "技術情報を分かりやすく発信",
    },
    {
      id: "persona-2", 
      user_id: userId,
      name: "エンジニア",
      description: "実装の詳細や技術的洞察を共有",
    },
  ];

  return {
    statusCode: HTTP_STATUS_CODES.OK,
    body: JSON.stringify({
      success: true,
      data: {
        personas: mockPersonas,
        total: mockPersonas.length,
        user_id: userId,
      },
    }),
  };
};

// authMiddleware でラップしてエクスポート
export const handler = authMiddleware(getPersonasHandler);

// カスタムオプション付きでの使用例
export const handlerWithCustomOptions = authMiddleware(getPersonasHandler, {
  enableCors: true,
  corsOrigin: ["http://localhost:3010", "https://yourdomain.com"],
  enableRateLimit: false, // 今後実装
});