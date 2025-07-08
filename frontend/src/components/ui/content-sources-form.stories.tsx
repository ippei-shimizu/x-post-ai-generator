import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ContentSourcesForm } from './content-sources-form';

const meta: Meta<typeof ContentSourcesForm> = {
  title: 'UI/ContentSourcesForm',
  component: ContentSourcesForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'コンテンツソース管理用のフォームコンポーネント。GitHub、RSS、ニュースなど様々なソースタイプに対応し、ユーザーフレンドリーなバリデーションとアクセシビリティ機能を提供します。',
      },
    },
  },
  argTypes: {
    mode: {
      description: 'フォームのモード（作成または編集）',
      control: 'radio',
      options: ['create', 'edit'],
    },
    onSubmit: {
      description: 'フォーム送信時のコールバック関数',
      action: 'submitted',
    },
    onCancel: {
      description: 'キャンセル時のコールバック関数',
      action: 'cancelled',
    },
    isLoading: {
      description: 'ローディング状態',
      control: 'boolean',
    },
    initialData: {
      description: '初期データ（編集モード用）',
      control: 'object',
    },
  },
  decorators: [
    Story => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的な作成フォーム
export const CreateForm: Story = {
  args: {
    mode: 'create',
    onSubmit: fn(),
    onCancel: fn(),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          '新しいコンテンツソースを作成するための基本フォームです。ソースタイプ、名前、URLの入力が必要で、リアルタイムバリデーションが適用されます。',
      },
    },
  },
};

// 編集フォーム（GitHub）
export const EditGitHubForm: Story = {
  args: {
    mode: 'edit',
    onSubmit: fn(),
    onCancel: fn(),
    isLoading: false,
    initialData: {
      name: 'Next.js Repository',
      source_type: 'github',
      url: 'https://github.com/vercel/next.js',
      config: {
        description: 'The React framework for production',
        branch: 'main',
        path: 'docs',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'GitHubリポジトリの編集フォーム例です。ブランチやパスなどのGitHub固有の設定項目が表示されます。',
      },
    },
  },
};

// RSS Feed フォーム
export const RSSFeedForm: Story = {
  args: {
    mode: 'create',
    onSubmit: fn(),
    onCancel: fn(),
    isLoading: false,
    initialData: {
      source_type: 'rss',
      name: 'Tech Blog RSS',
      url: 'https://blog.example.com/feed.xml',
      config: {
        description: 'Latest tech articles and tutorials',
        refresh_interval: '3600',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'RSS Feed用のフォーム例です。リフレッシュ間隔などのRSS固有の設定項目が表示されます。',
      },
    },
  },
};

// ローディング状態
export const LoadingState: Story = {
  args: {
    mode: 'create',
    onSubmit: fn(),
    onCancel: fn(),
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'フォーム送信中のローディング状態です。送信ボタンにローディングスピナーが表示され、フォームが無効化されます。',
      },
    },
  },
};

// バリデーションエラー状態
export const ValidationErrors: Story = {
  args: {
    mode: 'create',
    onSubmit: fn(),
    onCancel: fn(),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'バリデーションエラーの表示例です。無効なデータを入力すると、フィールドごとに適切なエラーメッセージが表示されます。',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    // バリデーションエラーをトリガーするためのインタラクション
    await step('バリデーションエラーをトリガー', async () => {
      const canvas = canvasElement;

      // 空の名前でフォーカスを移動してバリデーションをトリガー
      const nameInput = canvas.querySelector(
        'input[placeholder*="リポジトリ"]'
      ) as HTMLInputElement;
      const urlInput = canvas.querySelector(
        'input[type="url"]'
      ) as HTMLInputElement;

      if (nameInput && urlInput) {
        nameInput.focus();
        nameInput.blur();

        urlInput.focus();
        urlInput.value = 'invalid-url';
        urlInput.blur();
      }
    });
  },
};

// ニュースソース設定
export const NewsSourceForm: Story = {
  args: {
    mode: 'create',
    onSubmit: fn(),
    onCancel: fn(),
    isLoading: false,
    initialData: {
      source_type: 'news',
      name: 'Tech News Site',
      url: 'https://technews.example.com',
      config: {
        description: 'Latest technology news and insights',
        category: 'technology',
        tags: 'javascript,react,nextjs',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'ニュースサイト用のフォーム例です。カテゴリーやタグなどのニュース固有の設定項目が表示されます。',
      },
    },
  },
};

// API設定フォーム
export const APISourceForm: Story = {
  args: {
    mode: 'create',
    onSubmit: fn(),
    onCancel: fn(),
    isLoading: false,
    initialData: {
      source_type: 'api',
      name: 'Documentation API',
      url: 'https://api.docs.example.com/v1/content',
      config: {
        description: 'API documentation content source',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'API エンドポイント用のフォーム例です。API固有の設定項目が表示されます。',
      },
    },
  },
};

// 手動入力フォーム
export const ManualSourceForm: Story = {
  args: {
    mode: 'create',
    onSubmit: fn(),
    onCancel: fn(),
    isLoading: false,
    initialData: {
      source_type: 'manual',
      name: 'Manual Content',
      url: '',
      config: {
        description: 'Manually curated content for AI training',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '手動入力コンテンツ用のフォーム例です。URLが不要で、コンテンツを直接入力する場合に使用されます。',
      },
    },
  },
};

// キャンセルボタンなし
export const WithoutCancel: Story = {
  args: {
    mode: 'create',
    onSubmit: fn(),
    // onCancel を渡さない
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'キャンセルボタンが不要な場合の表示例です。onCancelプロパティを渡さないとキャンセルボタンが表示されません。',
      },
    },
  },
};

// 複雑な設定例
export const ComplexConfiguration: Story = {
  args: {
    mode: 'edit',
    onSubmit: fn(),
    onCancel: fn(),
    isLoading: false,
    initialData: {
      name: 'Advanced GitHub Repository',
      source_type: 'github',
      url: 'https://github.com/facebook/react',
      config: {
        description:
          'The React library source code and documentation for comprehensive analysis',
        branch: 'main',
        path: 'packages/react/src',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '複雑な設定を持つコンテンツソースの例です。詳細な説明と、GitHub固有の設定項目（ブランチ、パス）が含まれています。',
      },
    },
  },
};

// アクセシビリティテスト
export const AccessibilityTest: Story = {
  args: {
    mode: 'create',
    onSubmit: fn(),
    onCancel: fn(),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'アクセシビリティ機能のテスト用です。適切なラベル、ARIA属性、キーボードナビゲーション、スクリーンリーダー対応が実装されています。',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('アクセシビリティ機能をテスト', async () => {
      const canvas = canvasElement;

      // フォーカス可能な要素をチェック
      const focusableElements = canvas.querySelectorAll(
        'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
      );

      console.log(`Found ${focusableElements.length} focusable elements`);

      // 最初の要素にフォーカス
      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) {
        firstElement.focus();
      }
    });
  },
};
