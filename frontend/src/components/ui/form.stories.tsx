import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Form, FormField } from './form';
import { Input } from './input';
import { Button } from './button';

const meta = {
  title: 'UI/Form',
  component: Form,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'フォームコンポーネント。非同期バリデーション、複数モード、型安全な状態管理。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: ['onSubmit', 'onBlur', 'onChange', 'all'],
      description: 'バリデーション実行タイミング',
    },
  },
  args: { onSubmit: fn() },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的なフォーム
export const Default: Story = {
  render: args => (
    <Form {...args} className="w-80">
      <FormField name="email" rules={{ required: true }}>
        {({ value, onChange, error }) => (
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="your@email.com"
              error={!!error}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        )}
      </FormField>
      <Button type="submit" className="w-full">
        Submit
      </Button>
    </Form>
  ),
};

// バリデーションモード展示
export const OnBlurValidation: Story = {
  args: {
    mode: 'onBlur',
  },
  render: args => (
    <Form {...args} className="w-80">
      <FormField
        name="username"
        rules={{ minLength: { value: 3, message: 'Too short' } }}
      >
        {({ value, onChange, onBlur, error }) => (
          <div>
            <label className="text-sm font-medium">
              Username (validates on blur)
            </label>
            <Input
              value={value}
              onChange={e => onChange(e.target.value)}
              onBlur={onBlur}
              placeholder="Enter username"
              error={!!error}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        )}
      </FormField>
      <Button type="submit" className="w-full">
        Submit
      </Button>
    </Form>
  ),
};

export const OnChangeValidation: Story = {
  args: {
    mode: 'onChange',
  },
  render: args => (
    <Form {...args} className="w-80">
      <FormField
        name="password"
        rules={{ minLength: { value: 8, message: 'Password too short' } }}
      >
        {({ value, onChange, error }) => (
          <div>
            <label className="text-sm font-medium">
              Password (validates on change)
            </label>
            <Input
              type="password"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="Enter password"
              error={!!error}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        )}
      </FormField>
      <Button type="submit" className="w-full">
        Submit
      </Button>
    </Form>
  ),
};

// 複数フィールドフォーム
export const MultipleFields: Story = {
  render: args => (
    <Form {...args} className="w-80 space-y-4">
      <FormField
        name="firstName"
        rules={{ required: 'First name is required' }}
      >
        {({ value, onChange, error }) => (
          <div>
            <label className="text-sm font-medium">First Name</label>
            <Input
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="John"
              error={!!error}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        )}
      </FormField>

      <FormField name="lastName" rules={{ required: 'Last name is required' }}>
        {({ value, onChange, error }) => (
          <div>
            <label className="text-sm font-medium">Last Name</label>
            <Input
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="Doe"
              error={!!error}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        )}
      </FormField>

      <FormField
        name="email"
        rules={{
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email format',
          },
        }}
      >
        {({ value, onChange, error }) => (
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="john@example.com"
              error={!!error}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        )}
      </FormField>

      <Button type="submit" className="w-full">
        Submit
      </Button>
    </Form>
  ),
};

// デフォルト値付きフォーム
export const WithDefaultValues: Story = {
  args: {
    defaultValues: {
      username: 'johndoe',
      bio: 'Software developer',
    },
  },
  render: args => (
    <Form {...args} className="w-80 space-y-4">
      <FormField name="username">
        {({ value, onChange }) => (
          <div>
            <label className="text-sm font-medium">Username</label>
            <Input
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="Enter username"
            />
          </div>
        )}
      </FormField>

      <FormField name="bio">
        {({ value, onChange }) => (
          <div>
            <label className="text-sm font-medium">Bio</label>
            <textarea
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="Tell us about yourself"
              className="w-full rounded-md border p-2"
              rows={3}
            />
          </div>
        )}
      </FormField>

      <Button type="submit" className="w-full">
        Update Profile
      </Button>
    </Form>
  ),
};

// 非同期バリデーション
export const AsyncValidation: Story = {
  render: args => (
    <Form {...args} className="w-80" mode="onBlur">
      <FormField
        name="username"
        rules={{
          required: 'Username is required',
          validate: async value => {
            // 非同期バリデーションシミュレーション
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (value === 'admin') {
              return 'Username "admin" is not available';
            }
            return true;
          },
        }}
      >
        {({ value, onChange, onBlur, error }) => (
          <div>
            <label className="text-sm font-medium">
              Username (try &quot;admin&quot;)
            </label>
            <Input
              value={value}
              onChange={e => onChange(e.target.value)}
              onBlur={onBlur}
              placeholder="Enter username"
              error={!!error}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Validates when you blur the field
            </p>
          </div>
        )}
      </FormField>
      <Button type="submit" className="w-full">
        Check Availability
      </Button>
    </Form>
  ),
};

// ローディング状態付きフォーム
export const WithLoading: Story = {
  render: args => (
    <Form {...args} className="w-80">
      {({ isSubmitting }) => (
        <>
          <FormField name="email" rules={{ required: true }}>
            {({ value, onChange, error }) => (
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isSubmitting}
                  error={!!error}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
              </div>
            )}
          </FormField>
          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </>
      )}
    </Form>
  ),
};

// 複雑なバリデーションルール
export const ComplexValidation: Story = {
  render: args => (
    <Form {...args} className="w-80 space-y-4" mode="all">
      <FormField
        name="password"
        rules={{
          required: 'Password is required',
          minLength: {
            value: 8,
            message: 'Password must be at least 8 characters',
          },
          pattern: {
            value:
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            message:
              'Password must contain uppercase, lowercase, number, and special character',
          },
        }}
      >
        {({ value, onChange, error }) => (
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="Enter secure password"
              error={!!error}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Must contain: uppercase, lowercase, number, and special character
            </p>
          </div>
        )}
      </FormField>

      <FormField
        name="confirmPassword"
        rules={{
          required: 'Please confirm password',
          validate: (value, formData) => {
            if (value !== formData.password) {
              return 'Passwords do not match';
            }
            return true;
          },
        }}
      >
        {({ value, onChange, error }) => (
          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <Input
              type="password"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="Confirm password"
              error={!!error}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        )}
      </FormField>

      <Button type="submit" className="w-full">
        Create Account
      </Button>
    </Form>
  ),
};
