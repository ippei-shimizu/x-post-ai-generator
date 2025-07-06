# 環境変数管理ガイド

## 📋 概要

このプロジェクトでは、開発環境、ステージング環境、本番環境ごとに環境変数を分離管理しています。

## 🗂️ 環境ファイル構成

```
frontend/
├── .env.development     # 開発環境用（Gitで管理）
├── .env.staging         # ステージング環境用（Gitで管理）
├── .env.production      # 本番環境用（Gitで管理）
├── .env.local           # ローカル実行用（Git除外）
└── .env.local.example   # テンプレート（Gitで管理）
```

## 🔧 環境別設定

### 開発環境 (Development)
- **ファイル**: `.env.development`
- **Supabase**: ローカルSupabase (http://127.0.0.1:54321)
- **用途**: ローカル開発、単体テスト
- **デバッグ**: 有効

### ステージング環境 (Staging)
- **ファイル**: `.env.staging`
- **Supabase**: Supabase本番プロジェクトの別インスタンス
- **用途**: 統合テスト、デプロイ前確認
- **デバッグ**: 有効（info レベル）

### 本番環境 (Production)
- **ファイル**: `.env.production`
- **Supabase**: Supabase本番プロジェクト
- **用途**: 本番運用
- **デバッグ**: 無効（error レベルのみ）

## 🚀 使用方法

### 1. 初期セットアップ

```bash
# 開発環境で開始
cd frontend
pnpm run env:dev

# または手動でコピー
cp .env.development .env.local
```

### 2. 環境切り替え

```bash
# 開発環境に切り替え
pnpm run env:dev

# ステージング環境に切り替え
pnpm run env:staging

# 本番環境に切り替え
pnpm run env:prod
```

### 3. 環境別実行

```bash
# 開発環境で開発サーバー起動
pnpm run dev

# ステージング環境で開発サーバー起動
pnpm run dev:staging

# 本番環境でビルド
pnpm run build:production
```

## ⚙️ 環境変数一覧

### 共通設定

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NODE_ENV` | 実行環境 | `development`, `staging`, `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | `eyJhbGciOiJIUzI1NiIs...` |
| `NEXT_PUBLIC_APP_URL` | アプリケーションURL | `https://your-domain.com` |
| `NEXTAUTH_URL` | NextAuth認証URL | `https://your-domain.com` |
| `NEXTAUTH_SECRET` | NextAuth秘密鍵 | `32文字以上のランダム文字列` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth クライアントID | `xxx.googleusercontent.com` |

### 開発/デバッグ設定

| 変数名 | 説明 | 開発 | ステージング | 本番 |
|--------|------|------|-------------|------|
| `NEXT_PUBLIC_DEBUG` | デバッグモード | `true` | `true` | `false` |
| `NEXT_PUBLIC_LOG_LEVEL` | ログレベル | `debug` | `info` | `error` |
| `NEXT_PUBLIC_ENVIRONMENT` | 環境識別子 | `development` | `staging` | `production` |

## 🔒 セキュリティ設定

### 環境ファイルの管理方針

- ✅ **Git管理対象**: `.env.development`, `.env.staging`, `.env.production`
  - プレースホルダー値のみ含む
  - 実際の機密情報は含まない

- ❌ **Git除外対象**: `.env.local`, `.env.*.local`
  - 実際の機密情報を含む
  - 個人のローカル環境専用

### 機密情報の取り扱い

```bash
# ❌ 間違い: 実際の値をGitにコミット
NEXT_PUBLIC_SUPABASE_ANON_KEY=real-secret-key

# ✅ 正しい: プレースホルダー値をコミット
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 📝 設定手順

### 1. 開発環境セットアップ

```bash
# 1. 開発環境用設定をローカルにコピー
pnpm run env:dev

# 2. ローカルSupabaseを起動
npx supabase start

# 3. 開発サーバー起動
pnpm run dev
```

### 2. ステージング環境セットアップ

```bash
# 1. Supabaseでステージング用プロジェクト作成
# 2. .env.staging の値を実際の値に更新
# 3. ステージング環境にデプロイ
pnpm run build:staging
```

### 3. 本番環境セットアップ

```bash
# 1. Supabaseで本番用プロジェクト作成
# 2. .env.production の値を実際の値に更新
# 3. 本番環境にデプロイ
pnpm run build:production
```

## 🐛 トラブルシューティング

### よくある問題

1. **環境変数が読み込まれない**
   ```bash
   # .env.local が存在することを確認
   ls -la frontend/.env.local
   
   # 開発環境設定をコピー
   pnpm run env:dev
   ```

2. **Supabase接続エラー**
   ```bash
   # 環境変数の値を確認
   cat frontend/.env.local | grep SUPABASE
   
   # ローカルSupabaseが起動しているか確認
   npx supabase status
   ```

3. **環境の混在**
   ```bash
   # 現在の環境を確認
   echo $NODE_ENV
   
   # .env.local を削除して再設定
   rm frontend/.env.local
   pnpm run env:dev
   ```

## 📊 環境別デプロイ

### Vercel設定例

```bash
# 本番環境
vercel --prod

# ステージング環境
vercel --target staging

# プレビュー環境
vercel
```

### GitHub Actions設定例

```yaml
# .github/workflows/deploy.yml
env:
  NODE_ENV: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## 📚 参考リンク

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Supabase Environment Setup](https://supabase.com/docs/guides/cli/local-development)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)