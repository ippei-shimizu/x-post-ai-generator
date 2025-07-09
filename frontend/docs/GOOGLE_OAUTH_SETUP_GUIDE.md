# Google Cloud Console OAuth設定確認ガイド

## 概要

このガイドでは、Google Cloud ConsoleでOAuth 2.0クライアントの設定を確認・修正する手順を詳しく説明します。

## 前提条件

- Google Cloudアカウント
- プロジェクトへのアクセス権限
- 以下の環境変数情報：
  ```
  GOOGLE_CLIENT_ID=your-google-client-id
  GOOGLE_CLIENT_SECRET=your-google-client-secret
  NEXTAUTH_URL=http://localhost:3010
  ```

## 1. Google Cloud Consoleへのアクセス

1. ブラウザで [Google Cloud Console](https://console.cloud.google.com) にアクセス
2. 正しいGoogleアカウントでログイン
3. 画面上部のプロジェクトセレクターをクリック
4. OAuth クライアントが作成されているプロジェクトを選択

> **注意**: プロジェクトが不明な場合は、すべてのプロジェクトをチェックする必要があります

## 2. OAuth クライアントの存在確認

### 手順：

1. 左側のナビゲーションメニューから「APIとサービス」→「認証情報」をクリック
2. 「OAuth 2.0 クライアント ID」セクションを確認
3. 環境変数に設定したクライアントIDを探す

### 確認ポイント：

- [ ] クライアントIDが存在するか
- [ ] クライアントのタイプが「ウェブ アプリケーション」になっているか
- [ ] ステータスが有効になっているか

### よくある問題：

- **クライアントが見つからない**: 別のプロジェクトやアカウントで作成されている可能性
- **削除されている**: 新規作成が必要

## 3. 認証済みリダイレクトURIの設定確認

### 手順：

1. 該当するOAuth 2.0クライアントIDの名前をクリック
2. 「承認済みのリダイレクト URI」セクションを確認

### 必須URI（開発環境）：

```
http://localhost:3010/api/auth/callback/google
```

### 追加で設定すべきURI（開発環境）：

```
http://localhost:3010
http://127.0.0.1:3010/api/auth/callback/google
```

### 本番環境用URI（例）：

```
https://yourdomain.com/api/auth/callback/google
https://www.yourdomain.com/api/auth/callback/google
```

### 確認ポイント：

- [ ] NextAuth.jsのコールバックパスが含まれているか（`/api/auth/callback/google`）
- [ ] プロトコル（http/https）が正しいか
- [ ] ポート番号が正しいか（開発環境: 3000）
- [ ] 末尾にスラッシュがないか（不要）

### よくある設定ミス：

1. **パスの間違い**: `/api/auth/callback/google` を忘れる
2. **プロトコルの不一致**: httpsとhttpの混在
3. **ポート番号の不一致**: 3000以外のポートを使用している場合
4. **大文字小文字**: URLは大文字小文字を区別する

## 4. 承認済みのJavaScript生成元の設定

### 手順：

1. 同じOAuth 2.0クライアントの設定画面で
2. 「承認済みのJavaScript生成元」セクションを確認

### 必須設定（開発環境）：

```
http://localhost:3010
http://localhost
```

### 本番環境用設定（例）：

```
https://yourdomain.com
https://www.yourdomain.com
```

### 確認ポイント：

- [ ] アプリケーションのオリジンが含まれているか
- [ ] プロトコルが正しいか
- [ ] ポート番号が正しいか

## 5. OAuth同意画面の設定状況

### 手順：

1. 左側のメニューから「OAuth同意画面」をクリック
2. 各タブの設定を確認

### アプリケーション情報タブ：

- [ ] アプリケーション名が設定されているか
- [ ] ユーザーサポートメールが設定されているか
- [ ] アプリケーションロゴ（オプション）
- [ ] アプリケーションホームページ（必須）
- [ ] プライバシーポリシーのリンク（本番環境では必須）
- [ ] 利用規約のリンク（本番環境では必須）

### スコープタブ：

必須スコープ：

- [ ] `.../auth/userinfo.email`
- [ ] `.../auth/userinfo.profile`
- [ ] `openid`

### テストユーザータブ（開発中の場合）：

- [ ] 開発者のメールアドレスが追加されているか
- [ ] テスターのメールアドレスが追加されているか

### 公開ステータス：

- **テスト**: 限定的なユーザーのみアクセス可能
- **本番**: すべてのユーザーがアクセス可能（審査が必要な場合あり）

## 6. 必要なAPIの有効化状況

### 手順：

1. 左側のメニューから「APIとサービス」→「有効なAPI」をクリック
2. 以下のAPIが有効になっているか確認

### 必須API：

- [ ] **Google+ API** または **Google Identity Toolkit API**
- [ ] **People API**（推奨）

### APIを有効化する方法：

1. 「APIとサービスの有効化」をクリック
2. 必要なAPIを検索
3. 「有効にする」をクリック

## 7. 開発環境と本番環境の設定の違い

### 開発環境：

```env
NEXTAUTH_URL=http://localhost:3010
NEXTAUTH_SECRET=your-development-secret
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 本番環境：

```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret-32-chars-minimum
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 主な違い：

1. **プロトコル**: 本番はHTTPS必須
2. **ドメイン**: localhostから実際のドメインへ
3. **NEXTAUTH_SECRET**: 本番は強力なランダム文字列（32文字以上推奨）
4. **OAuth同意画面**: 本番は完全な情報とプライバシーポリシーが必要

## 8. トラブルシューティング

### エラー: "Error 400: redirect_uri_mismatch"

**原因**: リダイレクトURIが登録されていない
**解決方法**:

1. エラーメッセージに表示されるURIをコピー
2. OAuth 2.0クライアントの設定に追加
3. 保存して10分程度待つ

### エラー: "Access blocked: This app's request is invalid"

**原因**: OAuth同意画面の設定が不完全
**解決方法**:

1. OAuth同意画面の必須項目をすべて入力
2. ホームページURLとプライバシーポリシーURLを設定

### エラー: "This app is blocked"

**原因**: アプリがテストモードでユーザーが登録されていない
**解決方法**:

1. OAuth同意画面でテストユーザーに追加
2. または本番環境に公開（審査が必要な場合あり）

### エラー: "Invalid client"

**原因**: クライアントIDまたはシークレットが正しくない
**解決方法**:

1. 環境変数の値を再確認
2. クライアントシークレットを再生成
3. 環境変数を更新

## 9. セキュリティのベストプラクティス

1. **クライアントシークレットの保護**
   - 環境変数に保存
   - コードにハードコーディングしない
   - .gitignoreに.envファイルを追加

2. **リダイレクトURIの制限**
   - 必要最小限のURIのみ登録
   - ワイルドカードは使用しない

3. **スコープの最小化**
   - 必要な情報のみリクエスト
   - 過剰なスコープは審査で却下される可能性

4. **定期的な確認**
   - 未使用のクライアントは削除
   - アクセスログを監視

## 10. 次のステップ

1. 設定を確認・修正後、アプリケーションでテスト
2. エラーが発生した場合は、ブラウザの開発者ツールでネットワークタブを確認
3. 本番環境へのデプロイ前に、本番用の設定を別途作成

## 参考リンク

- [Google OAuth 2.0 公式ドキュメント](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Google Cloud Console](https://console.cloud.google.com)
