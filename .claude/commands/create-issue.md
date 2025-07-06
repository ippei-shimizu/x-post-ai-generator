# GitHub Issue作成コマンド

CLAUDE.mdの設計書を基に、ユーザー要求「$ARGUMENTS」から詳細で実装可能なGitHub issueを自動生成します。

## 実行手順：

### 1. **前提条件・環境確認**

```bash
echo "📋 GitHub Issue creation starting..."

# 引数確認
if [ -z "$ARGUMENTS" ]; then
  echo "❌ Usage: create-issue <feature-description>"
  echo "Example: create-issue 'ユーザー認証システムの実装'"
  exit 1
fi

USER_REQUEST="$ARGUMENTS"
echo "📝 User request: $USER_REQUEST"

# 設計書存在確認
if [ ! -f "CLAUDE.md" ]; then
  echo "❌ CLAUDE.md not found. Design document is required."
  exit 1
fi

# GitHub CLI確認
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI not found. Please install gh command."
  exit 1
fi

# GitHub認証確認
gh auth status || {
  echo "❌ GitHub authentication required. Run: gh auth login"
  exit 1
}

echo "✅ Prerequisites validated"
```

### 2. **設計書分析・コンテキスト抽出**

```bash
echo "📖 Analyzing design document..."

# CLAUDE.mdから関連情報を抽出
echo "🔍 Extracting project context from CLAUDE.md..."
```

**以下の情報をCLAUDE.mdから自動抽出してください：**

- **プロジェクト概要**: X-Post-AI-Generatorの目的・特徴
- **技術スタック**: Next.js, AWS Lambda, Supabase, OpenAI等
- **アーキテクチャ要件**: ユーザー分離、RLS、RAGシステム
- **セキュリティ要件**: データ保護、プライバシー、認証要件
- **品質要件**: TDD、テストカバレッジ、パフォーマンス
- **フェーズ情報**: Phase 1-4の進捗と依存関係

### 3. **要求分析・技術要件変換**

```bash
echo "🔬 Analyzing user requirements..."

# 要求を分析して技術要件に変換
ANALYSIS_PROMPT="Based on CLAUDE.md context and user request '$USER_REQUEST', analyze:
1. Feature category (auth, rag, ai, ui, security, etc.)
2. Implementation complexity (simple/medium/complex)
3. Required technology components
4. Security implications
5. User data isolation requirements
6. Testing strategy needed
7. Dependencies on other features
8. Estimated implementation time"

echo "📊 Requirement analysis completed"
```

### 4. **優先度・フェーズ判定**

```bash
echo "📈 Determining priority and phase..."

# フェーズ判定ロジック
PHASE_ANALYSIS="Determine appropriate phase based on:
- Phase 1: Basic infrastructure, auth, database setup
- Phase 2: RAG system, data collection, vector search
- Phase 3: AI integration, post generation, UI
- Phase 4: Optimization, monitoring, scaling"

# 優先度判定
PRIORITY_ANALYSIS="Determine priority based on:
- Critical: Security, auth, core infrastructure
- High: Main features, user-facing functionality
- Medium: Improvements, optimizations
- Low: Nice-to-have features, documentation"

echo "🎯 Phase and priority determined"
```

### 5. **Issue内容自動生成**

#### 5.1 **タイトル生成**

```bash
echo "📝 Generating issue title..."

# 命名規則に基づくタイトル生成
TITLE_PATTERN="[Phase X-Y]: [Category] - [Brief Description]"
# 例: "Phase 1-2: Auth - Google OAuth認証システム実装"
```

#### 5.2 **詳細内容生成**

```bash
echo "📄 Generating detailed issue content..."

cat > issue_body.md << 'EOF'
## 📋 概要

### 🎯 目的
[ユーザー要求から抽出した目的と背景]

### 🔧 実装範囲
[具体的な実装内容の詳細]

## 🏗️ 技術要件

### フロントエンド要件
- **技術**: Next.js 15+, TypeScript, React
- **コンポーネント**: [必要なコンポーネント一覧]
- **状態管理**: [Zustand/TanStack Query使用箇所]
- **UI/UX**: [shadcn/ui、Tailwind CSS要件]

### バックエンド要件
- **技術**: AWS Lambda (Node.js 18), API Gateway
- **関数**: [必要なLambda関数一覧]
- **外部API**: [OpenAI, GitHub等の統合要件]
- **処理時間**: [パフォーマンス要件]

### データベース要件
- **技術**: Supabase PostgreSQL + pgvector
- **スキーマ変更**: [テーブル変更・追加内容]
- **RLS設定**: [Row Level Security実装要件]
- **ベクトル検索**: [pgvector関連要件]

## 🛡️ セキュリティ・プライバシー要件

### ユーザーデータ分離
- [ ] RLS（Row Level Security）の適切な実装
- [ ] user_id検証の徹底
- [ ] データ漏洩防止機能

### 認証・認可
- [ ] JWT認証フローの実装
- [ ] Google OAuth統合（該当する場合）
- [ ] セッション管理の安全性

### プライバシー保護
- [ ] GDPR準拠の実装
- [ ] データ保持期間（30日）の実装
- [ ] ユーザー同意管理

## 🧪 品質・テスト要件

### TDD実装戦略
**Red Phase（失敗するテスト作成）:**
- [ ] [具体的なテストケース1]
- [ ] [具体的なテストケース2]
- [ ] [エラーケーステスト]

**Green Phase（最小実装）:**
- [ ] [基本機能実装]
- [ ] [必要最小限の処理]

**Refactor Phase（改善）:**
- [ ] [パフォーマンス最適化]
- [ ] [エラーハンドリング強化]
- [ ] [コード品質向上]

### テストカバレッジ
- [ ] 単体テスト: 80%以上
- [ ] 統合テスト: 主要フロー
- [ ] E2Eテスト: ユーザージャーニー
- [ ] セキュリティテスト: データ分離確認

## 📋 実装タスク

### フロントエンド実装
- [ ] [コンポーネント1]の実装
- [ ] [コンポーネント2]の実装
- [ ] [状態管理]の実装
- [ ] [API連携]の実装
- [ ] [エラーハンドリング]の実装

### バックエンド実装
- [ ] [Lambda関数1]の実装
- [ ] [Lambda関数2]の実装
- [ ] [外部API統合]の実装
- [ ] [認証ミドルウェア]の実装

### データベース実装
- [ ] [テーブル設計]の実装
- [ ] [マイグレーション]の作成
- [ ] [RLSポリシー]の実装
- [ ] [インデックス]の最適化

### テスト実装
- [ ] 単体テスト作成
- [ ] 統合テスト作成
- [ ] E2Eテスト作成
- [ ] セキュリティテスト作成

## ⚡ パフォーマンス要件

### レスポンス時間
- [ ] API応答時間: < 3秒
- [ ] ページ読み込み: < 2秒
- [ ] ベクトル検索: < 1秒（該当する場合）

### リソース使用量
- [ ] Lambda実行時間: < 15分
- [ ] メモリ使用量: < 512MB
- [ ] データベース効率: 適切なインデックス

## 🔗 依存関係

### 前提条件
- [ ] [依存するissue #XX]の完了
- [ ] [必要な環境設定]の完了
- [ ] [外部サービス設定]の完了

### 影響範囲
- [ ] [影響を受ける既存機能]
- [ ] [変更が必要な関連コンポーネント]
- [ ] [マイグレーション要否]

## 📊 受け入れ条件

### 機能要件
- [ ] [具体的な機能1]が正常に動作する
- [ ] [具体的な機能2]が正常に動作する
- [ ] [エラーケース]が適切に処理される

### 非機能要件
- [ ] 全テストが通過する（カバレッジ80%以上）
- [ ] セキュリティ要件を満たす
- [ ] パフォーマンス要件を満たす
- [ ] ユーザビリティ要件を満たす

### 品質要件
- [ ] コードレビューを通過する
- [ ] セキュリティレビューを通過する
- [ ] ドキュメントが整備される
- [ ] CLAUDE.mdとの整合性が確認される

## 📝 実装メモ

### 技術的考慮事項
- [実装時の注意点]
- [パフォーマンス最適化のポイント]
- [セキュリティ実装のポイント]

### 参考情報
- [関連ドキュメント]
- [参考実装]
- [外部リソース]

## 📅 見積もり

- **実装時間**: [X]時間
- **テスト時間**: [Y]時間
- **レビュー時間**: [Z]時間
- **総合計**: [合計]時間

**完了予定**: [実装予定日]

EOF

echo "✅ Issue content generated"
```

### 6. **ラベル・優先度設定**

```bash
echo "🏷️ Setting labels and priority..."

# 機能カテゴリ別ラベル
CATEGORY_LABELS=""
case "$USER_REQUEST" in
  *"認証"*|*"auth"*|*"ログイン"*) CATEGORY_LABELS="auth,security" ;;
  *"AI"*|*"生成"*|*"OpenAI"*) CATEGORY_LABELS="ai,enhancement" ;;
  *"データベース"*|*"DB"*|*"Supabase"*) CATEGORY_LABELS="database,infrastructure" ;;
  *"UI"*|*"コンポーネント"*|*"画面"*) CATEGORY_LABELS="frontend,ui" ;;
  *"API"*|*"Lambda"*|*"バックエンド"*) CATEGORY_LABELS="backend,api" ;;
  *"テスト"*|*"TDD"*) CATEGORY_LABELS="testing,quality" ;;
  *"セキュリティ"*|*"RLS"*) CATEGORY_LABELS="security,privacy" ;;
  *) CATEGORY_LABELS="enhancement" ;;
esac

# 優先度ラベル
PRIORITY_LABEL="priority-medium"  # デフォルト

# フェーズラベル
PHASE_LABEL="phase-1"  # 分析結果に基づいて設定

# 工数ラベル
EFFORT_LABEL="effort-medium"  # 分析結果に基づいて設定

FINAL_LABELS="$CATEGORY_LABELS,$PRIORITY_LABEL,$PHASE_LABEL,$EFFORT_LABEL"

echo "🏷️ Labels: $FINAL_LABELS"
```

### 7. **Issue作成実行**

```bash
echo "🚀 Creating GitHub issue..."

# Issue作成
ISSUE_URL=$(gh issue create \
  --title "$(cat issue_title.txt)" \
  --body-file issue_body.md \
  --label "$FINAL_LABELS" \
  --assignee "@me" \
  --project "X-Post-AI-Generator Development" 2>/dev/null || echo "")

if [ -n "$ISSUE_URL" ]; then
  # Issue番号抽出
  ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -o '[0-9]\+$')

  echo "✅ Issue created successfully!"
  echo "📋 Issue #$ISSUE_NUMBER"
  echo "🔗 URL: $ISSUE_URL"
  echo "🏷️ Labels: $FINAL_LABELS"
else
  echo "❌ Failed to create issue"
  exit 1
fi
```

### 8. **関連作業の準備**

```bash
echo "📋 Preparing related workflows..."

# Milestoneへの追加（該当する場合）
if [ "$PHASE_LABEL" = "phase-1" ]; then
  gh issue edit $ISSUE_NUMBER --milestone "Phase 1: Foundation" 2>/dev/null || echo "⚠️ Milestone not found"
elif [ "$PHASE_LABEL" = "phase-2" ]; then
  gh issue edit $ISSUE_NUMBER --milestone "Phase 2: RAG System" 2>/dev/null || echo "⚠️ Milestone not found"
fi

# 依存関係のある他のissueとの関連付け
echo "🔗 Related issues:"
gh issue list --label "$CATEGORY_LABELS" --limit 5 --state open | head -3

# 次ステップの提案
echo ""
echo "📋 Next steps:"
echo "   1. Review and refine issue details if needed:"
echo "      gh issue edit $ISSUE_NUMBER"
echo "   2. Start implementation:"
echo "      claude-code start-feature $ISSUE_NUMBER"
echo "   3. Add to project board if available"
echo "   4. Notify team members if needed"
```

### 9. **実装計画生成**

```bash
echo "📊 Generating implementation plan..."

cat > implementation_plan_$ISSUE_NUMBER.md << EOF
# Implementation Plan: Issue #$ISSUE_NUMBER

## 📅 Development Timeline

### Week 1: Design & Setup
- [ ] Detailed technical design
- [ ] Database schema finalization
- [ ] API interface design
- [ ] Test case design

### Week 2: Core Implementation
- [ ] TDD Red Phase: Failing tests
- [ ] TDD Green Phase: Basic implementation
- [ ] Core functionality development

### Week 3: Integration & Testing
- [ ] Integration testing
- [ ] Security validation
- [ ] Performance testing
- [ ] TDD Refactor Phase

### Week 4: Polish & Deploy
- [ ] Code review
- [ ] Documentation updates
- [ ] PR creation and merge
- [ ] Deployment verification

## 🔄 Development Workflow

1. **Start Development**
   \`\`\`bash
   claude-code start-feature $ISSUE_NUMBER
   \`\`\`

2. **Regular Commits**
   \`\`\`bash
   git commit -m "feat(#$ISSUE_NUMBER): implement [specific-feature]"
   \`\`\`

3. **Create PR**
   \`\`\`bash
   claude-code create-pr
   \`\`\`

## 📚 Resources

- Design Document: CLAUDE.md
- Issue: #$ISSUE_NUMBER
- Implementation Guide: [Relevant sections]

EOF

echo "📋 Implementation plan saved: implementation_plan_$ISSUE_NUMBER.md"
```

### 10. **最終サマリー・レポート**

```bash
echo "📊 Issue Creation Summary:"
echo "=========================="
echo "📝 Request: $USER_REQUEST"
echo "📋 Issue: #$ISSUE_NUMBER"
echo "🎯 Category: $CATEGORY_LABELS"
echo "⚡ Priority: $PRIORITY_LABEL"
echo "🗓️ Phase: $PHASE_LABEL"
echo "⏰ Effort: $EFFORT_LABEL"
echo "🔗 URL: $ISSUE_URL"
echo "=========================="

# クリーンアップ
rm -f issue_body.md issue_title.txt 2>/dev/null

echo "🎉 Issue creation completed successfully!"
echo "📋 Ready for development workflow:"
echo "   Next: claude-code start-feature $ISSUE_NUMBER"
```

## 🎯 使用例

### **基本的な使用方法**

```bash
# 認証機能の実装
claude-code create-issue "Google OAuth認証システムの実装"

# AI統合機能
claude-code create-issue "OpenAI APIを使った投稿生成機能"

# データベース機能
claude-code create-issue "ユーザー分離型RAGシステムの実装"

# UI機能
claude-code create-issue "投稿管理ダッシュボードUI作成"
```

### **高度な使用方法**

```bash
# 複雑な機能要求
claude-code create-issue "ユーザー固有のベクトル検索システムでRLS保護とパフォーマンス最適化を含む実装"

# セキュリティ関連
claude-code create-issue "JWT認証ミドルウェアの実装とセキュリティ監査機能"

# パフォーマンス最適化
claude-code create-issue "Lambda関数の実行時間最適化とコスト削減"
```

## 🔧 カスタマイズ設定

### **プロジェクト固有設定**

```bash
# プロジェクト名設定
PROJECT_NAME="X-Post-AI-Generator"

# デフォルトラベル設定
DEFAULT_LABELS="enhancement,needs-review"

# デフォルト担当者
DEFAULT_ASSIGNEE="@me"

# マイルストーン自動設定
AUTO_MILESTONE=true
```

### **テンプレート拡張**

```bash
# カスタムテンプレートディレクトリ
TEMPLATE_DIR=".github/issue_templates"

# プロジェクト固有セクション追加
CUSTOM_SECTIONS="ai-integration,user-isolation,cost-analysis"
```

このコマンドにより、CLAUDE.mdの設計思想に完全に準拠した、実装可能で詳細なGitHub issueが自動生成されます。
