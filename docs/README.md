# 📚 X-Post-AI-Generator ドキュメント

このディレクトリには、X-Post-AI-Generatorプロジェクトの設定・セットアップ関連のドキュメントが含まれています。

## 📋 ドキュメント一覧

### 🔧 環境設定
- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - 環境変数管理ガイド
  - 開発・ステージング・本番環境の設定方法
  - 環境別ファイル管理と切り替え方法

### 🗄️ データベース設定
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Supabaseデータベース設定ガイド
  - ローカル開発環境の構築手順
  - PostgreSQL + pgvector + RLS設定

### 🔐 認証設定
- **[GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)** - Google OAuth認証設定ガイド
  - Google Cloud Console設定
  - NextAuth.js連携手順

### 🔗 MCP設定
- **[MCP_SETUP.md](./MCP_SETUP.md)** - Model Context Protocol設定ガイド
  - Claude Code統合設定
  - Supabase MCP サーバー設定

### ✅ 実装完了記録
- **[ISSUE_12_COMPLETION.md](./ISSUE_12_COMPLETION.md)** - Issue #12実装完了記録
  - Supabase初期化タスクの実装記録
  - 実装済み機能一覧

## 🗂️ 関連ドキュメント

### 🏗️ プロジェクト設計
- **[../CLAUDE.md](../CLAUDE.md)** - プロジェクト設計書
  - アーキテクチャ全体設計
  - 開発ガイドライン
  - TDD実装方針

### 🗄️ データベース
- **[../database/README.md](../database/README.md)** - データベース設計書
  - テーブル設計詳細
  - マイグレーション手順
  - RLS設定方法

## 🚀 クイックスタート

1. **環境設定**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)で環境変数を設定
2. **データベース**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)でローカルSupabaseを起動
3. **認証設定**: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)でOAuth設定
4. **MCP設定**: [MCP_SETUP.md](./MCP_SETUP.md)でClaude Code統合

## 📝 更新履歴

- 2025-01-06: ドキュメント整理・統合 (Issue #12完了)
- 2025-01-06: 環境変数管理ガイド追加
- 2025-01-06: Supabase・MCP設定ガイド追加

---

💡 **ヒント**: 各ドキュメントは独立して読めるように設計されています。必要な部分から開始してください。