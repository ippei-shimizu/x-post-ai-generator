# JWT認証ミドルウェア

Issue #23で実装された、Lambda関数用のJWT認証ミドルウェアです。

## 概要

このミドルウェアは、API Gateway + Lambda構成での認証を自動化します。JWT トークンの検証、ユーザーID抽出、CORS設定、エラーハンドリングを統一的に処理します。

## 主な機能

- ✅ **JWT認証**: NextAuth.jsと互換性のあるJWT検証
- ✅ **ユーザーID抽出**: `extractUserId(event)` でシンプルにアクセス
- ✅ **エラーハンドリング**: 統一されたエラーレスポンス
- ✅ **CORS対応**: 自動的なCORSヘッダー追加
- ✅ **TypeScript**: 完全な型安全性
- ✅ **レート制限準備**: 将来のレート制限機能の基盤

## 基本的な使用方法

```typescript
import { authMiddleware, extractUserId } from '../src/middleware/auth';
import type { APIGatewayProxyHandler } from 'aws-lambda';

// Lambda関数の実装
const myLambdaHandler: APIGatewayProxyHandler = async (event) => {
  // この時点で認証済み（authMiddlewareが検証済み）
  const userId = extractUserId(event);
  
  // ユーザー固有の処理を実行
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      user_id: userId,
      data: { /* ユーザー固有データ */ }
    })
  };
};

// authMiddlewareでラップしてエクスポート
export const handler = authMiddleware(myLambdaHandler);
```

## 高度な使用方法

```typescript
import { authMiddleware } from '../src/middleware/auth';

// カスタムオプション付き
export const handler = authMiddleware(myLambdaHandler, {
  enableCors: true,
  corsOrigin: ['http://localhost:3010', 'https://yourdomain.com'],
  enableRateLimit: false, // 将来実装
});
```

## 認証エラーの処理

認証が失敗した場合、以下のエラーレスポンスが自動的に返されます：

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization header missing or invalid format"
  }
}
```

### エラーコード一覧

- `UNAUTHORIZED`: 認証ヘッダーなし、無効な形式
- `INVALID_TOKEN`: JWT署名無効、ペイロード形式不正
- `TOKEN_EXPIRED`: JWT有効期限切れ
- `INTERNAL_SERVER_ERROR`: JWT_SECRET未設定、その他内部エラー

## 環境変数

```bash
# 必須: JWT署名検証用秘密鍵
JWT_SECRET=your-jwt-secret-key
```

## 型定義

```typescript
import type { AuthenticatedAPIGatewayProxyEvent } from '../src/types/auth';

// 認証済みイベントの型
const authenticatedHandler = async (event: AuthenticatedAPIGatewayProxyEvent) => {
  // event.requestContext.authorizer.userId が利用可能
  // event.requestContext.authorizer.email が利用可能
};
```

## テスト

```bash
# 単体テスト
pnpm test -- __tests__/middleware/auth.test.ts

# 統合テスト
pnpm test -- __tests__/integration/auth-middleware.test.ts
```

## セキュリティ考慮事項

1. **JWT_SECRET**: 本番環境では強力な秘密鍵を使用
2. **CORS設定**: 本番では適切なオリジン制限を設定
3. **トークン有効期限**: 適切な有効期限設定（推奨: 1時間以下）
4. **ログ**: 認証エラーの適切な監視とアラート

## 実装の詳細

- **Red-Green-Refactor**: TDD手法で開発
- **型安全性**: TypeScript strict mode対応
- **パフォーマンス**: JWT検証は高速（<50ms）
- **エラーハンドリング**: 一貫したエラーレスポンス形式
- **Future-proof**: レート制限などの拡張に対応

## トラブルシューティング

### よくある問題

1. **401エラー連発**
   - JWT_SECRETが正しく設定されているか確認
   - フロントエンドのトークン形式を確認（`Bearer <token>`）

2. **CORS エラー**
   - 適切なオリジン設定を確認
   - プリフライトリクエストの対応

3. **型エラー**
   - `AuthenticatedAPIGatewayProxyEvent` 型を使用
   - `extractUserId()` の null チェックを実装

詳細は統合テストとサンプルコードを参照してください。