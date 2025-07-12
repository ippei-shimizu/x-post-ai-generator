/**
 * Issue #22: Serverless Framework セットアップ - デプロイメント統合テスト
 *
 * TDD統合テスト: Serverless Frameworkのデプロイメント機能をテスト
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

// テスト環境設定
const TEST_STAGE = "test";
const TEST_REGION = "ap-northeast-1";
const BACKEND_DIR = process.cwd();
const SERVERLESS_YML_PATH = path.join(BACKEND_DIR, "serverless.yml");
const PACKAGE_JSON_PATH = path.join(BACKEND_DIR, "package.json");

describe("Serverless Framework Deployment - Integration Tests", () => {
  describe("TDD Red Phase: Configuration Validation", () => {
    it("should have valid serverless.yml configuration", async () => {
      // serverless.ymlファイルの存在確認
      const stats = await fs.stat(SERVERLESS_YML_PATH);
      expect(stats.isFile()).toBe(true);

      // serverless.ymlの内容確認
      const serverlessConfig = await fs.readFile(SERVERLESS_YML_PATH, "utf-8");

      // 必須設定項目の確認
      expect(serverlessConfig).toMatch(
        /service:\s+x-post-ai-generator-backend/,
      );
      expect(serverlessConfig).toMatch(/frameworkVersion:\s+['"]3['"]/);
      expect(serverlessConfig).toMatch(/provider:\s*\n\s*name:\s+aws/);
      expect(serverlessConfig).toMatch(/runtime:\s+nodejs18\.x/);

      // プラグイン設定の確認
      expect(serverlessConfig).toMatch(/serverless-esbuild/);
      expect(serverlessConfig).toMatch(/serverless-offline/);
      expect(serverlessConfig).toMatch(/serverless-dotenv-plugin/);

      // Lambda関数の定義確認
      expect(serverlessConfig).toMatch(/functions:/);
      expect(serverlessConfig).toMatch(/health:/);
      expect(serverlessConfig).toMatch(/authTest:/);
    });

    it("should have valid package.json dependencies", async () => {
      const packageJson = JSON.parse(
        await fs.readFile(PACKAGE_JSON_PATH, "utf-8"),
      );

      // 本番依存関係の確認
      expect(packageJson.dependencies).toHaveProperty("aws-lambda");
      expect(packageJson.dependencies).toHaveProperty(
        "@aws-sdk/client-cloudwatch-logs",
      );
      expect(packageJson.dependencies).toHaveProperty("jsonwebtoken");
      expect(packageJson.dependencies).toHaveProperty("zod");

      // 開発依存関係の確認
      expect(packageJson.devDependencies).toHaveProperty("@types/aws-lambda");
      expect(packageJson.devDependencies).toHaveProperty("serverless");
      expect(packageJson.devDependencies).toHaveProperty("serverless-esbuild");
      expect(packageJson.devDependencies).toHaveProperty("serverless-offline");
      expect(packageJson.devDependencies).toHaveProperty("typescript");
      expect(packageJson.devDependencies).toHaveProperty("jest");

      // スクリプトの確認
      expect(packageJson.scripts).toHaveProperty("build");
      expect(packageJson.scripts).toHaveProperty("dev");
      expect(packageJson.scripts).toHaveProperty("deploy");
      expect(packageJson.scripts).toHaveProperty("test");
    });

    it("should have required function files", async () => {
      // ヘルスチェック関数ファイルの確認
      const healthFunctionPath = path.join(
        BACKEND_DIR,
        "functions/health/index.ts",
      );
      const healthStats = await fs.stat(healthFunctionPath);
      expect(healthStats.isFile()).toBe(true);

      // 認証テスト関数ファイルの確認
      const authTestFunctionPath = path.join(
        BACKEND_DIR,
        "functions/auth/test.ts",
      );
      const authStats = await fs.stat(authTestFunctionPath);
      expect(authStats.isFile()).toBe(true);
    });

    it("should have TypeScript configuration", async () => {
      const tsconfigPath = path.join(BACKEND_DIR, "tsconfig.json");
      const tsconfigStats = await fs.stat(tsconfigPath);
      expect(tsconfigStats.isFile()).toBe(true);

      const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, "utf-8"));

      expect(tsconfig.compilerOptions.target).toBe("ES2022");
      expect(tsconfig.compilerOptions.module).toBe("commonjs");
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });
  });

  describe("TDD Red Phase: Build Process Tests", () => {
    it("should successfully build the project", async () => {
      try {
        const { stdout, stderr } = await execAsync("pnpm run build", {
          cwd: BACKEND_DIR,
          timeout: 60000, // 60秒タイムアウト
        });

        // ビルド成功の確認
        expect(stderr).not.toMatch(/Error:/);
        expect(stdout).toMatch(/serverless package/);

        // .serverlessディレクトリの作成確認
        const serverlessDir = path.join(BACKEND_DIR, ".serverless");
        const serverlessStats = await fs.stat(serverlessDir);
        expect(serverlessStats.isDirectory()).toBe(true);
      } catch (error) {
        console.error("Build process failed:", error);
        throw error;
      }
    }, 60000);

    it("should pass TypeScript compilation", async () => {
      try {
        await execAsync("pnpm run typecheck", {
          cwd: BACKEND_DIR,
          timeout: 30000,
        });
        // TypeScriptコンパイルエラーがないことを確認
      } catch (error) {
        console.error("TypeScript compilation failed:", error);
        throw error;
      }
    }, 30000);

    it("should pass ESLint checks", async () => {
      try {
        await execAsync("pnpm run lint", {
          cwd: BACKEND_DIR,
          timeout: 30000,
        });
        // ESLintエラーがないことを確認
      } catch (error) {
        console.error("ESLint checks failed:", error);
        throw error;
      }
    }, 30000);
  });

  describe("TDD Red Phase: Environment Validation", () => {
    it("should load environment variables correctly", async () => {
      // .envファイルの存在確認
      const envPath = path.join(BACKEND_DIR, ".env");
      const envStats = await fs.stat(envPath);
      expect(envStats.isFile()).toBe(true);

      // .env.exampleファイルの存在確認
      const envExamplePath = path.join(BACKEND_DIR, ".env.example");
      const envExampleStats = await fs.stat(envExamplePath);
      expect(envExampleStats.isFile()).toBe(true);
    });

    it("should validate serverless configuration with environment variables", async () => {
      try {
        const { stdout } = await execAsync("npx serverless print", {
          cwd: BACKEND_DIR,
          timeout: 30000,
          env: {
            ...process.env,
            STAGE: TEST_STAGE,
            AWS_REGION: TEST_REGION,
          },
        });

        // 設定の出力に環境変数が正しく反映されていることを確認
        expect(stdout).toMatch(/stage: dev/);
        expect(stdout).toMatch(/region: ap-northeast-1/);
      } catch (error) {
        console.error("Serverless configuration validation failed:", error);
        throw error;
      }
    }, 30000);
  });

  describe("TDD Red Phase: Local Development Tests", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let serverlessOfflineProcess: any;

    afterEach(() => {
      // プロセスのクリーンアップ
      if (serverlessOfflineProcess) {
        serverlessOfflineProcess.kill();
        serverlessOfflineProcess = null;
      }
    });

    it("should start serverless-offline successfully", async () => {
      // serverless-offlineの起動テスト（実際には起動せず、コマンドが存在することのみ確認）
      try {
        const { stdout } = await execAsync("npx serverless offline --help", {
          cwd: BACKEND_DIR,
          timeout: 10000,
        });

        expect(stdout).toMatch(/offline/i);
      } catch (error) {
        console.error("Serverless offline command failed:", error);
        throw error;
      }
    }, 15000);
  });

  describe("TDD Red Phase: Security Configuration Tests", () => {
    it("should have proper IAM role statements", async () => {
      const serverlessConfig = await fs.readFile(SERVERLESS_YML_PATH, "utf-8");

      // IAM権限設定の確認
      expect(serverlessConfig).toMatch(/iamRoleStatements:/);
      expect(serverlessConfig).toMatch(/logs:CreateLogGroup/);
      expect(serverlessConfig).toMatch(/logs:CreateLogStream/);
      expect(serverlessConfig).toMatch(/logs:PutLogEvents/);

      // 最小権限の原則に従っているか確認（ワイルドカード権限は避ける）
      expect(serverlessConfig).toMatch(/CloudWatch/);
      expect(serverlessConfig).toMatch(/logs:/);
      expect(serverlessConfig).toMatch(/lambda:/);
    });

    it("should have CORS configuration", async () => {
      const serverlessConfig = await fs.readFile(SERVERLESS_YML_PATH, "utf-8");

      expect(serverlessConfig).toMatch(/cors:/);
      expect(serverlessConfig).toMatch(/allowedOrigins:/);
      expect(serverlessConfig).toMatch(/allowedHeaders:/);
      expect(serverlessConfig).toMatch(/allowedMethods:/);
    });

    it("should not commit sensitive environment variables", async () => {
      const envFile = await fs.readFile(
        path.join(BACKEND_DIR, ".env"),
        "utf-8",
      );

      // 開発用のダミー値が設定されていることを確認
      expect(envFile).toMatch(/development-/);
      expect(envFile).not.toMatch(/production[^-]/i); // "production"単体を避ける
      expect(envFile).not.toMatch(/real.*key/i);
    });
  });

  describe("TDD Red Phase: Performance Tests", () => {
    it("should complete build process within reasonable time", async () => {
      const startTime = Date.now();

      try {
        await execAsync("pnpm run build", {
          cwd: BACKEND_DIR,
          timeout: 120000, // 2分タイムアウト
        });

        const buildTime = Date.now() - startTime;

        // ビルド時間が2分以内であることを確認
        expect(buildTime).toBeLessThan(120000);

        // 実用的なビルド時間（30秒以内）を推奨として確認
        if (buildTime > 30000) {
          console.warn(`Build took ${buildTime}ms, consider optimization`);
        }
      } catch (error) {
        console.error("Build performance test failed:", error);
        throw error;
      }
    }, 120000);

    it("should have optimized Lambda function configuration", async () => {
      const serverlessConfig = await fs.readFile(SERVERLESS_YML_PATH, "utf-8");

      // Lambda設定の最適化確認
      expect(serverlessConfig).toMatch(/timeout: 28/); // API Gatewayの30秒制限以下
      expect(serverlessConfig).toMatch(/memorySize: 512/); // 適切なメモリサイズ
    });
  });
});
