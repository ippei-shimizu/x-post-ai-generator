# プルリクエスト作成コマンド

現在の feature ブランチでの作業を完了し、main ブランチへのプルリクエストを作成してください。

## 実行手順：

1. **作業の最終確認**

   - 全ての変更をコミット済みか確認
   - CLAUDE.md の規約に準拠しているか確認
   - テストが通過するか確認

2. **コード品質チェック**

   ```bash
   # リンターの実行（プロジェクトに応じて調整）
   pnpm run lint

   # テストの実行
   pnpm test

   # ビルドの確認
   pnpm run build
   ```

3. **git status の確認と最終コミット**

   ```bash
   git status
   git add .
   git commit -m "feat: 機能説明 (closes #issue-number)"
   ```

4. **ブランチのプッシュ**

   ```bash
   git push origin HEAD
   ```

5. **PR 内容の生成**

   - 現在のブランチ名から issue 番号を抽出
   - issue の内容を参照して PR 説明を作成
   - 変更内容のサマリーを生成
   - テスト結果の記載

6. **プルリクエストの作成**

   ```bash
   gh pr create \
     --title "feat: [Issue #番号] 機能タイトル" \
     --body "$(cat pr_body.md)" \
     --base main \
     --head feature/current-branch \
     --label "enhancement" \
     --assignee "@me"
   ```

7. **PR URL の表示**
   作成された PR の URL を表示し、レビュー依頼を促す

## PR Body テンプレート：

```markdown
## 概要

[issue 内容の要約]

## 変更内容

- [ ] 機能 A の実装
- [ ] テストの追加
- [ ] ドキュメントの更新

## テスト

- [ ] 全テストが通過
- [ ] 新機能のテストを追加

## 関連 Issue

Closes #[issue 番号]
```
