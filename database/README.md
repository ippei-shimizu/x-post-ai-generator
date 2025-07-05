# X-Post-AI-Generator データベースセットアップ

## 概要

このディレクトリは、X-Post-AI-Generatorプロジェクトのデータベーススキーマ、マイグレーション、関数、テストを含んでいます。データベースはPostgreSQLとpgvector拡張機能を使用してベクトル類似度検索を行い、Row Level Security（RLS）によってユーザーデータを完全に分離します。

## 主要機能

- **ユーザーデータ分離**: RLSポリシーを使用したユーザーデータの完全分離
- **ベクトル検索**: セマンティックコンテンツ検索のためのpgvector統合
- **監査ログ**: コスト追跡と分析のためのAPI使用量ログ
- **自動クリーンアップ**: ストレージ管理のための生コンテンツ30日期限

## ディレクトリ構造

```
database/
├── migrations/           # データベーススキーママイグレーション
│   ├── 001_create_initial_schema.sql
│   └── 002_enable_rls_policies.sql
├── functions/           # PostgreSQL関数
│   └── search_user_content.sql
├── tests/              # データベーステスト
│   └── rls_user_isolation_test.sql
└── README.md           # このファイル
```

## セットアップ手順

### 1. 前提条件

- PostgreSQL 14+ with pgvector拡張機能
- Supabase CLI（ローカル開発用）
- UUID-OSSP拡張機能

### 2. ローカル開発環境セットアップ

```bash
# Supabaseを初期化（まだ行っていない場合）
npx supabase init

# ローカルSupabaseを開始
npx supabase start

# マイグレーションを適用
npx supabase db push

# テストを実行
npx supabase db test
```

### 3. 本番環境セットアップ

1. 新しいSupabaseプロジェクトを作成
2. SQLエディタでvector拡張機能を有効化：
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Supabaseダッシュボードまたは CLI を通じてマイグレーションを適用
4. RLSポリシーを設定
5. Google OAuth プロバイダーを設定

## データベーススキーマ

### コアテーブル

- **users**: ユーザー認証とプロフィールデータ
- **personas**: コンテンツ生成用のユーザー固有AIペルソナ
- **generated_posts**: AI生成されたソーシャルメディア投稿
- **content_sources**: ユーザー設定データソース（GitHub、RSS等）
- **raw_content**: 収集されたコンテンツ（30日保持）
- **content_chunks**: ベクトル処理用テキストチャンク
- **content_embeddings**: 類似度検索用ベクトル埋め込み
- **user_settings**: ユーザー固有設定
- **api_usage_logs**: APIコスト追跡と分析

### セキュリティ機能

#### Row Level Security（RLS）
すべてのテーブルにRLSポリシーが実装され、ユーザーが自分のデータのみにアクセスできることを保証：

```sql
-- ポリシー例
CREATE POLICY "Users can view own personas" ON personas
    FOR SELECT USING (auth.uid() = user_id);
```

#### ベクトル検索分離
`search_user_content` 関数には追加のセキュリティチェックが含まれています：

```sql
-- ユーザーアクセス検証
IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot search other user content';
END IF;
```

## 関数

### search_user_content()
ユーザー自身のコンテンツ内でベクトル類似度検索を実行：
- **入力**: user_id、query_vector、similarity_threshold、match_count
- **出力**: 類似度スコア付きの関連コンテンツチャンク
- **セキュリティ**: ユーザーデータ分離を強制

### get_user_rag_metrics()
ユーザー固有RAGシステムパフォーマンスを分析：
- **入力**: user_id、date_range
- **出力**: 品質メトリクスと使用統計
- **セキュリティ**: ユーザースコープ分析のみ

## テスト

### RLSテスト
分離テストを実行してセキュリティを検証：

```bash
psql -f database/tests/rls_user_isolation_test.sql
```

### テストカバレッジ
- すべてのテーブルでのユーザーデータ分離
- ベクトル検索セキュリティ
- 関数アクセス制御
- ユーザー間データアクセス防止

## パフォーマンス考慮事項

### インデックス
ユーザースコープクエリ用に最適化されたインデックス：
- `idx_content_embeddings_user_id`: 高速ユーザーフィルタリング
- `idx_content_embeddings_vector`: ベクトル類似度検索
- `idx_*_user_*`: ユーザースコープ複合インデックス

### ベクトル検索最適化
- 1536次元ベクトル用の100リストIVFFLATインデックス
- セマンティックマッチング用コサイン類似度
- ユーザー別設定可能な類似度閾値

## 監視とメンテナンス

### 自動クリーンアップ
- 生コンテンツは30日で期限切れ
- 期限切れコンテンツは関連テーブルにカスケード
- ストレージ使用量を最適化

### コスト追跡
- ユーザー別API使用量ログ
- トークン消費追跡
- 操作タイプ別コスト分析

## 環境変数

データベース接続に必要な環境変数：

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

## セキュリティベストプラクティス

1. **ユーザーデータを含むテーブルでRLSを無効化しない**
2. **スキーマ変更後は常にポリシーをテストする**
3. **サービスロールキーは管理操作のみに使用する**
4. **データベースアクセスパターンの定期セキュリティ監査**
5. **ログでのポリシー違反を監視する**

## トラブルシューティング

### よくある問題

1. **RLSポリシー違反**
   - `auth.uid()` が適切に設定されているか確認
   - user_id カラムが認証済みユーザーと一致するか検証
   - ポリシーを単独でテストする

2. **ベクトル検索パフォーマンス**
   - 適切なインデックス作成を確認
   - ベクトル次元を確認（1536である必要がある）
   - クエリ実行プランを監視

3. **マイグレーション失敗**
   - 拡張機能の依存関係を確認
   - 競合するポリシーをチェック
   - 制約違反を確認

### デバッグクエリ

```sql
-- 現在のユーザーコンテキストを確認
SELECT auth.uid();

-- RLSポリシーをテスト
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM personas WHERE user_id = auth.uid();

-- ベクトル検索パフォーマンスを監視
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM content_embeddings 
ORDER BY embedding <=> '[0.1,0.2,0.3]'::vector 
LIMIT 10;
```

## 貢献

新しいテーブルを追加またはスキーマを変更する際：

1. 連番でマイグレーションファイルを作成
2. 対応するRLSポリシーを追加
3. フロントエンドのTypeScript型を更新
4. データ分離のテストケースを追加
5. このドキュメントを更新

## 参考資料

- [Supabase RLSドキュメント](https://supabase.com/docs/guides/auth/row-level-security)
- [pgvectorドキュメント](https://github.com/pgvector/pgvector)
- [PostgreSQL関数](https://www.postgresql.org/docs/current/sql-createfunction.html)
