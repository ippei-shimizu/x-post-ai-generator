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
      options: ['default', 'outline', 'ghost'],
      description: 'カードのスタイルバリアント',
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
    <Card className="w-80">
      <CardHeader
        title="Complete Card"
        description="A card with all components"
        action={
          <Button size="sm" variant="ghost">
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
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button size="sm">Confirm</Button>
      </CardFooter>
    </Card>
  ),
};

// フッター配置展示
export const FooterAlignments: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Card>
        <CardContent>Left aligned footer</CardContent>
        <CardFooter align="left">
          <Button size="sm">Left</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardContent>Center aligned footer</CardContent>
        <CardFooter align="center">
          <Button size="sm">Center</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardContent>Right aligned footer</CardContent>
        <CardFooter align="right">
          <Button size="sm">Right</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardContent>Space between footer</CardContent>
        <CardFooter align="between">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save</Button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'フッター要素の配置オプション',
      },
    },
  },
};

// 複雑なヘッダー例
export const ComplexHeader: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader
        title="User Profile"
        description="Manage your account settings"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost">
              Edit
            </Button>
            <Button size="sm" variant="ghost">
              ⋯
            </Button>
          </div>
        }
      >
        <div className="mt-2 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-500"></div>
          <div>
            <p className="font-medium">John Doe</p>
            <p className="text-sm text-gray-500">john@example.com</p>
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
        story: '複雑なヘッダーレイアウトの例',
      },
    },
  },
};

// 全バリアント表示
export const AllVariants: Story = {
  render: () => (
    <div className="w-80 space-y-4">
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
  ),
  parameters: {
    docs: {
      description: {
        story: '全てのバリアントを一覧表示',
      },
    },
  },
};

// 実用例：製品カード
export const ProductCard: Story = {
  render: () => (
    <Card className="w-80" interactive>
      <CardContent className="p-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://via.placeholder.com/320x200"
          alt="Product"
          className="h-48 w-full rounded-t-lg object-cover"
        />
        <div className="p-6">
          <h3 className="text-lg font-semibold">Product Name</h3>
          <p className="mt-1 text-gray-600">
            Short product description goes here.
          </p>
          <p className="mt-4 text-2xl font-bold">$99.99</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Add to Cart</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: '製品カードの実用例',
      },
    },
  },
};
