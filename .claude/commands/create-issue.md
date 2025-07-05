# GitHub Issue 作成コマンド

CLAUDE.mdファイルの内容とユーザーの要求「$ARGUMENTS」を基に、詳細なGitHub issueを作成してください。

## 実行手順：
1. CLAUDE.mdファイルを読み取り、プロジェクトのコンテキストを理解
2. ユーザーの要求を分析し、技術的な要件に変換
3. 以下の構造でissue内容を作成：
   - **タイトル**: 簡潔で説明的なタイトル
   - **説明**: 機能の目的と背景
   - **受け入れ条件**: 具体的な完了条件
   - **技術的な考慮事項**: 実装時の注意点
   - **タスク一覧**: チェックボックス形式の作業項目

4. `gh issue create` コマンドを使用してissueを作成
5. 作成されたissue番号とURLを表示

## コマンド例：
```bash
gh issue create \
  --title "機能: ユーザー認証システムの実装" \
  --body "$(cat issue_body.md)" \
  --label "enhancement" \
  --assignee "@me"
```

作成後、issue番号を記録し、次のステップ（ブランチ作成）の準備を行ってください。
