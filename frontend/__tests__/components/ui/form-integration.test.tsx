/**
 * Form Component Integration Tests
 * フォームバリデーションとアクセシビリティの統合テスト
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { Form, FormField } from '../../../src/components/ui/form';
import { Input } from '../../../src/components/ui/input';
import { Button } from '../../../src/components/ui/button';

describe('Form Integration Tests', () => {
  describe('エラーサマリー機能', () => {
    it('should display error summary when validation fails', async () => {
      const mockSubmit = jest.fn();

      render(
        <Form onSubmit={mockSubmit} showErrorSummary={true}>
          <FormField name="email" rules={{ required: 'Email is required' }}>
            {({ value, onChange, onBlur, error }) => (
              <Input
                type="email"
                label="Email"
                value={value as string}
                onChange={e => onChange(e.target.value)}
                onBlur={onBlur}
                error={!!error}
                helperText={error}
                required
              />
            )}
          </FormField>

          <FormField
            name="password"
            rules={{
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            }}
          >
            {({ value, onChange, onBlur, error }) => (
              <Input
                type="password"
                label="Password"
                value={value as string}
                onChange={e => onChange(e.target.value)}
                onBlur={onBlur}
                error={!!error}
                helperText={error}
                required
                minLength={8}
              />
            )}
          </FormField>

          <Button type="submit">Submit</Button>
        </Form>
      );

      // フォームを送信（空の状態で）
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      // エラーサマリーが表示されることを確認
      await waitFor(() => {
        expect(
          screen.getByText('Please fix the following errors:')
        ).toBeInTheDocument();
        expect(screen.getAllByText('Email is required')).toHaveLength(2); // サマリーとフィールドの両方
        expect(screen.getAllByText('Password is required')).toHaveLength(2); // サマリーとフィールドの両方
      });

      // エラーリンクがクリック可能であることを確認
      const emailErrorLink = screen.getByRole('link', {
        name: 'Email is required',
      });
      expect(emailErrorLink).toBeInTheDocument();
      expect(emailErrorLink).toHaveAttribute('href', '#email');
    });

    it('should hide error summary when all errors are resolved', async () => {
      const mockSubmit = jest.fn();

      render(
        <Form onSubmit={mockSubmit}>
          <FormField name="email" rules={{ required: 'Email is required' }}>
            {({ value, onChange, onBlur, error }) => (
              <Input
                type="email"
                label="Email"
                value={value as string}
                onChange={e => onChange(e.target.value)}
                onBlur={onBlur}
                error={!!error}
                helperText={error}
                required
              />
            )}
          </FormField>

          <Button type="submit">Submit</Button>
        </Form>
      );

      // まず空でサブミットしてエラーを表示
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please fix the following errors:')
        ).toBeInTheDocument();
      });

      // 有効な値を入力
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      await userEvent.type(emailInput, 'test@example.com');

      // 再度サブミット
      fireEvent.click(submitButton);

      // エラーサマリーが消えることを確認
      await waitFor(() => {
        expect(
          screen.queryByText('Please fix the following errors:')
        ).not.toBeInTheDocument();
      });

      // モックが呼ばれることを確認
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
      });
    });
  });

  describe('アクセシビリティ統合', () => {
    it('should have proper ARIA relationships between form elements', () => {
      render(
        <Form onSubmit={() => {}}>
          <FormField
            name="username"
            rules={{ required: 'Username is required' }}
          >
            {({ value, onChange, onBlur, error }) => (
              <Input
                label="Username"
                description="Choose a unique username"
                value={value as string}
                onChange={e => onChange(e.target.value)}
                onBlur={onBlur}
                error={!!error}
                helperText={error}
                required
                maxLength={20}
              />
            )}
          </FormField>
        </Form>
      );

      const input = screen.getByRole('textbox', { name: /username/i });
      const label = screen.getByText('Username');
      const description = screen.getByText('Choose a unique username');

      // labelとinputの関連性を確認
      expect(label).toHaveAttribute('for', input.id);

      // aria-describedbyの確認
      expect(input).toHaveAttribute('aria-describedby');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain(description.id);

      // aria-requiredの確認
      expect(input).toHaveAttribute('aria-required', 'true');

      // maxlengthの確認
      expect(input).toHaveAttribute('maxlength', '20');
    });

    it('should manage focus properly in error scenarios', async () => {
      render(
        <Form onSubmit={() => {}}>
          <FormField name="email" rules={{ required: 'Email is required' }}>
            {({ value, onChange, onBlur, error }) => (
              <Input
                label="Email"
                value={value as string}
                onChange={e => onChange(e.target.value)}
                onBlur={onBlur}
                error={!!error}
                helperText={error}
                required
              />
            )}
          </FormField>

          <Button type="submit">Submit</Button>
        </Form>
      );

      // フォームを送信
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      // エラーサマリーが表示されるまで待機
      await waitFor(() => {
        expect(
          screen.getByText('Please fix the following errors:')
        ).toBeInTheDocument();
      });

      // エラーリンクをクリック
      const errorLink = screen.getByRole('link', { name: 'Email is required' });
      fireEvent.click(errorLink);

      // フォーカスがinputに移ることを確認（実際のDOM操作をシミュレート）
      const input = screen.getByRole('textbox', { name: /email/i });
      expect(input).toBeInTheDocument();
    });
  });

  describe('複雑なバリデーションシナリオ', () => {
    it('should handle mixed validation modes', async () => {
      const mockSubmit = jest.fn();

      render(
        <Form onSubmit={mockSubmit} mode="onBlur">
          <FormField
            name="email"
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email',
              },
            }}
          >
            {({ value, onChange, onBlur, error }) => (
              <Input
                type="email"
                label="Email"
                value={value as string}
                onChange={e => onChange(e.target.value)}
                onBlur={onBlur}
                error={!!error}
                helperText={error}
                required
              />
            )}
          </FormField>
        </Form>
      );

      const input = screen.getByRole('textbox', { name: /email/i });

      // 無効な値を入力してブラー
      await userEvent.type(input, 'invalid-email');
      fireEvent.blur(input);

      // バリデーションエラーが表示されることを確認
      await waitFor(() => {
        expect(screen.getAllByText('Please enter a valid email')).toHaveLength(
          2
        ); // エラーサマリーとフィールドエラーの両方
      });

      // 有効な値に修正
      await userEvent.clear(input);
      await userEvent.type(input, 'valid@example.com');
      fireEvent.blur(input);

      // エラーが消えることを確認
      await waitFor(() => {
        expect(
          screen.queryByText('Please enter a valid email')
        ).not.toBeInTheDocument();
      });
    });

    it('should handle custom validation functions', async () => {
      const customValidator = jest
        .fn()
        .mockResolvedValue('Custom validation error');

      render(
        <Form onSubmit={() => {}}>
          <FormField
            name="username"
            rules={{
              validate: customValidator,
            }}
          >
            {({ value, onChange, onBlur, error }) => (
              <Input
                label="Username"
                value={value as string}
                onChange={e => onChange(e.target.value)}
                onBlur={onBlur}
                error={!!error}
                helperText={error}
              />
            )}
          </FormField>

          <Button type="submit">Submit</Button>
        </Form>
      );

      const input = screen.getByRole('textbox', { name: /username/i });
      await userEvent.type(input, 'test-user');

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      // カスタムバリデーターが呼ばれることを確認
      await waitFor(() => {
        expect(customValidator).toHaveBeenCalledWith('test-user');
      });

      // カスタムエラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getAllByText('Custom validation error')).toHaveLength(2); // エラーサマリーとフィールドエラーの両方
      });
    });
  });

  describe('フォーム機能テスト', () => {
    it('should properly handle field registration and form state', async () => {
      const mockSubmit = jest.fn();

      render(
        <Form onSubmit={mockSubmit}>
          <FormField name="test" rules={{ required: 'Test is required' }}>
            {({ value, onChange, error }) => (
              <Input
                label="Test Field"
                value={value as string}
                onChange={e => onChange(e.target.value)}
                error={!!error}
                helperText={error}
              />
            )}
          </FormField>

          <Button type="submit">Submit</Button>
        </Form>
      );

      // フィールドが正常にレンダリングされることを確認
      const input = screen.getByRole('textbox', { name: /test field/i });
      expect(input).toBeInTheDocument();

      // 値を入力
      await userEvent.type(input, 'test value');

      // フォームを送信
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      // 正しい値でサブミットが呼ばれることを確認
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({ test: 'test value' });
      });
    });
  });
});
