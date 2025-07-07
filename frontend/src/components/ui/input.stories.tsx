import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Input } from './input';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'インプットコンポーネント。XSS対策、デバウンス、エラー状態、左右要素対応。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: [
        'text',
        'email',
        'password',
        'number',
        'tel',
        'url',
        'search',
        'date',
        'time',
        'datetime-local',
      ],
      description: 'インプットタイプ',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg'],
      description: 'インプットのサイズ',
    },
    error: {
      control: { type: 'boolean' },
      description: 'エラー状態の表示',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'インプットの無効化状態',
    },
    readOnly: {
      control: { type: 'boolean' },
      description: '読み取り専用状態',
    },
    sanitize: {
      control: { type: 'boolean' },
      description: 'XSS対策サニタイズの有効/無効',
    },
    debounce: {
      control: { type: 'number' },
      description: 'デバウンス時間（ミリ秒）',
    },
  },
  args: { onChange: fn() },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的なインプット
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

// タイプ別展示
export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: 'Enter number',
    min: 0,
    max: 100,
  },
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
};

// サイズ展示
export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small input',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large input',
  },
};

// 状態展示
export const WithError: Story = {
  args: {
    error: true,
    placeholder: 'Input with error',
    helperText: 'This field has an error',
  },
};

export const WithHelperText: Story = {
  args: {
    placeholder: 'Username',
    helperText: 'Enter your unique username',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
    value: 'Cannot edit this',
  },
};

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: 'Read only value',
  },
};

// 左右要素付きインプット
export const WithLeftElement: Story = {
  args: {
    leftElement: '🔍',
    placeholder: 'Search with icon',
  },
};

export const WithRightElement: Story = {
  args: {
    rightElement: '✕',
    placeholder: 'Input with clear button',
  },
};

export const WithBothElements: Story = {
  args: {
    leftElement: '$',
    rightElement: '.00',
    placeholder: '0',
    type: 'number',
  },
};

// XSS対策とデバウンス
export const WithSanitization: Story = {
  args: {
    sanitize: true,
    placeholder: 'Try entering <script>alert("xss")</script>',
    helperText: 'XSS protection enabled',
  },
};

export const WithDebounce: Story = {
  args: {
    debounce: 500,
    placeholder: 'Debounced input (500ms)',
    helperText: 'onChange fires 500ms after typing stops',
  },
};

// 全サイズ表示用グループStory
export const AllSizes: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Input size="sm" placeholder="Small input" />
      <Input size="default" placeholder="Default input" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '全てのサイズを一覧表示',
      },
    },
  },
};

// 様々なタイプ表示用グループStory
export const AllTypes: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search input" />
      <Input type="tel" placeholder="Phone input" />
      <Input type="url" placeholder="URL input" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '様々なインプットタイプを一覧表示',
      },
    },
  },
};

// フォーム要素組み合わせ例
export const FormExample: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div>
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          placeholder="your@email.com"
          helperText="We'll never share your email"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Password</label>
        <Input
          type="password"
          placeholder="Enter password"
          error={true}
          helperText="Password must be at least 8 characters"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Search</label>
        <Input
          type="search"
          leftElement="🔍"
          placeholder="Search products..."
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'フォーム内での実用例',
      },
    },
  },
};

export const AccessibilityFeatures: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'example@domain.com',
    description: 'Enter your work email address for notifications',
    required: true,
    maxLength: 100,
    helperText: 'Please use a valid email format',
  },
  parameters: {
    docs: {
      description: {
        story:
          'アクセシビリティ機能の完全デモ。label、description、required、制限表示を含む',
      },
    },
  },
};
