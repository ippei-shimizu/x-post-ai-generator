# Feature 開発開始コマンド

指定された GitHub issue 番号「$ARGUMENTS」を基に、新しい feature ブランチを作成して、TDD・設計書連携・品質保証を含む包括的な開発を開始してください。

## 実行手順：

### 1. **前提条件チェック**

```bash
# Git状態確認
git status
if [ $? -ne 0 ]; then
  echo "❌ Git repository not found"
  exit 1
fi

# Issue番号バリデーション
if ! [[ "$ARGUMENTS" =~ ^[0-9]+$ ]]; then
  echo "❌ Invalid issue number: $ARGUMENTS"
  exit 1
fi

# 設計書存在確認
if [ ! -f "CLAUDE.md" ]; then
  echo "❌ CLAUDE.md not found. Please ensure design document exists."
  exit 1
fi
```

### 2. **Issue 情報の詳細分析**

```bash
# Issue情報取得
echo "📋 Fetching issue #$ARGUMENTS details..."
gh issue view $ARGUMENTS --json title,body,labels,assignees,milestone > /tmp/issue_$ARGUMENTS.json

# Issue内容分析と構造化
echo "🔍 Analyzing issue requirements..."
```

**以下の情報を抽出・分析してください：**

- **機能要件**: 実装すべき具体的な機能
- **技術要件**: 使用技術・ライブラリ・API
- **セキュリティ要件**: 認証・認可・データ保護要件
- **テスト要件**: 単体・統合・E2E テストの範囲
- **UI/UX 要件**: コンポーネント・画面設計
- **パフォーマンス要件**: 速度・メモリ・スループット目標
- **依存関係**: 他の issue・コンポーネントとの関係

### 3. **設計書連携・コンテキスト抽出**

```bash
echo "📖 Extracting context from design document..."
```

**CLAUDE.md から以下を抽出してください：**

- **関連アーキテクチャ**: 該当する設計セクション
- **技術スタック**: 必要なライブラリ・フレームワーク
- **セキュリティガイドライン**: 適用すべきセキュリティ要件
- **コーディング規約**: TypeScript・React・Lambda 規約
- **テスト戦略**: TDD アプローチ・テストカテゴリ
- **データベーススキーマ**: 関連テーブル・RLS 設定

### 4. **実装計画の策定**

**以下の実装計画を作成してください：**

```markdown
## 実装計画: Issue #$ARGUMENTS

### 📋 機能概要

[issue から抽出した機能要件の要約]

### 🔧 技術実装アプローチ

- **フロントエンド**: [Next.js/React component strategy]
- **バックエンド**: [Lambda function architecture]
- **データベース**: [PostgreSQL schema changes]
- **認証・セキュリティ**: [JWT/RLS implementation]
- **外部統合**: [API integrations needed]

### 🧪 TDD 実装戦略

1. **Red Phase**: [失敗するテストケース]
2. **Green Phase**: [最小実装戦略]
3. **Refactor Phase**: [コード改善計画]

### 📁 影響ファイル

- **新規作成**: [予想される新規ファイル]
- **修正対象**: [既存ファイルの修正箇所]
- **テストファイル**: [作成すべきテストファイル]

### ⚠️ リスク・注意点

- [技術的リスク・制約事項]
- [セキュリティ考慮事項]
- [パフォーマンス影響]

### ✅ 完了条件

- [機能動作確認項目]
- [テスト合格条件]
- [品質基準]
```

### 5. **ブランチ作成とセットアップ**

```bash
# ブランチ名自動生成
echo "🌿 Creating feature branch..."
ISSUE_TITLE=$(gh issue view $ARGUMENTS --json title -q '.title')
FEATURE_NAME=$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
BRANCH_NAME="feature/$ARGUMENTS-$FEATURE_NAME"

# Git操作
git checkout main
git pull origin main
git checkout -b "$BRANCH_NAME"

echo "✅ Created branch: $BRANCH_NAME"
```

### 6. **開発環境準備・検証**

```bash
echo "🔧 Setting up development environment..."

# 依存関係チェック
echo "📦 Checking dependencies..."
if [ -f "frontend/package.json" ]; then
  cd frontend && pnpm install && cd ..
fi
if [ -f "backend/package.json" ]; then
  cd backend && pnpm install && cd ..
fi

# 環境変数チェック
echo "🔐 Checking environment variables..."
# .env.example と .env の比較チェックを実装

# テスト環境確認
echo "🧪 Verifying test environment..."
# Jest, Playwright, その他テストツールの動作確認

# データベース接続確認
echo "🗄️ Checking database connection..."
# Supabase接続・RLS設定確認

# 外部API接続確認
echo "🌐 Checking external API connections..."
# OpenAI, GitHub API等の接続確認
```

### 7. **開発コンテキスト設定**

**以下のコンテキスト情報を設定してください：**

```typescript
// 開発コンテキスト設定
interface DevelopmentContext {
  issueNumber: number;
  branchName: string;
  featureDescription: string;

  // 技術スタック
  frontendTech: string[];
  backendTech: string[];
  databaseSchema: string[];

  // セキュリティ要件
  authRequirements: string[];
  dataProtection: string[];

  // 品質要件
  testCoverage: number;
  performanceTargets: Record<string, number>;

  // 依存関係
  relatedIssues: number[];
  affectedComponents: string[];
}
```

### 8. **初期実装テンプレート作成**

```bash
echo "📝 Creating initial implementation templates..."
```

**issue 要件に基づいて以下を自動生成してください：**

- **コンポーネントテンプレート**: React component の骨格
- **Lambda 関数テンプレート**: AWS Lambda function の骨格
- **テストテンプレート**: Jest/Playwright test の骨格
- **型定義テンプレート**: TypeScript interface の骨格
- **データベースマイグレーション**: SQL migration の骨格

### 9. **TDD サイクル開始準備**

```bash
echo "🔴 Preparing TDD cycle..."

# Red Phase: 失敗するテストを先に作成
echo "Creating failing tests..."

# Green Phase: 最小実装の準備
echo "Preparing minimal implementation structure..."

# Refactor Phase: 改善計画の設定
echo "Setting up refactoring guidelines..."
```

### 10. **品質ゲート設定**

```bash
echo "🛡️ Setting up quality gates..."

# ESLint・Prettier設定確認
# TypeScript型チェック
# セキュリティルール確認
# テストカバレッジ設定
# パフォーマンス監視設定
```

### 11. **初期コミット・追跡開始**

```bash
# 詳細な初期コミット
git add .
git commit -m "feat(#$ARGUMENTS): initialize development environment

- Create feature branch for issue #$ARGUMENTS
- Set up implementation context and templates
- Configure TDD workflow and quality gates
- Prepare development environment

Related: #$ARGUMENTS"

git push -u origin "$BRANCH_NAME"

echo "🚀 Development environment ready!"
echo "📋 Issue: #$ARGUMENTS"
echo "🌿 Branch: $BRANCH_NAME"
echo "📖 Implementation plan generated"
echo "🧪 TDD cycle prepared"
echo "✅ Ready to start implementation"
```

## 実装開始チェックリスト

開発開始前に以下を確認してください：

### 技術準備

- [ ] 設計書の関連セクションを理解済み
- [ ] 必要な技術スタックを確認済み
- [ ] 依存関係・外部 API を特定済み
- [ ] データベーススキーマ変更を計画済み

### セキュリティ準備

- [ ] 認証・認可要件を確認済み
- [ ] RLS 設定が必要な箇所を特定済み
- [ ] データ保護要件を理解済み
- [ ] セキュリティテストを計画済み

### 品質準備

- [ ] TDD サイクルを理解済み
- [ ] テストカバレッジ目標を設定済み
- [ ] パフォーマンス要件を確認済み
- [ ] エラーハンドリング戦略を計画済み

### 開発準備

- [ ] 実装計画を作成済み
- [ ] ファイル構成を設計済み
- [ ] コンポーネント設計を完了済み
- [ ] API インターフェースを定義済み

**すべてのチェックリストが完了したら、TDD サイクルでの実装を開始してください。**
