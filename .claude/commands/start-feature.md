# Feature開発開始コマンド

指定されたGitHub issue番号「$ARGUMENTS」を基に、新しいfeatureブランチを作成して開発を開始してください。

## 実行手順：

1. **Issue情報の取得**
   ```bash
   gh issue view $ARGUMENTS
   ```
   - issueの詳細を確認
   - タイトル、説明、タスク一覧を理解

2. **ブランチ名の生成**
   - 形式: `feature/{issue-number}-{feature-name}`
   - 例: `feature/123-user-authentication`
   - feature-nameはissueタイトルから自動生成（英語、ハイフン区切り、小文字）

3. **ブランチの作成と切り替え**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/{issue-number}-{feature-name}
   ```

4. **開発環境の準備**
   - CLAUDE.mdの指示に従って必要な環境を確認
   - 依存関係のインストール
   - テストの実行確認

5. **開発コンテキストの設定**
   - issueの要件を分析
   - 実装すべき機能の詳細を把握
   - 必要なファイルの特定

6. **初期コミット**
   ```bash
   git commit --allow-empty -m "feat: start working on issue #$ARGUMENTS"
   git push -u origin feature/{issue-number}-{feature-name}
   ```

開発準備完了後、issue内容に基づいて実装を開始してください。
