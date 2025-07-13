import { test, expect } from '@playwright/test';

test.describe('基本的なページ表示テスト', () => {
  test('ホームページが正常に表示される', async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');

    // ページタイトルが存在することを確認
    await expect(page).toHaveTitle(/X-Post-AI-Generator/);

    // 基本的な要素が表示されることを確認
    // 注意: 実際のページ構造に合わせて調整する必要があります
    await expect(page.locator('body')).toBeVisible();
  });

  test('認証ページにアクセスできる', async ({ page }) => {
    // 認証関連のページにアクセス
    await page.goto('/auth/signin');

    // ページが正常に読み込まれることを確認
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('レスポンシブデザインテスト', () => {
  test('モバイル表示で正常に動作する', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // モバイル表示でもページが正常に表示されることを確認
    await expect(page.locator('body')).toBeVisible();
  });

  test('タブレット表示で正常に動作する', async ({ page }) => {
    // タブレットビューポートに設定
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');

    // タブレット表示でもページが正常に表示されることを確認
    await expect(page.locator('body')).toBeVisible();
  });
});

// TODO: 実際の機能実装後に具体的なテストケースを追加
// - ユーザー認証フロー
// - ペルソナ作成・編集
// - 投稿生成機能
// - 投稿プレビュー・編集機能
