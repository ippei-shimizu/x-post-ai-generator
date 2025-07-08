import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Card, CardHeader, CardContent, CardFooter } from './card';
import { Button } from './button';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'カードコンポーネント。Header、Content、Footerサブコンポーネント、インタラクティブ対応。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'outline', 'ghost', 'glass', 'neon', 'ultra'],
      description:
        'カードのスタイルバリアント（ブルー系ウルトラモダンデザイン対応）',
    },
    padding: {
      control: { type: 'select' },
      options: ['none', 'sm', 'default', 'lg'],
      description: 'カードの内側パディング',
    },
    interactive: {
      control: { type: 'boolean' },
      description: 'インタラクティブ（クリック可能）状態',
    },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的なカード
export const Default: Story = {
  args: {
    children: 'Basic card content',
  },
};

// バリアント展示
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline card content',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost card content',
  },
};

// パディング展示
export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div className="bg-gray-100 p-4">
        Card with no padding (content has its own padding)
      </div>
    ),
  },
};

export const SmallPadding: Story = {
  args: {
    padding: 'sm',
    children: 'Card with small padding',
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'lg',
    children: 'Card with large padding',
  },
};

// インタラクティブカード
export const Interactive: Story = {
  args: {
    interactive: true,
    children: "Click me! I'm interactive",
    tabIndex: 0,
  },
};

// サブコンポーネント組み合わせ
export const WithHeader: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader title="Card Title" description="This is a card description" />
      <CardContent>
        <p>This is the main content of the card.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent>
        <p>Card content with footer.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Complete: Story = {
  render: () => (
    <Card className="w-80" variant="ultra">
      <CardHeader
        title="Complete Card"
        description="A card with all components"
        action={
          <Button size="sm" variant="glass">
            ⋯
          </Button>
        }
      />
      <CardContent>
        <p>This is a complete card example with header, content, and footer.</p>
        <div className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://via.placeholder.com/300x150"
            alt="Placeholder"
            className="w-full rounded"
          />
        </div>
      </CardContent>
      <CardFooter align="between">
        <Button variant="gradient-outline" size="sm">
          Cancel
        </Button>
        <Button variant="neon" size="sm">
          Confirm
        </Button>
      </CardFooter>
    </Card>
  ),
};

// フッター配置展示
export const FooterAlignments: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Card variant="glass">
        <CardContent>Left aligned footer</CardContent>
        <CardFooter align="left">
          <Button size="sm" variant="gradient">
            Left
          </Button>
        </CardFooter>
      </Card>

      <Card variant="glass">
        <CardContent>Center aligned footer</CardContent>
        <CardFooter align="center">
          <Button size="sm" variant="neon">
            Center
          </Button>
        </CardFooter>
      </Card>

      <Card variant="glass">
        <CardContent>Right aligned footer</CardContent>
        <CardFooter align="right">
          <Button size="sm" variant="electric">
            Right
          </Button>
        </CardFooter>
      </Card>

      <Card variant="glass">
        <CardContent>Space between footer</CardContent>
        <CardFooter align="between">
          <Button variant="gradient-outline" size="sm">
            Cancel
          </Button>
          <Button variant="ultra" size="sm">
            Save
          </Button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'フッター要素の配置オプション（ブルー系デザイン）',
      },
    },
  },
};

// 複雑なヘッダー例
export const ComplexHeader: Story = {
  render: () => (
    <Card className="w-96" variant="glass">
      <CardHeader
        title="User Profile"
        description="Manage your account settings"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="gradient-outline">
              Edit
            </Button>
            <Button size="sm" variant="neon">
              ⋯
            </Button>
          </div>
        }
      >
        <div className="mt-2 flex items-center gap-3">
          <div className="bg-gradient-neon shadow-electric h-10 w-10 rounded-full"></div>
          <div>
            <p className="text-gradient-primary font-medium">John Doe</p>
            <p className="text-sm text-muted-foreground">john@example.com</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p>Additional user information and settings would go here.</p>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: '複雑なヘッダーレイアウトの例（ブルー系ウルトラモダンデザイン）',
      },
    },
  },
};

// 🌊 新ブルー系ウルトラモダンバリアント
export const Glass: Story = {
  args: {
    variant: 'glass',
    children: 'Glass morphism card',
  },
  parameters: {
    docs: {
      description: {
        story: 'ガラスモーフィズム効果のブルー系透明カード',
      },
    },
  },
};

export const Neon: Story = {
  args: {
    variant: 'neon',
    children: 'Neon glow card',
  },
  parameters: {
    docs: {
      description: {
        story: 'ネオンブルーグロー効果付きカード',
      },
    },
  },
};

export const Ultra: Story = {
  args: {
    variant: 'ultra',
    children: 'Ultra modern card',
  },
  parameters: {
    docs: {
      description: {
        story: '究極のブルー系デザイン - 浮遊グロー効果カード',
      },
    },
  },
};

// 全バリアント表示
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      {/* 基本バリアント */}
      <div>
        <h3 className="text-gradient-primary mb-4 text-lg font-semibold">
          基本バリアント
        </h3>
        <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          <Card variant="default">
            <CardContent>Default variant</CardContent>
          </Card>
          <Card variant="outline">
            <CardContent>Outline variant</CardContent>
          </Card>
          <Card variant="ghost">
            <CardContent>Ghost variant</CardContent>
          </Card>
        </div>
      </div>

      {/* ブルー系ウルトラモダンバリアント */}
      <div>
        <h3 className="text-gradient-electric mb-4 text-lg font-semibold">
          🌊 ブルー系ウルトラモダンバリアント
        </h3>
        <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          <Card variant="glass">
            <CardContent>Glass morphism</CardContent>
          </Card>
          <Card variant="neon">
            <CardContent>Neon glow</CardContent>
          </Card>
          <Card variant="ultra">
            <CardContent>Ultra modern</CardContent>
          </Card>
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

// 🎭 ブルー系アニメーション効果デモンストレーション
export const AnimationShowcase: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-gradient-neon mb-4 text-lg font-semibold">
          🎭 アニメーション効果カード
        </h3>
        <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          <Card variant="glass" interactive>
            <CardHeader
              title="Glass Morphism"
              description="ガラスモーフィズム効果"
            />
            <CardContent>
              <p>ホバーでグロー効果が発動</p>
            </CardContent>
          </Card>

          <Card variant="neon" interactive>
            <CardHeader title="Neon Pulse" description="ネオンパルス効果" />
            <CardContent>
              <p>常時エレクトリックパルス</p>
            </CardContent>
          </Card>

          <Card variant="ultra" interactive>
            <CardHeader title="Ultra Float" description="フロートグロー効果" />
            <CardContent>
              <p>浮遊効果とグロー</p>
            </CardContent>
          </Card>

          <Card variant="glass" interactive>
            <CardHeader
              title="Interactive Demo"
              description="インタラクティブ効果"
              action={
                <Button size="sm" variant="neon">
                  ⚡
                </Button>
              }
            />
            <CardContent>
              <p>クリック・ホバー対応</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'ブルー系ウルトラモダンデザインのアニメーション効果とインタラクション',
      },
    },
  },
};

// 実用例：製品カード
export const ProductCard: Story = {
  render: () => (
    <Card className="w-80" variant="glass" interactive>
      <CardContent className="p-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://via.placeholder.com/320x200"
          alt="Product"
          className="h-48 w-full rounded-t-lg object-cover"
        />
        <div className="p-6">
          <h3 className="text-gradient-primary text-lg font-semibold">
            Ultra Product
          </h3>
          <p className="mt-1 text-muted-foreground">
            Cutting-edge technology with blue design
          </p>
          <p className="text-gradient-electric mt-4 text-2xl font-bold">
            $99.99
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="ultra">
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: '製品カードの実用例（ブルー系ウルトラモダンデザイン）',
      },
    },
  },
};

// ブルー系ユーザープロフィールカード例
export const UserProfileCard: Story = {
  render: () => (
    <Card className="w-96" variant="neon">
      <CardHeader
        title="Ultra User"
        description="Full-stack developer with blue passion"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="glass">
              Edit
            </Button>
            <Button size="sm" variant="electric">
              ⚙️
            </Button>
          </div>
        }
      >
        <div className="mt-2 flex items-center gap-3">
          <div className="bg-gradient-neon shadow-neon h-12 w-12 rounded-full"></div>
          <div>
            <p className="text-gradient-primary font-medium">John Doe</p>
            <p className="text-sm text-muted-foreground">john@example.com</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p>Building the future with ultra-modern blue design systems.</p>
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="gradient">
            React
          </Button>
          <Button size="sm" variant="gradient-outline">
            TypeScript
          </Button>
          <Button size="sm" variant="glass">
            Next.js
          </Button>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ユーザープロフィールカード（ブルー系ウルトラモダンデザイン）',
      },
    },
  },
};
