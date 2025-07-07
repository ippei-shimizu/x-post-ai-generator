import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Design System/Introduction',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'X-Post-AI-Generator デザインシステムへようこそ。このシステムは、一貫性のあるユーザーエクスペリエンスを提供するために設計されたコンポーネントライブラリです。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Welcome: Story = {
  render: () => (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">X-Post-AI-Generator</h1>
        <h2 className="text-2xl text-muted-foreground">デザインシステム</h2>
        <p className="mx-auto max-w-2xl text-lg">
          一貫性のあるユーザーエクスペリエンスを提供するために設計された、
          モダンでアクセシブルなUIコンポーネントライブラリです。
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h3 className="mb-3 text-xl font-semibold">🎨 デザイン原則</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• 一貫性のあるビジュアルデザイン</li>
            <li>• アクセシビリティファースト</li>
            <li>• レスポンシブデザイン</li>
            <li>• ダークモード対応</li>
          </ul>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="mb-3 text-xl font-semibold">⚡ 技術スタック</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• React + TypeScript</li>
            <li>• Tailwind CSS</li>
            <li>• shadcn/ui ベース</li>
            <li>• Storybook ドキュメント</li>
          </ul>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="mb-3 text-xl font-semibold">🧩 コンポーネント</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Button - アクション用ボタン</li>
            <li>• Input - フォーム入力</li>
            <li>• Card - コンテンツカード</li>
            <li>• Form - フォーム管理</li>
          </ul>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="mb-3 text-xl font-semibold">🛠️ 開発者向け</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• TypeScript型安全</li>
            <li>• TDD対応テスト</li>
            <li>• Visual Regression Testing</li>
            <li>• 自動生成ドキュメント</li>
          </ul>
        </div>
      </div>

      <div className="mt-12 border-t pt-8">
        <h3 className="mb-4 text-xl font-semibold">🚀 はじめ方</h3>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-medium">1. コンポーネントを探索</h4>
            <p className="text-sm text-muted-foreground">
              左のサイドバーからUIコンポーネントを選択して、使用方法とプロパティを確認してください。
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-medium">2. デザイントークンを確認</h4>
            <p className="text-sm text-muted-foreground">
              Design System/Overview
              でカラーパレット、タイポグラフィ、スペーシングを確認してください。
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-medium">3. プロジェクトで使用</h4>
            <p className="text-sm text-muted-foreground">
              各コンポーネントのコード例を参考に、プロジェクトでご利用ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'デザインシステムの紹介と使い方ガイド',
      },
    },
  },
};

export const ComponentOverview: Story = {
  render: () => (
    <div className="mx-auto max-w-6xl p-8">
      <h2 className="mb-6 text-2xl font-bold">コンポーネント一覧</h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4 transition-shadow hover:shadow-md">
          <h3 className="mb-2 font-semibold">Button</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            アクション実行用のボタンコンポーネント
          </p>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">バリアント:</div>
            <div className="flex flex-wrap gap-1">
              <span className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                default
              </span>
              <span className="rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                destructive
              </span>
              <span className="rounded border px-2 py-1 text-xs">outline</span>
              <span className="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                secondary
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4 transition-shadow hover:shadow-md">
          <h3 className="mb-2 font-semibold">Input</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            フォーム入力用のインプットコンポーネント
          </p>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">機能:</div>
            <div className="flex flex-wrap gap-1">
              <span className="rounded bg-muted px-2 py-1 text-xs">
                XSS対策
              </span>
              <span className="rounded bg-muted px-2 py-1 text-xs">
                デバウンス
              </span>
              <span className="rounded bg-muted px-2 py-1 text-xs">
                バリデーション
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4 transition-shadow hover:shadow-md">
          <h3 className="mb-2 font-semibold">Card</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            コンテンツ表示用のカードコンポーネント
          </p>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">構成:</div>
            <div className="flex flex-wrap gap-1">
              <span className="rounded bg-muted px-2 py-1 text-xs">Header</span>
              <span className="rounded bg-muted px-2 py-1 text-xs">
                Content
              </span>
              <span className="rounded bg-muted px-2 py-1 text-xs">Footer</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4 transition-shadow hover:shadow-md">
          <h3 className="mb-2 font-semibold">Form</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            フォーム管理用のコンポーネント
          </p>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">機能:</div>
            <div className="flex flex-wrap gap-1">
              <span className="rounded bg-muted px-2 py-1 text-xs">
                バリデーション
              </span>
              <span className="rounded bg-muted px-2 py-1 text-xs">
                非同期処理
              </span>
              <span className="rounded bg-muted px-2 py-1 text-xs">
                状態管理
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '利用可能なすべてのUIコンポーネントの概要',
      },
    },
  },
};

export const UsageGuidelines: Story = {
  render: () => (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <h2 className="text-2xl font-bold">使用ガイドライン</h2>

      <div className="space-y-6">
        <div className="border-l-4 border-primary pl-4">
          <h3 className="mb-2 font-semibold">💡 Do&apos;s - 推奨事項</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• コンポーネントの意図された用途で使用する</li>
            <li>• プロパティの型定義に従って実装する</li>
            <li>• アクセシビリティ属性を適切に設定する</li>
            <li>• ダークモード対応を確認する</li>
            <li>• レスポンシブデザインを考慮する</li>
          </ul>
        </div>

        <div className="border-l-4 border-destructive pl-4">
          <h3 className="mb-2 font-semibold">
            ⚠️ Don&apos;ts - 避けるべき事項
          </h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• コンポーネントのスタイルを直接オーバーライドしない</li>
            <li>• 必須プロパティを省略しない</li>
            <li>• アクセシビリティを無視しない</li>
            <li>• 大きな画面サイズでのみテストしない</li>
            <li>• テーマに反するカスタマイズを行わない</li>
          </ul>
        </div>

        <div className="rounded-lg border bg-muted p-4">
          <h3 className="mb-2 font-semibold">📋 コードガイドライン</h3>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium">import文</h4>
              <code className="mt-1 block rounded bg-background p-2 text-xs">
                {`import { Button } from '@/components/ui/button';`}
              </code>
            </div>

            <div>
              <h4 className="font-medium">基本的な使用例</h4>
              <code className="mt-1 block rounded bg-background p-2 text-xs">
                {`<Button variant="default" size="default" onClick={handleClick}>
  Click me
</Button>`}
              </code>
            </div>

            <div>
              <h4 className="font-medium">TypeScript型チェック</h4>
              <code className="mt-1 block rounded bg-background p-2 text-xs">
                {`interface Props {
  onClick: () => void;
}

const MyComponent: React.FC<Props> = ({ onClick }) => (
  <Button onClick={onClick}>Action</Button>
);`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'コンポーネント使用時のベストプラクティスとガイドライン',
      },
    },
  },
};
