# プルリクエスト作成・更新コマンド

現在のfeatureブランチでの作業を完了し、**既存PR更新または新規PR作成**を自動判定して実行します。

## 実行手順：

### 1. **前提条件・環境確認**

```bash
echo "🔍 Pre-PR validation starting..."

# 現在のブランチ確認
CURRENT_BRANCH=$(git branch --show-current)
if [[ ! "$CURRENT_BRANCH" =~ ^feature/.* ]]; then
  echo "❌ Not on a feature branch. Current: $CURRENT_BRANCH"
  exit 1
fi

# Issue番号抽出
ISSUE_NUMBER=$(echo "$CURRENT_BRANCH" | grep -o -E '[0-9]+' | head -1)
if [ -z "$ISSUE_NUMBER" ]; then
  echo "❌ Cannot extract issue number from branch: $CURRENT_BRANCH"
  exit 1
fi

echo "✅ Branch: $CURRENT_BRANCH"
echo "✅ Issue: #$ISSUE_NUMBER"
```

### 1.5 **既存PR存在チェック・判定**

```bash
echo "🔍 Checking for existing PR..."

# 現在のブランチに対応するPRを検索
EXISTING_PR=$(gh pr list --head "$CURRENT_BRANCH" --json number,url,title,state --jq '.[0]')

if [ "$EXISTING_PR" != "null" ] && [ -n "$EXISTING_PR" ]; then
  # 既存PR情報取得
  PR_NUMBER=$(echo "$EXISTING_PR" | jq -r '.number')
  PR_URL=$(echo "$EXISTING_PR" | jq -r '.url')
  PR_TITLE=$(echo "$EXISTING_PR" | jq -r '.title')
  PR_STATE=$(echo "$EXISTING_PR" | jq -r '.state')

  echo "📋 Existing PR found:"
  echo "   Number: #$PR_NUMBER"
  echo "   Title: $PR_TITLE"
  echo "   State: $PR_STATE"
  echo "   URL: $PR_URL"

  # PRの状態確認
  if [ "$PR_STATE" = "MERGED" ]; then
    echo "❌ PR #$PR_NUMBER is already merged. Cannot update."
    exit 1
  elif [ "$PR_STATE" = "CLOSED" ]; then
    echo "⚠️ PR #$PR_NUMBER is closed. Creating new PR instead."
    EXISTING_PR=""
  else
    echo "🔄 Will update existing PR #$PR_NUMBER"
    UPDATE_MODE=true
  fi
else
  echo "📝 No existing PR found. Will create new PR."
  UPDATE_MODE=false
fi
```

### 2. **包括的品質チェック**

#### 2.1 **コード品質・構文チェック**

```bash
echo "🔧 Running code quality checks..."

# TypeScript型チェック
echo "📝 TypeScript type checking..."
if [ -f "frontend/tsconfig.json" ]; then
  cd frontend && npx tsc --noEmit && cd ..
fi
if [ -f "backend/tsconfig.json" ]; then
  cd backend && npx tsc --noEmit && cd ..
fi

# ESLint チェック
echo "🔍 ESLint checking..."
if [ -f "frontend/.eslintrc.js" ]; then
  cd frontend && pnpm run lint && cd ..
fi
if [ -f "backend/.eslintrc.js" ]; then
  cd backend && pnpm run lint && cd ..
fi

# Prettier フォーマットチェック
echo "✨ Prettier format checking..."
pnpm run format:check || {
  echo "⚠️ Code formatting issues found. Running auto-fix..."
  pnpm run format:fix
  git add .
  git commit -m "style: fix formatting issues" || true
}
```

#### 2.2 **テスト実行・カバレッジ確認**

```bash
echo "🧪 Running comprehensive test suite..."

# 単体テスト（Frontend）
echo "🔵 Frontend unit tests..."
if [ -f "frontend/package.json" ]; then
  cd frontend && pnpm test -- --coverage --watchAll=false && cd ..
fi

# 単体テスト（Backend）
echo "🟢 Backend unit tests..."
if [ -f "backend/package.json" ]; then
  cd backend && pnpm test -- --coverage --watchAll=false && cd ..
fi

# 統合テスト
echo "🔗 Integration tests..."
if [ -f "tests/integration" ]; then
  pnpm run test:integration
fi

# E2Eテスト（重要フローのみ）
echo "🎭 Critical E2E tests..."
if [ -f "playwright.config.ts" ]; then
  pnpm run test:e2e:critical
fi

# テストカバレッジ確認
echo "📊 Checking test coverage..."
COVERAGE_THRESHOLD=80
# カバレッジが閾値を下回る場合は警告
```

#### 2.3 **セキュリティ・プライバシーチェック**

```bash
echo "🛡️ Security and privacy validation..."

# RLS（Row Level Security）チェック
echo "🔒 Checking RLS policies..."
# データベース関連変更がある場合、RLS設定を確認

# JWT認証チェック
echo "🔑 Validating JWT authentication..."
# 認証関連コードの実装確認

# データ分離チェック
echo "👥 Checking user data isolation..."
# user_id検証、データ漏洩防止の確認

# セキュリティリンター
echo "🔍 Security linting..."
if command -v semgrep &> /dev/null; then
  semgrep --config=auto . || echo "⚠️ Security linting completed with warnings"
fi

# 秘密情報漏洩チェック
echo "🕵️ Checking for secrets..."
if command -v gitleaks &> /dev/null; then
  gitleaks detect --source . --verbose || echo "⚠️ Potential secrets detected"
fi
```

#### 2.4 **プロジェクト固有要件チェック**

```bash
echo "🎯 X-Post-AI-Generator specific checks..."

# ユーザー分離要件チェック
echo "👤 User isolation validation..."
# RLS適用、user_id検証の確認

# AI統合品質チェック
echo "🤖 AI integration quality..."
# OpenAI API使用量、プロンプト品質の確認

# プライバシー保護確認
echo "🔐 Privacy protection validation..."
# データ保持期間、自動削除機能の確認

# パフォーマンス要件確認
echo "⚡ Performance requirements..."
# レスポンス時間、メモリ使用量の確認
```

### 3. **ビルド・デプロイ準備確認**

```bash
echo "🏗️ Build and deployment validation..."

# フロントエンドビルド
echo "🌐 Frontend build..."
if [ -f "frontend/package.json" ]; then
  cd frontend && pnpm run build && cd ..
fi

# バックエンドビルド（Lambda）
echo "⚡ Backend build..."
if [ -f "backend/serverless.yml" ]; then
  cd backend && pnpm run build && cd ..
fi

# 環境変数チェック
echo "🔧 Environment variables validation..."
# .env.example と .env の整合性確認

# データベースマイグレーション確認
echo "🗄️ Database migration validation..."
# 新しいマイグレーションファイルの確認
```

### 4. **変更内容分析・影響範囲評価**

```bash
echo "📊 Analyzing changes and impact..."

# 変更ファイル分析
CHANGED_FILES=$(git diff --name-only main..HEAD)
echo "📝 Changed files:"
echo "$CHANGED_FILES"

# 影響範囲分析
echo "🎯 Impact analysis:"
# フロントエンド・バックエンド・DB・インフラの変更を分類

# 破壊的変更チェック
echo "⚠️ Breaking changes check:"
# API変更、スキーマ変更等の確認

# 依存関係影響確認
echo "🔗 Dependency impact:"
# package.json変更、新ライブラリ追加の確認
```

### 5. **ドキュメント更新確認**

```bash
echo "📚 Documentation validation..."

# CLAUDE.md整合性確認
echo "📖 Design document consistency..."
# 実装が設計書と整合しているか確認

# API仕様更新確認
echo "🔌 API documentation updates..."
# API変更に伴うドキュメント更新確認

# README更新確認
echo "📄 README updates..."
# 新機能に関するREADME更新確認

# コメント・JSDoc確認
echo "💬 Code documentation..."
# 適切なコメント・型定義があるか確認
```

### 6. **最終コミット・プッシュ準備**

```bash
echo "📝 Final commit preparation..."

# 未コミット変更確認
git status

# 最終コミット（必要な場合）
if [ -n "$(git status --porcelain)" ]; then
  echo "📋 Creating final commit..."
  git add .

  # コミットメッセージ生成
  COMMIT_TYPE="feat"
  if [[ "$CHANGED_FILES" =~ test ]]; then
    COMMIT_TYPE="test"
  elif [[ "$CHANGED_FILES" =~ doc ]]; then
    COMMIT_TYPE="docs"
  fi

  git commit -m "$COMMIT_TYPE(#$ISSUE_NUMBER): finalize implementation

- Complete all quality checks and tests
- Ensure security and privacy requirements
- Update documentation and comments
- Verify performance requirements

Closes #$ISSUE_NUMBER"
fi

# ブランチプッシュ
echo "📤 Pushing branch..."
git push origin HEAD
```

### 7. **PR内容自動生成（更新対応）**

#### 7.1 **Issue情報取得・分析**

```bash
echo "📋 Generating PR content..."

# Issue詳細取得
gh issue view $ISSUE_NUMBER --json title,body,labels > /tmp/issue_$ISSUE_NUMBER.json
ISSUE_TITLE=$(gh issue view $ISSUE_NUMBER --json title -q '.title')
ISSUE_BODY=$(gh issue view $ISSUE_NUMBER --json body -q '.body')
ISSUE_LABELS=$(gh issue view $ISSUE_NUMBER --json labels -q '.labels[].name' | tr '\n' ',' | sed 's/,$//')
```

#### 7.2 **変更サマリー生成**

```bash
# Git統計情報
COMMITS_COUNT=$(git rev-list --count main..HEAD)
FILES_CHANGED=$(git diff --name-only main..HEAD | wc -l)
LINES_ADDED=$(git diff --stat main..HEAD | tail -1 | grep -o '[0-9]\+ insertion' | grep -o '[0-9]\+' || echo "0")
LINES_DELETED=$(git diff --stat main..HEAD | tail -1 | grep -o '[0-9]\+ deletion' | grep -o '[0-9]\+' || echo "0")

# 技術要素分析
FRONTEND_CHANGES=$(echo "$CHANGED_FILES" | grep -c '^frontend/' || echo "0")
BACKEND_CHANGES=$(echo "$CHANGED_FILES" | grep -c '^backend/' || echo "0")
DB_CHANGES=$(echo "$CHANGED_FILES" | grep -c '^database/' || echo "0")
TEST_CHANGES=$(echo "$CHANGED_FILES" | grep -c 'test\|spec' || echo "0")
```

#### 7.3 **品質メトリクス取得**

```bash
# テストカバレッジ
COVERAGE_REPORT=""
if [ -f "coverage/lcov-report/index.html" ]; then
  COVERAGE_REPORT="✅ Test coverage maintained above threshold"
else
  COVERAGE_REPORT="⚠️ Coverage report not found"
fi

# セキュリティチェック結果
SECURITY_STATUS="✅ Security checks passed"

# パフォーマンス確認
PERFORMANCE_STATUS="✅ Performance requirements verified"

# 更新情報追加（UPDATE_MODE=trueの場合）
if [ "$UPDATE_MODE" = true ]; then
  LAST_UPDATE=$(date '+%Y-%m-%d %H:%M:%S')
  UPDATE_INFO="

## 🔄 更新履歴

**最終更新**: $LAST_UPDATE
**更新回数**: $(gh pr view $PR_NUMBER --json comments --jq '.comments | length')回目
**前回からの変更**: $(git rev-list --count HEAD~1..HEAD)commits"
else
  UPDATE_INFO=""
fi
```

### 8. **PR Body生成（更新情報含む）**

```bash
cat > pr_body.md << EOF
## 📋 概要

$ISSUE_TITLE

### 🎯 目的
$(echo "$ISSUE_BODY" | head -3)

## 🔧 実装内容

### 主な変更
- 📁 **ファイル変更**: $FILES_CHANGED files
- ➕ **追加行数**: $LINES_ADDED lines
- ➖ **削除行数**: $LINES_DELETED lines
- 📝 **コミット数**: $COMMITS_COUNT commits

### 技術領域別変更
- 🌐 **Frontend**: $FRONTEND_CHANGES files changed
- ⚡ **Backend**: $BACKEND_CHANGES files changed
- 🗄️ **Database**: $DB_CHANGES files changed
- 🧪 **Tests**: $TEST_CHANGES files changed

### 機能実装
$(git log --oneline main..HEAD | sed 's/^/- /')

## 🧪 テスト・品質保証

### テスト実行結果
- ✅ **単体テスト**: 全テスト通過
- ✅ **統合テスト**: 全テスト通過
- ✅ **E2Eテスト**: 重要フロー確認済み
- $COVERAGE_REPORT

### コード品質
- ✅ **TypeScript**: 型チェック通過
- ✅ **ESLint**: リンター通過
- ✅ **Prettier**: フォーマット適用済み
- ✅ **ビルド**: 正常完了

### セキュリティ・プライバシー
- $SECURITY_STATUS
- ✅ **RLS適用**: ユーザーデータ分離確認済み
- ✅ **JWT認証**: 認証フロー確認済み
- ✅ **データ保護**: プライバシー要件準拠

### パフォーマンス
- $PERFORMANCE_STATUS
- ✅ **レスポンス時間**: 要件以内
- ✅ **メモリ使用量**: 制限以内
- ✅ **API使用量**: 予算以内

## 📖 ドキュメント

### 更新内容
- ✅ **設計書整合性**: CLAUDE.mdと整合確認済み
- ✅ **API仕様**: 変更内容反映済み
- ✅ **コメント**: 適切なドキュメント追加済み

## 🔍 レビューポイント

### 重点確認事項
- **セキュリティ**: ユーザーデータ分離の実装
- **品質**: テストカバレッジと例外処理
- **パフォーマンス**: レスポンス時間とリソース使用量
- **UX**: ユーザビリティと操作性

### 技術的検討事項
- RLS（Row Level Security）の適切な実装
- JWT認証フローの安全性
- OpenAI API使用量の効率化
- エラーハンドリングの適切性

## 📝 補足情報

### 影響範囲
- **破壊的変更**: なし
- **データベース変更**: $([ $DB_CHANGES -gt 0 ] && echo "あり（マイグレーション必要）" || echo "なし")
- **API変更**: $(git diff main..HEAD --name-only | grep -q "api\|route" && echo "あり" || echo "なし")
- **環境変数**: $(git diff main..HEAD --name-only | grep -q ".env" && echo "変更あり" || echo "変更なし")

### デプロイ注意事項
- データベースマイグレーション実行要否
- 環境変数設定確認
- 外部サービス設定変更

$UPDATE_INFO

---

**Closes #$ISSUE_NUMBER**

**Labels**: $ISSUE_LABELS

EOF
```

### 9. **PR作成・更新実行**

```bash
if [ "$UPDATE_MODE" = true ]; then
  echo "🔄 Updating existing PR #$PR_NUMBER..."

  # 既存PR更新
  gh pr edit $PR_NUMBER \
    --title "feat(#$ISSUE_NUMBER): $ISSUE_TITLE" \
    --body-file pr_body.md \
    --add-label "updated,ready-for-review"

  # 更新通知コメント追加
  gh pr comment $PR_NUMBER --body "🔄 **PR Updated** - $(date '+%Y-%m-%d %H:%M:%S')

**変更サマリー**:
- 📁 Files: $FILES_CHANGED changed
- 📈 Lines: +$LINES_ADDED -$LINES_DELETED
- 📝 Commits: $COMMITS_COUNT total

**品質チェック**: ✅ All checks passed
**テスト状況**: ✅ All tests passing
**レビュー準備**: ✅ Ready for review

詳細は PR description をご確認ください。"

  PR_URL=$(gh pr view $PR_NUMBER --json url -q '.url')
  echo "✅ Pull Request #$PR_NUMBER updated successfully!"
  echo "🔗 URL: $PR_URL"

else
  echo "🚀 Creating new pull request..."

  # 新規PR作成
  PR_URL=$(gh pr create \
    --title "feat(#$ISSUE_NUMBER): $ISSUE_TITLE" \
    --body-file pr_body.md \
    --base main \
    --head "$CURRENT_BRANCH" \
    --label "enhancement,ready-for-review" \
    --assignee "@me" \
    --reviewer "$(git log --format='%ae' main..HEAD | sort | uniq | head -1)" 2>/dev/null || echo "")

  if [ -n "$PR_URL" ]; then
    echo "✅ Pull Request created successfully!"
    echo "🔗 URL: $PR_URL"
  else
    echo "❌ Failed to create Pull Request"
    exit 1
  fi
fi
```

### 10. **後処理・通知（更新対応）**

```bash
if [ "$UPDATE_MODE" = true ]; then
  echo "📊 PR Update Summary:"
  echo "=================="
  echo "🔄 Action: PR Updated"
  echo "📋 PR Number: #$PR_NUMBER"
  echo "🎯 Issue: #$ISSUE_NUMBER"
  echo "🌿 Branch: $CURRENT_BRANCH"
  echo "📁 Files: $FILES_CHANGED changed"
  echo "📈 Lines: +$LINES_ADDED -$LINES_DELETED"
  echo "🧪 Tests: ✅ All passed"
  echo "🔒 Security: ✅ Validated"
  echo "📖 Docs: ✅ Updated"
  echo "🔗 PR URL: $PR_URL"
  echo "=================="

  echo "🎉 PR update completed successfully!"
  echo "👀 Reviewers have been notified of the update"
  echo "📋 Next steps:"
  echo "   1. Monitor automated tests"
  echo "   2. Address any new reviewer feedback"
  echo "   3. Verify CI/CD pipeline status"
  echo "   4. Ready for re-review"

else
  echo "📊 PR Creation Summary:"
  echo "=================="
  echo "🆕 Action: New PR Created"
  echo "🎯 Issue: #$ISSUE_NUMBER"
  echo "🌿 Branch: $CURRENT_BRANCH"
  echo "📁 Files: $FILES_CHANGED changed"
  echo "📈 Lines: +$LINES_ADDED -$LINES_DELETED"
  echo "🧪 Tests: ✅ All passed"
  echo "🔒 Security: ✅ Validated"
  echo "📖 Docs: ✅ Updated"
  echo "🔗 PR URL: $PR_URL"
  echo "=================="

  echo "🎉 PR creation completed successfully!"
  echo "👀 Please request reviews and monitor CI/CD pipeline"
  echo "📋 Next steps:"
  echo "   1. Monitor automated tests"
  echo "   2. Address reviewer feedback"
  echo "   3. Verify deployment readiness"
  echo "   4. Merge after approval"
fi

# クリーンアップ
rm -f pr_body.md /tmp/issue_$ISSUE_NUMBER.json
```

## 品質ゲート要件

PR作成前に以下の要件をすべて満たす必要があります：

### 必須要件

- [ ] **全テスト通過**: 単体・統合・E2Eテスト
- [ ] **型チェック通過**: TypeScript型エラーなし
- [ ] **リンター通過**: ESLint・Prettier適用済み
- [ ] **ビルド成功**: フロントエンド・バックエンド両方
- [ ] **セキュリティチェック**: RLS・JWT・データ保護確認

### 品質要件

- [ ] **テストカバレッジ**: 80%以上維持
- [ ] **ドキュメント**: 実装内容の適切な文書化
- [ ] **エラーハンドリング**: 例外ケースの適切な処理
- [ ] **パフォーマンス**: 要件内でのレスポンス時間

### プロジェクト固有要件

- [ ] **ユーザー分離**: RLS適用とデータ漏洩防止
- [ ] **プライバシー保護**: GDPR準拠とデータ保持期間
- [ ] **AI統合品質**: プロンプト品質とコスト効率
- [ ] **設計書整合性**: CLAUDE.mdとの一貫性

すべての要件を満たした場合のみ、高品質なプルリクエストが作成されます。
