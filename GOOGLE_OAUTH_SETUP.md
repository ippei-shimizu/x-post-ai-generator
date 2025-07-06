# Google OAuth セットアップガイド

## 📋 概要

本番環境でGoogle OAuth認証を有効化するための設定手順です。
ローカル開発ではSupabaseのメール認証やマジックリンクで代替可能です。

## 🚀 Google Cloud Console設定

### 1. プロジェクト作成・選択

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを新規作成または既存プロジェクトを選択
3. プロジェクト名: `x-post-ai-generator` （推奨）

### 2. OAuth同意画面の設定

1. **APIs & Services** → **OAuth consent screen**
2. **User Type**: External を選択
3. 必須情報を入力：
   - **App name**: X-Post AI Generator
   - **User support email**: あなたのメールアドレス
   - **Developer contact information**: あなたのメールアドレス
4. **Save and Continue**

### 3. OAuth クライアント ID の作成

1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: X-Post AI Generator Web Client
5. **Authorized redirect URIs** を追加：
   ```
   # 本番環境用
   https://your-project.supabase.co/auth/v1/callback
   
   # ローカル開発用（必要に応じて）
   http://127.0.0.1:54321/auth/v1/callback
   ```
6. **Create** をクリック
7. **Client ID** と **Client Secret** をコピーして保存

## 🔧 Supabase設定

### 1. Supabase Dashboard での設定

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Authentication** → **Providers**
4. **Google** を有効化
5. Google OAuth設定を入力：
   - **Client ID**: Google Cloud Consoleで取得したClient ID
   - **Client Secret**: Google Cloud Consoleで取得したClient Secret
6. **Save** をクリック

### 2. 環境変数の設定

```bash
# frontend/.env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-from-console
```

## 🧪 動作確認

### 1. 認証フローのテスト

```javascript
// 認証テスト用コード
import { supabase } from '@/lib/supabase'

// Google OAuth サインイン
const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  if (error) console.error('OAuth Error:', error)
  return data
}
```

### 2. コールバック処理

`frontend/src/app/auth/callback/page.tsx` を作成：

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth callback error:', error)
        router.push('/auth/error')
        return
      }

      if (data.session) {
        // 認証成功 - ユーザーをダッシュボードにリダイレクト
        router.push('/dashboard')
      } else {
        // セッションなし
        router.push('/auth/signin')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1>認証処理中...</h1>
        <p>しばらくお待ちください</p>
      </div>
    </div>
  )
}
```

## 🔒 セキュリティ考慮事項

### 1. リダイレクトURI検証

- 本番環境のURLのみを許可
- ワイルドカードは使用しない
- HTTPSを強制

### 2. スコープ設定

Google OAuth で要求するスコープを最小限に：
```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'email profile', // 必要最小限のスコープ
    redirectTo: callbackUrl
  }
})
```

### 3. トークン管理

- Supabaseが自動でJWTトークンを管理
- リフレッシュトークンの自動更新
- セッション有効期限の適切な設定

## 🛠️ トラブルシューティング

### よくある問題

1. **リダイレクトURI不一致**
   - Google Cloud Consoleの設定確認
   - Supabaseプロジェクトのコールバック URL確認

2. **Client ID/Secret エラー**
   - 環境変数の値を確認
   - Supabase Dashboardの設定確認

3. **認証後のリダイレクトエラー**
   - コールバックページの実装確認
   - ルーティング設定確認

### デバッグ方法

```javascript
// 認証状態のデバッグ
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  console.log('Session:', session)
})
```

## 📚 参考リンク

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

## 📝 注意事項

- **ローカル開発**: Google OAuthなしでも開発可能（メール認証使用）
- **本番環境**: セキュリティのためGoogle OAuth推奨
- **ドメイン検証**: 本番ドメインでのGoogle OAuth設定が必要