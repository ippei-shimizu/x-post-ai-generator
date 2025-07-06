# MCP (Model Context Protocol) セットアップガイド

## 概要

このプロジェクトでは、Claude CodeでSupabase MCP サーバーを使用してデータベースとの統合を強化します。

## セットアップ手順

### 1. 必要な値の取得

#### Supabase Project Reference
1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. Settings → General → Reference ID をコピー

#### Supabase Personal Access Token
1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. 右上のプロフィールアイコン → Account Settings
3. Access Tokens タブ → Generate new token
4. 適切な名前を付けて Generate
5. トークンをコピー（一度だけ表示されます）

### 2. 設定ファイルの更新

`.mcp.json.example` ファイルをコピーして `.mcp.json` を作成し、以下の値を置き換えてください：

```bash
cp .mcp.json.example .mcp.json
```

`.mcp.json` ファイル内の値を更新：
- `<your-supabase-project-ref>` → 実際のプロジェクトリファレンス
- `<your-supabase-personal-access-token>` → 実際のパーソナルアクセストークン

### 3. Claude Code での設定

1. Claude Code を再起動
2. MCP サーバーが正常に接続されていることを確認
3. Supabase関連のツールが利用可能になります

## 利用可能な機能

Supabase MCP サーバーにより、以下の機能が Claude Code で利用可能になります：

- **データベーススキーマの参照**: テーブル構造の確認
- **クエリの実行**: 読み取り専用でのSQLクエリ実行
- **RLSポリシーの確認**: Row Level Security ポリシーの検証
- **インデックスの分析**: パフォーマンス最適化の支援

## セキュリティに関する注意

- `.mcp.json` ファイルには機密情報が含まれているため、Git追跡から除外されています
- `--read-only` フラグにより、データベースへの変更は制限されています
- Personal Access Token は定期的に更新することを推奨します

## トラブルシューティング

### MCP サーバーが接続できない場合

1. Project Reference が正しいか確認
2. Personal Access Token が有効か確認
3. ネットワーク接続を確認
4. Claude Code を再起動

### 権限エラーが発生する場合

1. Personal Access Token の権限を確認
2. Supabase プロジェクトへのアクセス権限を確認
3. プロジェクトが正しく指定されているか確認

## 参考リンク

- [Supabase MCP Server Documentation](https://github.com/supabase/mcp-server-supabase)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code MCP Integration](https://docs.anthropic.com/en/docs/claude-code/mcp)