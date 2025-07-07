import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Design System/Overview',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'X-Post-AI-Generator デザインシステムの概要とコンポーネントガイド',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// カラーパレット表示
export const ColorPalette: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Color Palette</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Primary Colors */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Primary</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg border bg-primary"></div>
                <div>
                  <p className="font-medium">Primary</p>
                  <p className="text-sm text-muted-foreground">
                    hsl(var(--primary))
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg border bg-primary-foreground"></div>
                <div>
                  <p className="font-medium">Primary Foreground</p>
                  <p className="text-sm text-muted-foreground">
                    hsl(var(--primary-foreground))
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Colors */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Secondary</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg border bg-secondary"></div>
                <div>
                  <p className="font-medium">Secondary</p>
                  <p className="text-sm text-muted-foreground">
                    hsl(var(--secondary))
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg border bg-secondary-foreground"></div>
                <div>
                  <p className="font-medium">Secondary Foreground</p>
                  <p className="text-sm text-muted-foreground">
                    hsl(var(--secondary-foreground))
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Muted Colors */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Muted</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg border bg-muted"></div>
                <div>
                  <p className="font-medium">Muted</p>
                  <p className="text-sm text-muted-foreground">
                    hsl(var(--muted))
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg border bg-muted-foreground"></div>
                <div>
                  <p className="font-medium">Muted Foreground</p>
                  <p className="text-sm text-muted-foreground">
                    hsl(var(--muted-foreground))
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Accent Colors */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Accent</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg border bg-accent"></div>
                <div>
                  <p className="font-medium">Accent</p>
                  <p className="text-sm text-muted-foreground">
                    hsl(var(--accent))
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg border bg-accent-foreground"></div>
                <div>
                  <p className="font-medium">Accent Foreground</p>
                  <p className="text-sm text-muted-foreground">
                    hsl(var(--accent-foreground))
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Destructive Colors */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Destructive</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg border bg-destructive"></div>
                <div>
                  <p className="font-medium">Destructive</p>
                  <p className="text-sm text-muted-foreground">
                    hsl(var(--destructive))
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg border bg-destructive-foreground"></div>
                <div>
                  <p className="font-medium">Destructive Foreground</p>
                  <p className="text-sm text-muted-foreground">
                    hsl(var(--destructive-foreground))
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Background Colors */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Background</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg border bg-background"></div>
                <div>
                  <p className="font-medium">Background</p>
                  <p className="text-sm text-muted-foreground">
                    hsl(var(--background))
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg border bg-foreground"></div>
                <div>
                  <p className="font-medium">Foreground</p>
                  <p className="text-sm text-muted-foreground">
                    hsl(var(--foreground))
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'デザインシステムで使用される全カラーパレット',
      },
    },
  },
};

// タイポグラフィ表示
export const Typography: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Typography</h2>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              text-4xl font-bold
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold">Heading 2</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              text-3xl font-bold
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold">Heading 3</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              text-2xl font-bold
            </p>
          </div>

          <div>
            <h4 className="text-xl font-semibold">Heading 4</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              text-xl font-semibold
            </p>
          </div>

          <div>
            <h5 className="text-lg font-semibold">Heading 5</h5>
            <p className="mt-1 text-sm text-muted-foreground">
              text-lg font-semibold
            </p>
          </div>

          <div>
            <h6 className="text-base font-semibold">Heading 6</h6>
            <p className="mt-1 text-sm text-muted-foreground">
              text-base font-semibold
            </p>
          </div>

          <div>
            <p className="text-base">
              Body text - regular paragraph text for general content.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">text-base</p>
          </div>

          <div>
            <p className="text-sm">
              Small text - for captions, labels, and secondary information.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">text-sm</p>
          </div>

          <div>
            <p className="text-xs">
              Extra small text - for fine print and metadata.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">text-xs</p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'タイポグラフィスケールとフォントサイズの一覧',
      },
    },
  },
};

// Spacingとレイアウト
export const Spacing: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Spacing Scale</h2>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64].map(
            size => (
              <div key={size} className="flex items-center space-x-4">
                <div className="w-16 text-sm text-muted-foreground">
                  {size === 1
                    ? '0.25rem'
                    : size === 2
                      ? '0.5rem'
                      : size === 3
                        ? '0.75rem'
                        : size === 4
                          ? '1rem'
                          : size === 5
                            ? '1.25rem'
                            : size === 6
                              ? '1.5rem'
                              : size === 8
                                ? '2rem'
                                : size === 10
                                  ? '2.5rem'
                                  : size === 12
                                    ? '3rem'
                                    : size === 16
                                      ? '4rem'
                                      : size === 20
                                        ? '5rem'
                                        : size === 24
                                          ? '6rem'
                                          : size === 32
                                            ? '8rem'
                                            : size === 40
                                              ? '10rem'
                                              : size === 48
                                                ? '12rem'
                                                : size === 56
                                                  ? '14rem'
                                                  : size === 64
                                                    ? '16rem'
                                                    : `${size}`}
                </div>
                <div
                  className="h-4 rounded bg-primary"
                  style={{ width: `${size * 0.25}rem` }}
                ></div>
                <div className="text-sm text-muted-foreground">
                  p-{size} / m-{size}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'スペーシングスケールとパディング/マージンの値',
      },
    },
  },
};

// Border Radius
export const BorderRadius: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Border Radius</h2>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div className="space-y-2 text-center">
            <div className="mx-auto h-16 w-16 rounded-none bg-primary"></div>
            <p className="text-sm font-medium">None</p>
            <p className="text-xs text-muted-foreground">rounded-none</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="mx-auto h-16 w-16 rounded-sm bg-primary"></div>
            <p className="text-sm font-medium">Small</p>
            <p className="text-xs text-muted-foreground">rounded-sm</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="mx-auto h-16 w-16 rounded bg-primary"></div>
            <p className="text-sm font-medium">Default</p>
            <p className="text-xs text-muted-foreground">rounded</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="mx-auto h-16 w-16 rounded-md bg-primary"></div>
            <p className="text-sm font-medium">Medium</p>
            <p className="text-xs text-muted-foreground">rounded-md</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="mx-auto h-16 w-16 rounded-lg bg-primary"></div>
            <p className="text-sm font-medium">Large</p>
            <p className="text-xs text-muted-foreground">rounded-lg</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="mx-auto h-16 w-16 rounded-xl bg-primary"></div>
            <p className="text-sm font-medium">Extra Large</p>
            <p className="text-xs text-muted-foreground">rounded-xl</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary"></div>
            <p className="text-sm font-medium">2X Large</p>
            <p className="text-xs text-muted-foreground">rounded-2xl</p>
          </div>

          <div className="space-y-2 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary"></div>
            <p className="text-sm font-medium">Full</p>
            <p className="text-xs text-muted-foreground">rounded-full</p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ボーダー半径のバリエーション',
      },
    },
  },
};

// Shadow
export const Shadows: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Shadows</h2>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-20 w-20 rounded-lg border bg-card shadow-sm"></div>
            <div>
              <p className="text-sm font-medium">Small</p>
              <p className="text-xs text-muted-foreground">shadow-sm</p>
            </div>
          </div>

          <div className="space-y-4 text-center">
            <div className="mx-auto h-20 w-20 rounded-lg border bg-card shadow"></div>
            <div>
              <p className="text-sm font-medium">Default</p>
              <p className="text-xs text-muted-foreground">shadow</p>
            </div>
          </div>

          <div className="space-y-4 text-center">
            <div className="mx-auto h-20 w-20 rounded-lg border bg-card shadow-md"></div>
            <div>
              <p className="text-sm font-medium">Medium</p>
              <p className="text-xs text-muted-foreground">shadow-md</p>
            </div>
          </div>

          <div className="space-y-4 text-center">
            <div className="mx-auto h-20 w-20 rounded-lg border bg-card shadow-lg"></div>
            <div>
              <p className="text-sm font-medium">Large</p>
              <p className="text-xs text-muted-foreground">shadow-lg</p>
            </div>
          </div>

          <div className="space-y-4 text-center">
            <div className="mx-auto h-20 w-20 rounded-lg border bg-card shadow-xl"></div>
            <div>
              <p className="text-sm font-medium">Extra Large</p>
              <p className="text-xs text-muted-foreground">shadow-xl</p>
            </div>
          </div>

          <div className="space-y-4 text-center">
            <div className="mx-auto h-20 w-20 rounded-lg border bg-card shadow-2xl"></div>
            <div>
              <p className="text-sm font-medium">2X Large</p>
              <p className="text-xs text-muted-foreground">shadow-2xl</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'シャドウのバリエーション',
      },
    },
  },
};
