import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { VectorSearch } from './vector-search';
import type { VectorSearchResult } from '@/types/vector';

// モックデータ
const mockSearchResults: VectorSearchResult[] = [
  {
    id: '1',
    content_text:
      'Next.js is a React framework that enables functionality such as server-side rendering and generating static websites for React based web applications. It provides a structured way to build full-stack web applications.',
    source_type: 'github',
    source_url: 'https://github.com/vercel/next.js',
    similarity: 0.95,
    metadata: { repository: 'vercel/next.js', stars: 120000 },
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    content_text:
      'TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. It adds static type definitions to JavaScript.',
    source_type: 'rss',
    source_url: 'https://devblog.microsoft.com/typescript',
    similarity: 0.87,
    metadata: { author: 'Microsoft TypeScript Team', category: 'Development' },
    created_at: '2024-01-14T15:45:00Z',
  },
  {
    id: '3',
    content_text:
      'React is a JavaScript library for building user interfaces. It allows developers to create large web applications that can change data, without reloading the page.',
    source_type: 'news',
    source_url: 'https://react.dev/blog',
    similarity: 0.82,
    metadata: { tags: ['react', 'javascript', 'frontend'] },
    created_at: '2024-01-13T09:20:00Z',
  },
  {
    id: '4',
    content_text:
      'PostgreSQL is a powerful, open source object-relational database system with over 35 years of active development that has earned it a strong reputation for reliability.',
    source_type: 'api',
    source_url: 'https://postgresql.org/docs',
    similarity: 0.76,
    metadata: { version: '16.1', documentation: true },
    created_at: '2024-01-12T14:10:00Z',
  },
  {
    id: '5',
    content_text:
      'Tailwind CSS is a utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup.',
    source_type: 'manual',
    source_url: null,
    similarity: 0.71,
    metadata: { manually_added: true, tags: ['css', 'styling'] },
    created_at: '2024-01-11T11:55:00Z',
  },
];

const meta: Meta<typeof VectorSearch> = {
  title: 'UI/VectorSearch',
  component: VectorSearch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'ベクトル検索用のUIコンポーネント。セマンティック検索結果を表示し、類似度スコアとメタデータを含む詳細な情報を提供します。',
      },
    },
  },
  argTypes: {
    onSearch: {
      description: '検索実行時のコールバック関数',
      action: 'searched',
    },
    isLoading: {
      description: '検索中の状態',
      control: 'boolean',
    },
    results: {
      description: '検索結果の配列',
      control: 'object',
    },
    placeholder: {
      description: '検索入力欄のプレースホルダー',
      control: 'text',
    },
    showFilters: {
      description: 'フィルタ設定の表示/非表示',
      control: 'boolean',
    },
    maxHeight: {
      description: '検索結果エリアの最大高さ',
      control: 'text',
    },
    emptyStateMessage: {
      description: '検索結果が空の場合のメッセージ',
      control: 'text',
    },
    errorMessage: {
      description: 'エラーメッセージ',
      control: 'text',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的な使用例
export const Default: Story = {
  args: {
    onSearch: fn(),
    placeholder: 'ベクトル検索でコンテンツを探す...',
    results: mockSearchResults,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          '基本的なベクトル検索コンポーネントの表示例です。検索結果が表示され、各結果に類似度スコアとメタデータが含まれています。',
      },
    },
  },
};

// ローディング状態
export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
    results: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          '検索中のローディング状態を表示します。検索ボタンにスピナーが表示され、入力が無効化されます。',
      },
    },
  },
};

// 空の状態
export const EmptyState: Story = {
  args: {
    ...Default.args,
    results: [],
    emptyStateMessage: '検索結果が見つかりませんでした',
  },
  parameters: {
    docs: {
      description: {
        story:
          '検索結果が見つからない場合の表示です。ユーザーに別のキーワードでの検索を促すメッセージが表示されます。',
      },
    },
  },
};

// エラー状態
export const ErrorState: Story = {
  args: {
    ...Default.args,
    errorMessage:
      'ベクトル検索サービスに接続できませんでした。しばらく後でもう一度お試しください。',
    results: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'エラーが発生した場合の表示です。エラーメッセージが目立つように表示され、ユーザーに適切な対処法を示します。',
      },
    },
  },
};

// 少ない検索結果
export const FewResults: Story = {
  args: {
    ...Default.args,
    results: mockSearchResults.slice(0, 2),
  },
  parameters: {
    docs: {
      description: {
        story:
          '検索結果が少ない場合の表示例です。各結果が適切に配置され、情報が見やすく表示されます。',
      },
    },
  },
};

// 長いコンテンツの結果
export const LongContent: Story = {
  args: {
    ...Default.args,
    results: [
      {
        ...mockSearchResults[0],
        content_text:
          'This is a very long content text that demonstrates how the component handles lengthy content. The text should be truncated appropriately with line-clamp utility classes to maintain a clean layout. Next.js is a React framework that enables functionality such as server-side rendering and generating static websites for React based web applications. It provides a structured way to build full-stack web applications with features like automatic code splitting, optimized performance, and built-in CSS support. The framework also includes many other powerful features that make development easier and more efficient.',
      },
      ...mockSearchResults.slice(1, 3),
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          '長いコンテンツテキストがある場合の表示例です。テキストは適切に切り詰められ、レイアウトが崩れないように制御されます。',
      },
    },
  },
};

// フィルタ表示
export const WithFilters: Story = {
  args: {
    ...Default.args,
    showFilters: true,
    filters: {
      sourceTypes: ['github', 'rss'],
      similarityThreshold: 0.7,
      maxResults: 10,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'フィルタ設定を表示する場合の例です。ソースタイプや類似度閾値などの詳細な検索条件を設定できます。',
      },
    },
  },
};

// カスタムプロパティ
export const CustomSettings: Story = {
  args: {
    ...Default.args,
    placeholder: 'プロジェクトのドキュメントを検索...',
    maxHeight: '300px',
    emptyStateMessage: 'この条件に一致するドキュメントは見つかりませんでした',
    results: mockSearchResults.slice(0, 3),
  },
  parameters: {
    docs: {
      description: {
        story:
          'カスタマイズされた設定での表示例です。プレースホルダー、最大高さ、メッセージなどを用途に応じて変更できます。',
      },
    },
  },
};

// アクセシビリティフォーカス
export const AccessibilityFocus: Story = {
  args: {
    ...Default.args,
    results: mockSearchResults.slice(0, 3),
  },
  parameters: {
    docs: {
      description: {
        story:
          'アクセシビリティに配慮した実装例です。キーボードナビゲーション、スクリーンリーダー対応、適切なARIA属性が含まれています。検索結果はキーボードで選択でき、適切な説明テキストが提供されます。',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // フォーカステストのための基本的なセットアップ
    const canvas = canvasElement;
    const searchInput = canvas.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement;

    if (searchInput) {
      searchInput.focus();
    }
  },
};

// レスポンシブデザイン
export const ResponsiveDesign: Story = {
  args: {
    ...Default.args,
    results: mockSearchResults,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'モバイルデバイスでの表示例です。コンポーネントはレスポンシブデザインに対応しており、小さな画面でも使いやすいレイアウトを維持します。',
      },
    },
  },
};

// ダークモード
export const DarkMode: Story = {
  args: {
    ...Default.args,
    results: mockSearchResults.slice(0, 3),
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story:
          'ダークモードでの表示例です。適切なカラートークンを使用することで、ライトモードとダークモードの両方で最適な表示を実現しています。',
      },
    },
  },
};
