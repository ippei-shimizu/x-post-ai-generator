/**
 * Issue #22: Serverless Framework セットアップ - 簡単なテスト
 *
 * Green Phase: 基本的な機能が動作することを確認する最小テスト
 */

describe("Serverless Framework Basic Setup", () => {
  it("should have proper environment setup", () => {
    // Node.js バージョンの確認
    expect(process.version).toMatch(/^v18\./);
  });

  it("should be able to import AWS Lambda types", () => {
    // AWS Lambda 型のインポートテスト
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const awsLambda = require("aws-lambda");
    expect(typeof awsLambda).toBe("object");
  });

  it("should have TypeScript configuration", () => {
    // TypeScript設定ファイルの存在確認
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require("path");

    const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
    expect(fs.existsSync(tsconfigPath)).toBe(true);
  });

  it("should have serverless configuration", () => {
    // serverless.yml の存在確認
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require("path");

    const serverlessPath = path.join(process.cwd(), "serverless.yml");
    expect(fs.existsSync(serverlessPath)).toBe(true);
  });

  it("should have package.json with required dependencies", () => {
    // package.json の確認
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson = require("../../../package.json");

    expect(packageJson.dependencies).toHaveProperty("aws-lambda");
    expect(packageJson.dependencies).toHaveProperty("jsonwebtoken");
    expect(packageJson.devDependencies).toHaveProperty("serverless");
    expect(packageJson.devDependencies).toHaveProperty("typescript");
  });
});
