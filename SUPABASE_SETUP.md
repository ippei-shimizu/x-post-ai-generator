# Supabase セットアップガイド

## 🚀 クイックスタート

### 1. 環境変数の設定

本番環境のSupabaseプロジェクトに接続するには、以下の手順に従ってください：

#### 必要な情報の取得

1. **Supabase Project URL**
   - [Supabase Dashboard](https://supabase.com/dashboard) にログイン
   - プロジェクトを選択
   - Settings → API
   - `Project URL` をコピー（例: `https://xxxxxxxxxxx.supabase.co`）

2. **Supabase Anon Key**
   - 同じページの `Project API keys` セクション
   - `anon` `public` キーをコピー

3. **環境変数ファイルの更新**
   ```bash
   # frontend/.env.local を編集
   NEXT_PUBLIC_SUPABASE_URL=https://あなたのプロジェクト.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのanonキー
   ```

### 2. Google OAuth の設定

#### Supabase側の設定

1. Supabase Dashboard → Authentication → Providers
2. Google を有効化
3. 以下の情報を記録：
   - Callback URL: `https://あなたのプロジェクト.supabase.co/auth/v1/callback`

#### Google Cloud Console側の設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または選択
3. APIs & Services → Credentials
4. Create Credentials → OAuth client ID
5. Application type: Web application
6. Authorized redirect URIs に Supabase の Callback URL を追加
7. Client ID と Client Secret を取得

#### Supabaseに戻って設定

1. Google Provider の設定に Client ID と Client Secret を入力
2. Save

### 3. pgvector 拡張機能の有効化

Supabase Dashboard の SQL Editor で以下を実行：

```sql
-- pgvector拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- 確認
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 4. データベースマイグレーションの実行

#### オプション1: Supabase Dashboard から実行

1. SQL Editor を開く
2. 以下の順番でマイグレーションファイルの内容を実行：
   - `database/migrations/001_create_initial_schema.sql`
   - `database/migrations/002_enable_rls_policies.sql`

#### オプション2: Supabase CLI から実行

```bash
# プロジェクトをリンク
npx supabase link --project-ref あなたのproject-ref

# マイグレーションを実行
npx supabase db push
```

### 5. 接続テスト

開発サーバーを起動して接続を確認：

```bash
cd frontend
pnpm dev
```

ブラウザで http://localhost:3000 にアクセスし、コンソールエラーがないことを確認。

## 🧪 動作確認

### 接続テストスクリプト

`frontend/scripts/test-connection.js` を作成：

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    // データベース接続テスト
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('接続エラー:', error)
    } else {
      console.log('✅ Supabase接続成功！')
    }
    
    // 認証サービステスト
    const { data: { user } } = await supabase.auth.getUser()
    console.log('✅ 認証サービス利用可能')
    
  } catch (err) {
    console.error('エラー:', err)
  }
}

testConnection()
```

実行：
```bash
node --env-file=.env.local scripts/test-connection.js
```

## 📊 プロジェクト設定チェックリスト

- [ ] Supabase Project URL を .env.local に設定
- [ ] Supabase Anon Key を .env.local に設定
- [ ] Google OAuth を Supabase で有効化
- [ ] Google Cloud Console で OAuth クライアント作成
- [ ] pgvector 拡張機能を有効化
- [ ] 初期スキーママイグレーションを実行
- [ ] RLSポリシーマイグレーションを実行
- [ ] 接続テストが成功

## 🔧 トラブルシューティング

### "relation does not exist" エラー
→ マイグレーションが実行されていません。SQL Editorでマイグレーションファイルを実行してください。

### "permission denied" エラー
→ RLSが有効になっていますが、ポリシーが設定されていません。002_enable_rls_policies.sql を実行してください。

### "invalid API key" エラー
→ 環境変数の SUPABASE_ANON_KEY が正しくありません。Dashboard から正しい値をコピーしてください。

## 🔒 セキュリティ注意事項

1. **Service Role Key は使用しない**: フロントエンドでは必ず Anon Key を使用
2. **RLS を常に有効化**: すべてのテーブルで Row Level Security を有効化
3. **環境変数をコミットしない**: `.env.local` は .gitignore に含まれていることを確認

## 📚 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)