/**
 * Form Component TDD テスト - Red Phase
 * フォームコンポーネントのテスト（バリデーション基盤含む）
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// これらは実装前なので失敗する（Red Phase）
import { Form, FormField } from '../../../src/components/ui/form';

describe('Form Component (TDD Red Phase)', () => {
  describe('基本レンダリング', () => {
    it('should render form element', () => {
      const handleSubmit = jest.fn();
      render(<Form onSubmit={handleSubmit}>Form content</Form>);

      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const handleSubmit = jest.fn();
      render(
        <Form onSubmit={handleSubmit} className="custom-form">
          Form
        </Form>
      );

      const form = screen.getByRole('form');
      expect(form).toHaveClass('custom-form');
    });

    it('should render with id', () => {
      const handleSubmit = jest.fn();
      render(
        <Form onSubmit={handleSubmit} id="login-form">
          Form
        </Form>
      );

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('id', 'login-form');
    });
  });

  describe('フォーム送信', () => {
    it('should handle form submission', async () => {
      const handleSubmit = jest.fn();
      render(
        <Form onSubmit={handleSubmit}>
          <button type="submit">Submit</button>
        </Form>
      );

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('should prevent default form submission', async () => {
      const handleSubmit = jest.fn();
      render(
        <Form onSubmit={handleSubmit}>
          <button type="submit">Submit</button>
        </Form>
      );

      const form = screen.getByRole('form');
      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      });

      await act(async () => {
        form.dispatchEvent(submitEvent);
      });

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });

      expect(submitEvent.defaultPrevented).toBe(true);
    });

    it('should pass form data to onSubmit handler', async () => {
      const handleSubmit = jest.fn();
      render(
        <Form onSubmit={handleSubmit} defaultValues={{ username: 'john' }}>
          <FormField name="username">
            {({ value, onChange }) => (
              <input
                value={value}
                onChange={e => onChange(e.target.value)}
                data-testid="username-input"
              />
            )}
          </FormField>
          <button type="submit">Submit</button>
        </Form>
      );

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ username: 'john' })
        );
      });
    });
  });

  describe('デフォルト値', () => {
    it('should initialize with default values', () => {
      const handleSubmit = jest.fn();
      render(
        <Form
          onSubmit={handleSubmit}
          defaultValues={{ email: 'test@example.com' }}
        >
          <FormField name="email">
            {({ value }) => (
              <input value={value} data-testid="email-input" readOnly />
            )}
          </FormField>
        </Form>
      );

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      expect(emailInput.value).toBe('test@example.com');
    });

    it('should override default values with field default values', () => {
      const handleSubmit = jest.fn();
      render(
        <Form onSubmit={handleSubmit} defaultValues={{ name: 'John' }}>
          <FormField name="name" defaultValue="Jane">
            {({ value }) => (
              <input value={value} data-testid="name-input" readOnly />
            )}
          </FormField>
        </Form>
      );

      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      expect(nameInput.value).toBe('Jane');
    });
  });

  describe('バリデーションモード', () => {
    it('should validate onSubmit by default', async () => {
      const handleSubmit = jest.fn();
      render(
        <Form onSubmit={handleSubmit}>
          <FormField name="required-field" rules={{ required: true }}>
            {({ value, onChange, error }) => (
              <div>
                <input
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  data-testid="required-input"
                />
                {error && <span data-testid="error-message">{error}</span>}
              </div>
            )}
          </FormField>
          <button type="submit">Submit</button>
        </Form>
      );

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should validate onBlur when mode is onBlur', async () => {
      const handleSubmit = jest.fn();
      render(
        <Form onSubmit={handleSubmit} mode="onBlur">
          <FormField name="email" rules={{ required: true }}>
            {({ value, onChange, onBlur, error }) => (
              <div>
                <input
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  onBlur={onBlur}
                  data-testid="email-input"
                />
                {error && <span data-testid="error-message">{error}</span>}
              </div>
            )}
          </FormField>
        </Form>
      );

      const emailInput = screen.getByTestId('email-input');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should validate onChange when mode is onChange', async () => {
      const handleSubmit = jest.fn();
      render(
        <Form onSubmit={handleSubmit} mode="onChange">
          <FormField
            name="username"
            rules={{ minLength: { value: 3, message: 'Too short' } }}
          >
            {({ value, onChange, error }) => (
              <div>
                <input
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  data-testid="username-input"
                />
                {error && <span data-testid="error-message">{error}</span>}
              </div>
            )}
          </FormField>
        </Form>
      );

      const usernameInput = screen.getByTestId('username-input');
      await userEvent.type(usernameInput, 'ab');

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(
          'Too short'
        );
      });
    });
  });

  describe('非同期送信', () => {
    it('should handle async onSubmit', async () => {
      const handleSubmit = jest.fn().mockResolvedValue(undefined);
      render(
        <Form onSubmit={handleSubmit}>
          <button type="submit">Submit</button>
        </Form>
      );

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });

    it('should show loading state during async submission', async () => {
      const handleSubmit = jest.fn(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      render(
        <Form onSubmit={handleSubmit}>
          {({ isSubmitting }) => (
            <>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </>
          )}
        </Form>
      );

      const submitButton = screen.getByRole('button');
      fireEvent.click(submitButton);

      expect(screen.getByText('Submitting...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });
    });
  });
});

describe('FormField Component (TDD Red Phase)', () => {
  const MockForm = ({ children, defaultValues = {} }: any) => {
    const handleSubmit = jest.fn();
    return (
      <Form onSubmit={handleSubmit} defaultValues={defaultValues}>
        {children}
      </Form>
    );
  };

  describe('基本レンダリング', () => {
    it('should render field with name', () => {
      render(
        <MockForm>
          <FormField name="test-field">
            {({ value }) => (
              <input value={value} data-testid="test-input" readOnly />
            )}
          </FormField>
        </MockForm>
      );

      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(
        <MockForm>
          <FormField name="username" label="Username">
            {({ value }) => (
              <input value={value} data-testid="username-input" readOnly />
            )}
          </FormField>
        </MockForm>
      );

      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(
        <MockForm>
          <FormField
            name="password"
            description="Must be at least 8 characters"
          >
            {({ value }) => (
              <input value={value} data-testid="password-input" readOnly />
            )}
          </FormField>
        </MockForm>
      );

      expect(
        screen.getByText('Must be at least 8 characters')
      ).toBeInTheDocument();
    });
  });

  describe('フィールド状態管理', () => {
    it('should track field value', async () => {
      render(
        <MockForm>
          <FormField name="name">
            {({ value, onChange }) => (
              <input
                value={value}
                onChange={e => onChange(e.target.value)}
                data-testid="name-input"
              />
            )}
          </FormField>
        </MockForm>
      );

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'John Doe');

      expect(nameInput).toHaveValue('John Doe');
    });

    it('should track touched state', async () => {
      render(
        <MockForm>
          <FormField name="email">
            {({ value, onChange, onBlur, touched }) => (
              <div>
                <input
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  onBlur={onBlur}
                  data-testid="email-input"
                />
                {touched && <span data-testid="touched">Field touched</span>}
              </div>
            )}
          </FormField>
        </MockForm>
      );

      const emailInput = screen.getByTestId('email-input');

      expect(screen.queryByTestId('touched')).not.toBeInTheDocument();

      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByTestId('touched')).toBeInTheDocument();
      });
    });

    it('should track dirty state', async () => {
      render(
        <MockForm defaultValues={{ bio: 'Initial bio' }}>
          <FormField name="bio">
            {({ value, onChange, dirty }) => (
              <div>
                <input
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  data-testid="bio-input"
                />
                {dirty && <span data-testid="dirty">Field modified</span>}
              </div>
            )}
          </FormField>
        </MockForm>
      );

      const bioInput = screen.getByTestId('bio-input');

      expect(screen.queryByTestId('dirty')).not.toBeInTheDocument();

      await userEvent.type(bioInput, ' updated');

      await waitFor(() => {
        expect(screen.getByTestId('dirty')).toBeInTheDocument();
      });
    });
  });

  describe('バリデーションルール', () => {
    it('should validate required fields', async () => {
      render(
        <MockForm>
          <FormField
            name="required-field"
            rules={{ required: 'This field is required' }}
          >
            {({ value, onChange, error }) => (
              <div>
                <input
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  data-testid="required-input"
                />
                {error && <span data-testid="error">{error}</span>}
              </div>
            )}
          </FormField>
          <button type="submit">Submit</button>
        </MockForm>
      );

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'This field is required'
        );
      });
    });

    it('should validate minimum length', async () => {
      render(
        <MockForm>
          <FormField
            name="username"
            rules={{ minLength: { value: 5, message: 'Username too short' } }}
          >
            {({ value, onChange, error }) => (
              <div>
                <input
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  data-testid="username-input"
                />
                {error && <span data-testid="error">{error}</span>}
              </div>
            )}
          </FormField>
          <button type="submit">Submit</button>
        </MockForm>
      );

      const usernameInput = screen.getByTestId('username-input');
      await userEvent.type(usernameInput, 'abc');

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Username too short'
        );
      });
    });

    it('should validate maximum length', async () => {
      render(
        <MockForm>
          <FormField
            name="bio"
            rules={{ maxLength: { value: 10, message: 'Bio too long' } }}
          >
            {({ value, onChange, error }) => (
              <div>
                <input
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  data-testid="bio-input"
                />
                {error && <span data-testid="error">{error}</span>}
              </div>
            )}
          </FormField>
          <button type="submit">Submit</button>
        </MockForm>
      );

      const bioInput = screen.getByTestId('bio-input');
      await userEvent.type(bioInput, 'This is a very long bio');

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Bio too long');
      });
    });

    it('should validate pattern', async () => {
      render(
        <MockForm>
          <FormField
            name="email"
            rules={{
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email format',
              },
            }}
          >
            {({ value, onChange, error }) => (
              <div>
                <input
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  data-testid="email-input"
                />
                {error && <span data-testid="error">{error}</span>}
              </div>
            )}
          </FormField>
          <button type="submit">Submit</button>
        </MockForm>
      );

      const emailInput = screen.getByTestId('email-input');
      await userEvent.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Invalid email format'
        );
      });
    });

    it('should validate with custom function', async () => {
      const customValidator = (value: string) => {
        return value === 'forbidden' ? 'This value is not allowed' : true;
      };

      render(
        <MockForm>
          <FormField name="custom-field" rules={{ validate: customValidator }}>
            {({ value, onChange, error }) => (
              <div>
                <input
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  data-testid="custom-input"
                />
                {error && <span data-testid="error">{error}</span>}
              </div>
            )}
          </FormField>
          <button type="submit">Submit</button>
        </MockForm>
      );

      const customInput = screen.getByTestId('custom-input');
      await userEvent.type(customInput, 'forbidden');

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'This value is not allowed'
        );
      });
    });

    it('should handle async validation', async () => {
      const asyncValidator = async (value: string) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return value === 'taken' ? 'Username already taken' : true;
      };

      render(
        <MockForm>
          <FormField name="username" rules={{ validate: asyncValidator }}>
            {({ value, onChange, error }) => (
              <div>
                <input
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  data-testid="username-input"
                />
                {error && <span data-testid="error">{error}</span>}
              </div>
            )}
          </FormField>
          <button type="submit">Submit</button>
        </MockForm>
      );

      const usernameInput = screen.getByTestId('username-input');
      await userEvent.type(usernameInput, 'taken');

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByTestId('error')).toHaveTextContent(
            'Username already taken'
          );
        },
        { timeout: 3000 }
      );
    });
  });

  describe('複数バリデーションルール', () => {
    it('should apply multiple validation rules', async () => {
      render(
        <MockForm>
          <FormField
            name="password"
            rules={{
              required: 'Password is required',
              minLength: { value: 8, message: 'Password too short' },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message:
                  'Password must contain uppercase, lowercase and number',
              },
            }}
          >
            {({ value, onChange, error }) => (
              <div>
                <input
                  type="password"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  data-testid="password-input"
                />
                {error && <span data-testid="error">{error}</span>}
              </div>
            )}
          </FormField>
          <button type="submit">Submit</button>
        </MockForm>
      );

      const passwordInput = screen.getByTestId('password-input');
      const submitButton = screen.getByRole('button', { name: 'Submit' });

      // Test required validation
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Password is required'
        );
      });

      // Test minimum length validation
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, 'abc');
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Password too short'
        );
      });

      // Test pattern validation
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, 'abcdefgh');
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Password must contain uppercase, lowercase and number'
        );
      });
    });
  });
});
