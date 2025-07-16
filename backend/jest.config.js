module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: false,
        tsconfig: {
          target: "es2018",
          module: "commonjs",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: false,
          skipLibCheck: true,
          noUnusedLocals: false,
          noUnusedParameters: false,
          noImplicitAny: false,
          strictNullChecks: false,
          strictFunctionTypes: false,
          noImplicitReturns: false,
          noImplicitThis: false,
          alwaysStrict: false,
        },
      },
    ],
  },
  collectCoverageFrom: [
    "functions/**/*.ts",
    "lib/**/*.ts",
    "!**/*.d.ts",
    "!**/__tests__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: [],
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
};
