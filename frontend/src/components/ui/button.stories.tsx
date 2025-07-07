import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from './button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'ボタンコンポーネント。ローディング状態、アイコン対応、複数バリアント・サイズに対応。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
      description: 'ボタンのスタイルバリアント',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'ボタンのサイズ',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'ローディング状態の表示',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'ボタンの無効化状態',
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Slotコンポーネントとして動作',
    },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的なボタン
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

// バリアント展示
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link',
  },
};

// サイズ展示
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
};

export const Icon: Story = {
  args: {
    size: 'icon',
    children: '⚙️',
    'aria-label': 'Settings',
  },
};

// 状態展示
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

// アイコン付きボタン
export const WithLeftIcon: Story = {
  args: {
    leftIcon: '←',
    children: 'Back',
  },
};

export const WithRightIcon: Story = {
  args: {
    rightIcon: '→',
    children: 'Next',
  },
};

export const WithBothIcons: Story = {
  args: {
    leftIcon: '🔍',
    rightIcon: '⚡',
    children: 'Search',
  },
};

// 複合状態
export const LoadingWithIcon: Story = {
  args: {
    loading: true,
    leftIcon: '💾',
    children: 'Saving...',
  },
};

// 全バリアント表示用グループStory
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '全てのバリアントを一覧表示',
      },
    },
  },
};

// 全サイズ表示用グループStory
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Icon button">
        ⚙️
      </Button>
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
