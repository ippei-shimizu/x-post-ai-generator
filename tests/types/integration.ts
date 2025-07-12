/**
 * Issue #24: 統合テストとCI/CD基盤 - 統合テスト型定義
 *
 * 統合テストで使用する型定義とインターフェース
 */

import type { User } from "@supabase/supabase-js";
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

/**
 * テスト環境設定
 */
export interface TestEnvironmentConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseAnonKey: string;
  jwtSecret: string;
  frontendUrl: string;
  backendApiUrl: string;
  nodeEnv: "test" | "development" | "production";
}

/**
 * テストユーザーデータ
 */
export interface TestUser {
  id: string;
  email: string;
  display_name: string;
  google_id: string;
  password?: string;
}

/**
 * テストコンテンツソース
 */
export interface TestContentSource {
  id?: string;
  user_id: string;
  source_type: "github" | "rss" | "news";
  name: string;
  url: string;
  config: Record<string, any>;
  is_active?: boolean;
}

/**
 * 認証テスト結果
 */
export interface AuthTestResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  duration: number;
}

/**
 * API テストリクエスト設定
 */
export interface APITestRequest {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
  headers?: Record<string, string>;
  body?: any;
  token?: string;
  expectedStatus?: number;
  expectedHeaders?: Record<string, string>;
}

/**
 * API テストレスポンス
 */
export interface APITestResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  duration: number;
  success: boolean;
  error?: string;
}

/**
 * Lambda 関数テスト設定
 */
export interface LambdaTestConfig {
  functionName: string;
  event: APIGatewayProxyEvent;
  context: Context;
  expectedResult: Partial<APIGatewayProxyResult>;
  timeout?: number;
}

/**
 * RLS テスト設定
 */
export interface RLSTestConfig {
  tableName: string;
  testUsers: TestUser[];
  operations: ("SELECT" | "INSERT" | "UPDATE" | "DELETE")[];
  expectedIsolation: boolean;
}

/**
 * RLS テスト結果
 */
export interface RLSTestResult {
  tableName: string;
  operation: string;
  userId: string;
  allowed: boolean;
  isolated: boolean;
  error?: string;
  rowsAffected: number;
}

/**
 * パフォーマンステスト設定
 */
export interface PerformanceTestConfig {
  endpoint: string;
  maxResponseTime: number;
  concurrentRequests: number;
  requestsPerSecond: number;
  duration: number;
}

/**
 * パフォーマンステスト結果
 */
export interface PerformanceTestResult {
  endpoint: string;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestsPerSecond: number;
  successRate: number;
  errorRate: number;
  errors: string[];
}

/**
 * セキュリティテスト設定
 */
export interface SecurityTestConfig {
  testType: "xss" | "csrf" | "injection" | "authorization" | "data_exposure";
  payloads: string[];
  endpoint: string;
  expectedBlocked: boolean;
}

/**
 * セキュリティテスト結果
 */
export interface SecurityTestResult {
  testType: string;
  payload: string;
  blocked: boolean;
  vulnerable: boolean;
  response: string;
  error?: string;
}

/**
 * E2E テストシナリオ
 */
export interface E2ETestScenario {
  name: string;
  description: string;
  steps: E2ETestStep[];
  expectedDuration: number;
  criticalPath: boolean;
}

/**
 * E2E テストステップ
 */
export interface E2ETestStep {
  action: "navigate" | "click" | "type" | "wait" | "verify" | "api_call";
  target: string;
  value?: string;
  timeout?: number;
  expected?: any;
}

/**
 * E2E テスト結果
 */
export interface E2ETestResult {
  scenario: string;
  success: boolean;
  duration: number;
  steps: E2ETestStepResult[];
  screenshots?: string[];
  error?: string;
}

/**
 * E2E テストステップ結果
 */
export interface E2ETestStepResult {
  step: E2ETestStep;
  success: boolean;
  duration: number;
  error?: string;
  screenshot?: string;
}

/**
 * テストカバレッジ情報
 */
export interface TestCoverage {
  lines: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
  statements: CoverageMetric;
}

/**
 * カバレッジメトリック
 */
export interface CoverageMetric {
  total: number;
  covered: number;
  percentage: number;
}

/**
 * CI/CD テスト結果サマリー
 */
export interface CICDTestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage: TestCoverage;

  // テストカテゴリ別結果
  unitTests: TestCategoryResult;
  integrationTests: TestCategoryResult;
  e2eTests: TestCategoryResult;
  securityTests: TestCategoryResult;
  performanceTests: TestCategoryResult;

  // 品質ゲート
  qualityGates: QualityGateResult[];
}

/**
 * テストカテゴリ結果
 */
export interface TestCategoryResult {
  name: string;
  total: number;
  passed: number;
  failed: number;
  duration: number;
  coverage?: TestCoverage;
  errors: string[];
}

/**
 * 品質ゲート結果
 */
export interface QualityGateResult {
  name: string;
  description: string;
  passed: boolean;
  actual: number;
  threshold: number;
  unit: string;
  critical: boolean;
}

/**
 * デプロイメント設定
 */
export interface DeploymentConfig {
  environment: "staging" | "production";
  region: string;
  services: DeploymentService[];
  healthChecks: HealthCheck[];
  rollbackStrategy: "immediate" | "gradual";
}

/**
 * デプロイメントサービス
 */
export interface DeploymentService {
  name: string;
  type: "lambda" | "frontend" | "database";
  version: string;
  dependencies: string[];
  healthCheckEndpoint?: string;
}

/**
 * ヘルスチェック設定
 */
export interface HealthCheck {
  name: string;
  endpoint: string;
  method: string;
  expectedStatus: number;
  timeout: number;
  retries: number;
  interval: number;
}

/**
 * デプロイメント結果
 */
export interface DeploymentResult {
  environment: string;
  services: DeploymentServiceResult[];
  healthChecks: HealthCheckResult[];
  duration: number;
  success: boolean;
  rollbackRequired: boolean;
  error?: string;
}

/**
 * デプロイメントサービス結果
 */
export interface DeploymentServiceResult {
  service: string;
  version: string;
  deployed: boolean;
  duration: number;
  error?: string;
  rollbackVersion?: string;
}

/**
 * ヘルスチェック結果
 */
export interface HealthCheckResult {
  name: string;
  endpoint: string;
  status: number;
  responseTime: number;
  healthy: boolean;
  attempts: number;
  error?: string;
}

/**
 * 通知設定
 */
export interface NotificationConfig {
  channels: NotificationChannel[];
  triggers: NotificationTrigger[];
  templates: NotificationTemplate[];
}

/**
 * 通知チャンネル
 */
export interface NotificationChannel {
  type: "slack" | "email" | "github" | "webhook";
  name: string;
  config: Record<string, any>;
  enabled: boolean;
}

/**
 * 通知トリガー
 */
export interface NotificationTrigger {
  event:
    | "test_failure"
    | "deployment_success"
    | "deployment_failure"
    | "quality_gate_failure";
  channels: string[];
  conditions: Record<string, any>;
}

/**
 * 通知テンプレート
 */
export interface NotificationTemplate {
  trigger: string;
  subject: string;
  body: string;
  format: "text" | "html" | "markdown";
}

/**
 * テストヘルパー関数の型定義
 */
export interface TestHelpers {
  createTestUser: (userData: Partial<TestUser>) => Promise<TestUser>;
  createJWTToken: (userId: string, email: string, expiresIn?: string) => string;
  setupTestDatabase: () => Promise<void>;
  cleanupTestDatabase: () => Promise<void>;
  makeAPIRequest: (config: APITestRequest) => Promise<APITestResponse>;
  waitForCondition: (
    condition: () => boolean | Promise<boolean>,
    timeout?: number,
  ) => Promise<void>;
  captureScreenshot: (name: string) => Promise<string>;
  measurePerformance: <T>(
    operation: () => Promise<T>,
  ) => Promise<{ result: T; duration: number }>;
}

/**
 * モック設定
 */
export interface MockConfig {
  supabase: boolean;
  openai: boolean;
  github: boolean;
  lambda: boolean;
  nextauth: boolean;
}

/**
 * テスト設定のメイン型
 */
export interface IntegrationTestConfig {
  environment: TestEnvironmentConfig;
  users: TestUser[];
  contentSources: TestContentSource[];
  mocks: MockConfig;
  performance: PerformanceTestConfig[];
  security: SecurityTestConfig[];
  e2e: E2ETestScenario[];
  deployment: DeploymentConfig;
  notifications: NotificationConfig;
}

// ユーティリティ型
export type TestStatus =
  | "pending"
  | "running"
  | "passed"
  | "failed"
  | "skipped";
export type TestPriority = "critical" | "high" | "medium" | "low";
export type TestCategory =
  | "unit"
  | "integration"
  | "e2e"
  | "security"
  | "performance";

/**
 * テスト実行コンテキスト
 */
export interface TestExecutionContext {
  testId: string;
  category: TestCategory;
  priority: TestPriority;
  status: TestStatus;
  startTime: Date;
  endTime?: Date;
  environment: string;
  branch: string;
  commit: string;
  artifacts: string[];
}

/**
 * 型ガード関数
 */
export function isTestUser(obj: any): obj is TestUser {
  return (
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.email === "string" &&
    typeof obj.display_name === "string" &&
    typeof obj.google_id === "string"
  );
}

export function isAPITestResponse(obj: any): obj is APITestResponse {
  return (
    typeof obj === "object" &&
    typeof obj.status === "number" &&
    typeof obj.duration === "number" &&
    typeof obj.success === "boolean"
  );
}

export function isPerformanceTestResult(
  obj: any,
): obj is PerformanceTestResult {
  return (
    typeof obj === "object" &&
    typeof obj.endpoint === "string" &&
    typeof obj.averageResponseTime === "number" &&
    typeof obj.successRate === "number"
  );
}
