/**
 * Issue #24: 統合テストとCI/CD基盤 - Jest 統合テスト設定
 *
 * 統合テスト専用のJest設定
 */

/** @type {import('jest').Config} */
module.exports = {
  // テスト環境設定
  testEnvironment: "node",

  // TypeScript サポート
  preset: "ts-jest",

  // テストファイルの場所
  testMatch: [
    "<rootDir>/tests/integration/**/*.test.ts",
    "<rootDir>/tests/integration/**/*.test.js",
  ],

  // セットアップファイル
  setupFilesAfterEnv: ["<rootDir>/tests/setup/integration.setup.ts"],

  // モジュール解決
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
    "^@backend/(.*)$": "<rootDir>/backend/src/$1",
    "^@frontend/(.*)$": "<rootDir>/frontend/src/$1",
  },

  // カバレッジ設定
  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage/integration",
  coverageReporters: ["text", "lcov", "json", "html", "clover"],

  // カバレッジ対象ファイル
  collectCoverageFrom: [
    "backend/src/**/*.{ts,js}",
    "frontend/src/**/*.{ts,tsx,js,jsx}",
    "tests/integration/**/*.{ts,js}",
    "!**/*.d.ts",
    "!**/*.stories.{ts,tsx,js,jsx}",
    "!**/*.test.{ts,tsx,js,jsx}",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/build/**",
    "!**/.next/**",
    "!**/coverage/**",
  ],

  // カバレッジ閾値
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
    // ディレクトリ別の閾値
    "./backend/src/middleware/": {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    "./tests/integration/": {
      branches: 60,
      functions: 70,
      lines: 75,
      statements: 75,
    },
  },

  // テスト実行設定
  testTimeout: 30000, // 30秒タイムアウト（統合テストは時間がかかる）
  maxWorkers: 2, // 並列実行数を制限（リソース節約）

  // 詳細レポート
  verbose: true,

  // 失敗時の詳細表示
  errorOnDeprecated: true,

  // グローバル設定
  globals: {
    "ts-jest": {
      tsconfig: {
        compilerOptions: {
          module: "commonjs",
          target: "es2020",
          lib: ["es2020", "dom"],
          moduleResolution: "node",
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          skipLibCheck: true,
          strict: true,
        },
      },
    },
  },

  // 環境変数
  setupFiles: ["<rootDir>/tests/setup/env.setup.ts"],

  // テスト実行前後の処理
  globalSetup: "<rootDir>/tests/setup/global.setup.ts",
  globalTeardown: "<rootDir>/tests/setup/global.teardown.ts",

  // テストレポーター
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "<rootDir>/test-results/integration",
        outputName: "junit.xml",
        suiteName: "Integration Tests",
        classNameTemplate: "{classname}",
        titleTemplate: "{title}",
        ancestorSeparator: " › ",
        usePathForSuiteName: true,
      },
    ],
    [
      "jest-html-reporters",
      {
        publicPath: "<rootDir>/test-results/integration",
        filename: "integration-test-report.html",
        pageTitle: "Integration Test Report",
        openReport: false,
        expand: true,
      },
    ],
  ],

  // モック設定
  clearMocks: true,
  restoreMocks: true,
  resetModules: true,

  // ファイル変換設定
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },

  // 無視するファイル
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/dist/",
    "<rootDir>/build/",
    "<rootDir>/.next/",
    "<rootDir>/storybook-static/",
  ],

  // モジュール無視設定
  modulePathIgnorePatterns: [
    "<rootDir>/dist/",
    "<rootDir>/build/",
    "<rootDir>/.next/",
  ],

  // 追加のテスト環境設定
  testEnvironmentOptions: {
    url: "http://localhost",
  },
};
