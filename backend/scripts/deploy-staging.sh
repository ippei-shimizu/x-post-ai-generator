#!/bin/bash

# Staging Environment Deployment Script
# Issue #22: Serverless Framework セットアップ - ステージング環境

set -e  # エラー時に停止

echo "🚀 Starting Staging Environment Deployment..."

# 1. 環境変数の設定
echo "📋 Setting up staging environment variables..."
export $(grep -v '^#' .env.staging | xargs)

# 2. AWS認証確認
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured. Please run 'aws configure'"
    exit 1
fi

# 3. 依存関係の確認
echo "📦 Checking dependencies..."
if ! command -v serverless > /dev/null 2>&1; then
    echo "❌ Serverless Framework not found. Installing..."
    pnpm add -g serverless
fi

# 4. TypeScript型チェック
echo "🔍 Running TypeScript type check..."
pnpm run typecheck

# 5. リント実行
echo "🧹 Running ESLint..."
pnpm run lint

# 6. テスト実行（ユニットテストのみ）
echo "🧪 Running unit tests..."
pnpm run test:unit

# 7. ビルド実行
echo "🔨 Building Lambda functions..."
serverless package --stage staging

# 8. ステージング環境デプロイ
echo "🚀 Deploying to AWS Lambda (staging)..."
serverless deploy --stage staging

# 9. デプロイ情報表示
echo "📊 Deployment information:"
serverless info --stage staging

# 10. ヘルスチェック実行
echo "🏥 Running health check..."
HEALTH_URL=$(serverless info --stage staging | grep "GET.*health" | awk '{print $3}')
if [ ! -z "$HEALTH_URL" ]; then
    echo "Testing health endpoint: $HEALTH_URL"
    curl -f "$HEALTH_URL" || echo "⚠️  Health check failed, but deployment completed"
else
    echo "⚠️  Could not extract health URL from deployment info"
fi

echo "✅ Staging deployment completed successfully!"
echo "🔗 API Gateway URL: Check 'serverless info --stage staging' for endpoints"