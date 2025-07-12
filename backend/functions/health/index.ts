/**
 * Issue #22: Serverless Framework セットアップ - ヘルスチェック関数
 *
 * デプロイ検証とモニタリング用のヘルスチェックエンドポイント
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { StandardAPIResponse, LambdaHandler } from "../../src/types/aws";
import { HTTP_STATUS_CODES } from "../../src/types/aws";

/**
 * ヘルスチェック情報の型定義
 */
interface HealthCheckData {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
  environment: {
    stage: string;
    region: string;
    nodeVersion: string;
    memorySize: string;
    timeout: string;
  };
  dependencies: {
    supabase: "connected" | "disconnected" | "unknown";
    openai: "available" | "unavailable" | "unknown";
  };
  performance: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

/**
 * ヘルスチェック関数ハンドラー
 *
 * TDD要件:
 * - GET /health でアクセス可能
 * - 正常時は200ステータスで応答
 * - 環境情報と依存関係の状態を返却
 * - パフォーマンス情報を含む
 */
export const handler: LambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();

  try {
    // 環境変数の確認
    const requiredEnvVars = [
      "STAGE",
      "AWS_REGION",
      "SUPABASE_URL",
      "JWT_SECRET",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );

    // 依存関係の状態確認
    const supabaseStatus = await checkSupabaseConnection();
    const openaiStatus = await checkOpenAIAvailability();

    // 全体的な健康状態判定
    // 必須環境変数があれば健康、依存関係はワーニング扱い
    const isHealthy =
      missingEnvVars.length === 0;

    // レスポンスデータ構築
    const healthData: HealthCheckData = {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: {
        stage: process.env.STAGE || "unknown",
        region: process.env.AWS_REGION || "unknown",
        nodeVersion: process.version,
        memorySize: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || "unknown",
        timeout: process.env.AWS_LAMBDA_FUNCTION_TIMEOUT || "unknown",
      },
      dependencies: {
        supabase: supabaseStatus,
        openai: openaiStatus,
      },
      performance: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    };

    const executionTime = Date.now() - startTime;

    // 標準化されたAPIレスポンス
    const response: StandardAPIResponse<HealthCheckData> = {
      success: isHealthy,
      data: healthData,
      ...(missingEnvVars.length > 0
        ? {
            error: {
              code: "MISSING_ENVIRONMENT_VARIABLES",
              message: `Missing required environment variables: ${missingEnvVars.join(", ")}`,
            },
          }
        : {}),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: event.requestContext?.requestId || "unknown",
        executionTime,
      },
    };

    return {
      statusCode: isHealthy
        ? HTTP_STATUS_CODES.OK
        : HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Request-ID": event.requestContext?.requestId || "unknown",
        "X-Execution-Time": `${executionTime}ms`,
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("Health check failed:", error);

    const executionTime = Date.now() - startTime;

    const errorResponse: StandardAPIResponse<never> = {
      success: false,
      error: {
        code: "HEALTH_CHECK_ERROR",
        message:
          error instanceof Error ? error.message : "Unknown health check error",
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
        "X-Request-ID": event.requestContext?.requestId || "unknown",
        "X-Execution-Time": `${executionTime}ms`,
      },
      body: JSON.stringify(errorResponse),
    };
  }
};

/**
 * Supabase接続状態確認
 */
async function checkSupabaseConnection(): Promise<
  "connected" | "disconnected" | "unknown"
> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return "unknown";
    }

    // 簡単な接続テスト (実際のリクエストは送信しない)
    const url = new URL(supabaseUrl);
    const isValidUrl =
      url.protocol === "https:" && url.hostname.includes("supabase");

    return isValidUrl ? "connected" : "disconnected";
  } catch (error) {
    console.warn("Supabase connection check failed:", error);
    return "unknown";
  }
}

/**
 * OpenAI API利用可能性確認
 */
async function checkOpenAIAvailability(): Promise<
  "available" | "unavailable" | "unknown"
> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return "unknown";
    }

    // API キーの形式確認 (実際のリクエストは送信しない)
    const isValidKeyFormat =
      openaiApiKey.startsWith("sk-") && openaiApiKey.length > 20;

    return isValidKeyFormat ? "available" : "unavailable";
  } catch (error) {
    console.warn("OpenAI availability check failed:", error);
    return "unknown";
  }
}
