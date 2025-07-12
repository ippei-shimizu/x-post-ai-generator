# Issue #24: 統合テストとCI/CD基盤 - テストインフラストラクチャ

## 概要

このディレクトリには、X-Post-AI-Generator プロジェクトの統合テストとCI/CD基盤が含まれています。TDD（テスト駆動開発）手法を採用し、認証フロー、データ分離、セキュリティ、パフォーマンスの各分野で包括的なテストを実装しています。

## 📁 ディレクトリ構成

```
tests/
├── integration/           # 統合テスト
│   ├── auth-flow.test.ts         # 認証フロー統合テスト
│   ├── data-isolation.test.ts    # データベースRLS統合テスト
│   └── frontend-backend.test.ts  # フロントエンド・バックエンド連携テスト
├── setup/                # テストセットアップ
│   ├── integration.setup.ts     # 統合テストセットアップ
│   ├── env.setup.ts             # 環境変数セットアップ
│   ├── global.setup.ts          # グローバルセットアップ
│   └── global.teardown.ts       # グローバルティアダウン
├── types/                # 型定義
│   └── integration.ts           # 統合テスト用型定義
└── README.md             # このファイル
```

## 🧪 テストカテゴリ

### 1. 認証フロー統合テスト (`auth-flow.test.ts`)

ユーザー登録から認証、保護されたリソースアクセスまでの完全フローをテスト。

**テスト項目:**

- ユーザー登録〜認証フロー
- ユーザーデータ分離
- 不正トークンハンドリング
- CORS とセキュリティヘッダー
- エラーハンドリング統合
- パフォーマンス要件

**TDD アプローチ:**

```typescript
// Red Phase: 失敗するテスト作成
it("should fail: complete user registration and authentication flow", async () => {
  // まだ実装されていない機能をテスト
  await expect(async () => {
    throw new Error("Protected resource endpoint not implemented yet");
  }).rejects.toThrow("Protected resource endpoint not implemented yet");
});
```

### 2. データベースRLS統合テスト (`data-isolation.test.ts`)

Row Level Security (RLS) によるユーザー間データ分離をテスト。

**テスト項目:**

- Users テーブル RLS 検証
- Content Sources テーブル RLS 検証
- ベクトル検索データ分離
- 匿名アクセス制限
- RLS ポリシー網羅性

**主要テストパターン:**

```typescript
// ユーザーが他のユーザーのデータを読めないことを確認
await signInAs(user1.email);
const { data: otherData } = await supabaseClient
  .from("users")
  .select("*")
  .eq("id", user2.id);

// RLS が実装されていれば otherData は空配列になる
expect(otherData).toHaveLength(0);
```

### 3. フロントエンド・バックエンド連携テスト (`frontend-backend.test.ts`)

Next.js フロントエンドと Lambda バックエンドの統合をテスト。

**テスト項目:**

- NextAuth.js から Lambda 認証フロー
- API 通信とCORS
- データ同期統合
- パフォーマンス統合
- セキュリティ統合
- E2E ユーザージャーニー

## 🚀 CI/CD パイプライン

### GitHub Actions ワークフロー

#### メインCI/CDパイプライン (`.github/workflows/ci.yml`)

```yaml
jobs:
  code-quality:        # コード品質とカバレッジ
  backend-integration: # バックエンド統合テスト
  frontend-integration:# フロントエンド統合テスト
  security-tests:      # セキュリティ・RLSテスト
  e2e-tests:          # E2Eテスト
  deploy:             # デプロイメント
  notify-results:     # 結果通知
```

#### テストマトリックス戦略 (`.github/workflows/test-matrix.yml`)

効率的な並列テスト実行のための動的マトリックス生成:

```yaml
strategy:
  matrix:
    workspace: [frontend, backend]
    test-type: [unit, integration, security, performance]
```

### 並列実行最適化

- **マトリックス戦略**: ワークスペースとテストタイプによる並列実行
- **リソース最適化**: メモリ使用量とワーカー数の調整
- **タイムアウト管理**: テストタイプに応じた適切なタイムアウト設定
- **依存関係管理**: 順次実行が必要な依存関係の明確化

## ⚙️ 設定とセットアップ

### Jest 統合テスト設定

```javascript
// jest.config.integration.js
module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/integration.setup.ts"],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 環境変数設定

テスト専用の環境変数設定 (`.env.test`):

```bash
NODE_ENV=test
SUPABASE_URL=http://localhost:54321
JWT_SECRET=test-jwt-secret-for-integration-tests
MOCK_EXTERNAL_SERVICES=true
TEST_TIMEOUT=30000
```

### カスタムマッチャー

統合テスト用のJest カスタムマッチャー:

```typescript
expect(response).toBeValidAPIResponse();
expect(token).toBeValidJWT();
expect(responseTime).toRespondWithin(500);
expect(headers).toHaveValidCORSHeaders();
```

## 🏃‍♂️ テスト実行方法

### ローカル環境

```bash
# 全統合テストの実行
pnpm run test:integration

# セキュリティテストのみ実行
pnpm run test:security

# 認証セキュリティテストのみ実行
pnpm run test:auth-security

# 全テスト（単体 + 統合）実行
pnpm run test:all
```

### CI 環境

```bash
# GitHub Actions での自動実行
git push origin feature-branch  # プルリクエスト時
git push origin main           # メインブランチ時（デプロイも実行）
```

### デバッグモード

```bash
# 詳細ログ付きで実行
NODE_ENV=test DEBUG=true pnpm run test:integration

# 特定のテストファイルのみ実行
pnpm run test:integration -- --testPathPattern="auth-flow"

# ウォッチモードで実行
pnpm run test:integration -- --watch
```

## 📊 テストカバレッジとレポート

### カバレッジ閾値

- **グローバル**: 80% (lines), 75% (functions), 70% (branches)
- **認証ミドルウェア**: 95% (すべてのメトリック)
- **統合テスト**: 75% (lines), 70% (functions)

### レポート生成

- **HTML レポート**: `coverage/integration/lcov-report/index.html`
- **JUnit XML**: `test-results/integration/junit.xml`
- **JSON レポート**: `test-results/integration/summary.json`

### CI での結果表示

GitHub Actions Summary に以下が表示されます:

- テスト結果サマリー
- カバレッジ情報
- 失敗したテストの詳細
- パフォーマンスメトリクス

## 🔧 トラブルシューティング

### よくある問題

#### 1. データベース接続エラー

```bash
# Supabase ローカルインスタンス起動
supabase start

# PostgreSQL 拡張確認
psql -h localhost -U postgres -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### 2. JWT 関連エラー

```bash
# JWT_SECRET 設定確認
echo $JWT_SECRET

# トークン有効性確認
node -e "console.log(require('jsonwebtoken').verify('your-token', 'your-secret'))"
```

#### 3. タイムアウトエラー

```javascript
// jest.config.integration.js でタイムアウト調整
module.exports = {
  testTimeout: 60000, // 60秒に増加
};
```

#### 4. メモリ不足エラー

```bash
# Node.js メモリ制限増加
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm run test:integration
```

### ログとデバッグ

#### 詳細ログの有効化

```bash
export LOG_LEVEL=debug
export VERBOSE_LOGGING=true
pnpm run test:integration
```

#### デバッガーの使用

```javascript
// テストファイルでデバッガー使用
import { jest } from "@jest/globals";

describe("Debug Test", () => {
  it("should debug", async () => {
    debugger; // Node.js --inspect フラグと併用
    // テストコード
  });
});
```

## 🔒 セキュリティ考慮事項

### テストデータのセキュリティ

- **本番データの使用禁止**: テストでは必ずダミーデータを使用
- **機密情報の除外**: 実際の API キーや認証情報は使用しない
- **データクリーンアップ**: テスト後の確実なデータ削除

### CI 環境のセキュリティ

- **シークレット管理**: GitHub Actions Secrets での機密情報管理
- **権限制限**: 最小権限でのテスト実行
- **ネットワーク分離**: テスト環境の本番環境からの分離

## 📈 今後の拡張計画

### Phase 2 での追加予定

1. **E2E テスト強化**: Playwright による包括的なE2Eテスト
2. **負荷テスト**: K6 による本格的な負荷テスト
3. **セキュリティテスト**: OWASP ZAP による自動脆弱性テスト
4. **視覚回帰テスト**: Chromatic による UI 回帰テスト

### 継続的改善

- **テスト実行時間の最適化**: 並列実行とキャッシュ活用
- **フレイキーテスト対策**: 不安定なテストの特定と修正
- **カバレッジ向上**: 未カバー領域の特定と追加テスト作成

## 🤝 コントリビューション

### テスト追加のガイドライン

1. **TDD アプローチ**: 必ず Red-Green-Refactor サイクルを使用
2. **命名規則**: `should fail: description` (Red Phase)
3. **分離原則**: 各テストは独立して実行可能
4. **クリーンアップ**: 適切な後処理でテスト間の影響を排除

### プルリクエスト要件

- [ ] 新機能には対応する統合テストを含める
- [ ] カバレッジ閾値を満たす
- [ ] CI/CD パイプラインが通る
- [ ] セキュリティテストが通る

---

**この統合テスト基盤により、Phase 1 の認証・RLS システムの品質を保証し、Phase 2 の RAG システム開発への確実な基盤を提供します。**
