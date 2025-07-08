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
        'gradient',
        'gradient-outline',
        'neon',
        'electric',
        'ultra',
        'success',
        'warning',
        'glass',
      ],
      description:
        'ボタンのスタイルバリアント（ブルー系ウルトラモダンデザイン対応）',
    },
    size: {
      control: { type: 'select' },
      options: [
        'default',
        'sm',
        'lg',
        'xl',
        'icon',
        'icon-sm',
        'icon-lg',
        'icon-xl',
      ],
      description: 'ボタンのサイズ（XLサイズとアイコンバリエーション対応）',
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

// 🌊 新ブルー系ウルトラモダンバリアント
export const Gradient: Story = {
  args: {
    variant: 'gradient',
    children: 'Gradient Blue',
  },
  parameters: {
    docs: {
      description: {
        story: 'ブルー系グラデーション背景のウルトラモダンボタン',
      },
    },
  },
};

export const GradientOutline: Story = {
  args: {
    variant: 'gradient-outline',
    children: 'Gradient Outline',
  },
  parameters: {
    docs: {
      description: {
        story: 'ブルーグラデーション境界線のガラスモーフィズムボタン',
      },
    },
  },
};

export const Neon: Story = {
  args: {
    variant: 'neon',
    children: 'Neon Glow',
  },
  parameters: {
    docs: {
      description: {
        story: 'ネオンブルーグロー効果付きボタン',
      },
    },
  },
};

export const Electric: Story = {
  args: {
    variant: 'electric',
    children: 'Electric',
  },
  parameters: {
    docs: {
      description: {
        story: 'エレクトリックブルーのシマーアニメーション付きボタン',
      },
    },
  },
};

export const Ultra: Story = {
  args: {
    variant: 'ultra',
    children: 'Ultra Modern',
    size: 'xl',
  },
  parameters: {
    docs: {
      description: {
        story: '究極のブルー系デザイン - 浮遊グロー効果とXLサイズ',
      },
    },
  },
};

export const Glass: Story = {
  args: {
    variant: 'glass',
    children: 'Glass Morphism',
  },
  parameters: {
    docs: {
      description: {
        story: 'ガラスモーフィズム効果のブルー系透明ボタン',
      },
    },
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

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    variant: 'ultra',
    children: 'Extra Large',
  },
  parameters: {
    docs: {
      description: {
        story: '特大サイズ - プライマリCTAに最適',
      },
    },
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
    children: 'Submit',
    loadingText: 'Submitting your request...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'ローディング状態のボタン。loadingTextでスクリーンリーダー向けの説明をカスタマイズ可能',
      },
    },
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
    <div className="space-y-6">
      {/* 基本バリアント */}
      <div>
        <h3 className="text-gradient-primary mb-4 text-lg font-semibold">
          基本バリアント
        </h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      {/* ブルー系ウルトラモダンバリアント */}
      <div>
        <h3 className="text-gradient-electric mb-4 text-lg font-semibold">
          🌊 ブルー系ウルトラモダンバリアント
        </h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="gradient">Gradient</Button>
          <Button variant="gradient-outline">Gradient Outline</Button>
          <Button variant="neon">Neon</Button>
          <Button variant="electric">Electric</Button>
          <Button variant="ultra" size="lg">
            Ultra
          </Button>
          <Button variant="glass">Glass</Button>
        </div>
      </div>

      {/* 状態バリアント */}
      <div>
        <h3 className="text-gradient-accent mb-4 text-lg font-semibold">
          状態バリアント
        </h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '全てのバリアントを分類別に一覧表示（ブルー系ウルトラモダンデザイン対応）',
      },
    },
  },
};

// 全サイズ表示用グループStory
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6">
      {/* テキストボタンサイズ */}
      <div>
        <h3 className="text-gradient-primary mb-4 text-lg font-semibold">
          テキストボタンサイズ
        </h3>
        <div className="flex items-center gap-4">
          <Button size="sm" variant="gradient">
            Small
          </Button>
          <Button size="default" variant="gradient">
            Default
          </Button>
          <Button size="lg" variant="gradient">
            Large
          </Button>
          <Button size="xl" variant="ultra">
            Extra Large
          </Button>
        </div>
      </div>

      {/* アイコンボタンサイズ */}
      <div>
        <h3 className="text-gradient-electric mb-4 text-lg font-semibold">
          アイコンボタンサイズ
        </h3>
        <div className="flex items-center gap-4">
          <Button size="icon-sm" variant="neon" aria-label="Small icon">
            ⚙️
          </Button>
          <Button size="icon" variant="electric" aria-label="Default icon">
            ⚙️
          </Button>
          <Button size="icon-lg" variant="gradient" aria-label="Large icon">
            ⚙️
          </Button>
          <Button size="icon-xl" variant="ultra" aria-label="XL icon">
            ⚙️
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '全てのサイズを分類別に一覧表示（XLサイズとアイコンバリエーション対応）',
      },
    },
  },
};

// 🎭 アニメーション効果デモンストレーション
export const AnimationShowcase: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-gradient-neon mb-4 text-lg font-semibold">
          🎭 アニメーション効果
        </h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="gradient">グラデーションフロー</Button>
          <Button variant="neon">パルスエレクトリック</Button>
          <Button variant="electric">シマーアニメーション</Button>
          <Button variant="ultra">フロートグロー</Button>
        </div>
      </div>

      <div>
        <h3 className="text-gradient-glow mb-4 text-lg font-semibold">
          ✨ ホバー効果
        </h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="glass">ガラスモーフィズム</Button>
          <Button variant="gradient-outline">グローホバー</Button>
          <Button variant="ultra" size="lg">
            レビテートホバー
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'ブルー系ウルトラモダンデザインのアニメーション効果とホバーインタラクション',
      },
    },
  },
};
