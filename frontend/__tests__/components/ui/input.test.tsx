/**
 * Input Component TDD テスト - Red Phase
 * セキュアな入力コンポーネントのテスト（XSS対策含む）
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// TDD Green Phase - Implementation should now pass these tests
import { Input } from '../../../src/components/ui/input';

describe('Input Component (TDD Red Phase)', () => {
  describe('基本レンダリング', () => {
    it('should render input element', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter your name" />);

      const input = screen.getByPlaceholderText('Enter your name');
      expect(input).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Input className="custom-input" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input');
    });

    it('should render with id', () => {
      render(<Input id="username-input" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'username-input');
    });
  });

  describe('タイプ別レンダリング', () => {
    it('should render text input by default', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render email input', () => {
      render(<Input type="email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<Input type="password" placeholder="Password" />);

      // パスワードフィールドはrole='textbox'ではない
      const input = screen.getByPlaceholderText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<Input type="number" />);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render search input', () => {
      render(<Input type="search" />);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });
  });

  describe('サイズバリエーション', () => {
    it('should render default size', () => {
      render(<Input size="default" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-10', 'px-3', 'py-2');
    });

    it('should render small size', () => {
      render(<Input size="sm" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-9', 'px-3', 'py-1');
    });

    it('should render large size', () => {
      render(<Input size="lg" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-11', 'px-4', 'py-3');
    });
  });

  describe('値の管理', () => {
    it('should handle value prop', () => {
      render(<Input value="Test value" onChange={() => {}} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Test value');
    });

    it('should handle defaultValue prop', () => {
      render(<Input defaultValue="Default value" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Default value');
    });

    it('should handle onChange events', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Hello');

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(5); // H-e-l-l-o
    });

    it('should handle onBlur events', () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      fireEvent.blur(input);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle onFocus events', () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('エラー状態とヘルパーテキスト', () => {
    it('should render with error state', () => {
      render(<Input error />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-destructive');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should render helper text', () => {
      render(<Input helperText="This field is required" />);

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should render error helper text with error state', () => {
      render(<Input error helperText="Invalid email format" />);

      const helperText = screen.getByText('Invalid email format');
      expect(helperText).toHaveClass('text-destructive');
    });

    it('should connect helper text with aria-describedby', () => {
      render(<Input id="email" helperText="Enter your email address" />);

      const input = screen.getByRole('textbox');
      const helperText = screen.getByText('Enter your email address');

      expect(input).toHaveAttribute(
        'aria-describedby',
        expect.stringContaining('helper-text')
      );
      expect(helperText).toHaveAttribute(
        'id',
        expect.stringContaining('helper-text')
      );
    });
  });

  describe('左右の要素（アイコン・プレフィックス）', () => {
    it('should render with left element', () => {
      const LeftIcon = () => <span data-testid="search-icon">🔍</span>;
      render(<Input leftElement={<LeftIcon />} />);

      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('should render with right element', () => {
      const RightIcon = () => <span data-testid="clear-icon">✕</span>;
      render(<Input rightElement={<RightIcon />} />);

      expect(screen.getByTestId('clear-icon')).toBeInTheDocument();
    });

    it('should render with both elements', () => {
      const LeftIcon = () => <span data-testid="currency">$</span>;
      const RightIcon = () => <span data-testid="unit">.00</span>;
      render(<Input leftElement={<LeftIcon />} rightElement={<RightIcon />} />);

      expect(screen.getByTestId('currency')).toBeInTheDocument();
      expect(screen.getByTestId('unit')).toBeInTheDocument();
    });

    it('should apply proper spacing with elements', () => {
      const LeftIcon = () => <span>🔍</span>;
      render(<Input leftElement={<LeftIcon />} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pl-10'); // 左側にアイコン分のパディング
    });
  });

  describe('無効化状態', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass(
        'disabled:cursor-not-allowed',
        'disabled:opacity-50'
      );
    });

    it('should not accept input when disabled', async () => {
      const handleChange = jest.fn();
      render(<Input disabled onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Test');

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('読み取り専用状態', () => {
    it('should be readonly when readOnly prop is true', () => {
      render(<Input readOnly value="Read only value" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });

    it('should not be editable when readonly', async () => {
      const handleChange = jest.fn();
      render(<Input readOnly value="Initial" onChange={handleChange} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.type(input, 'Test');

      expect(input.value).toBe('Initial');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('XSS対策とサニタイズ', () => {
    it('should sanitize malicious input by default', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      const maliciousInput = '<script>alert("XSS")</script>';

      await userEvent.type(input, maliciousInput);

      // サニタイズされた値でonChangeが呼ばれることを確認
      const lastCall =
        handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const event = lastCall[0];
      expect(event.target.value).not.toContain('<script>');
    });

    it('should allow disabling sanitization when explicitly set', async () => {
      const handleChange = jest.fn();
      render(<Input sanitize={false} onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      const htmlInput = '<b>Bold text</b>';

      await userEvent.type(input, htmlInput);

      // サニタイズが無効の場合、HTMLがそのまま保持される
      const lastCall =
        handleChange.mock.calls[handleChange.mock.calls.length - 1];
      const event = lastCall[0];
      expect(event.target.value).toContain('<b>');
    });

    it('should prevent script injection in placeholder', () => {
      const maliciousPlaceholder = '<img src=x onerror=alert("XSS")>';
      render(<Input placeholder={maliciousPlaceholder} />);

      const input = screen.getByRole('textbox');
      // プレースホルダーがエスケープされていることを確認
      expect(input.getAttribute('placeholder')).not.toContain('<img');
    });
  });

  describe('アクセシビリティ', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Input
          aria-label="Email address"
          aria-required={true}
          aria-describedby="email-help"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Email address');
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'email-help');
    });

    it('should support autocomplete attribute', () => {
      render(<Input type="email" autoComplete="email" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autocomplete', 'email');
    });

    it('should be focusable', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      input.focus();

      expect(document.activeElement).toBe(input);
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('フォーカス管理', () => {
    it('should show focus ring when focused', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(input).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring'
      );
    });

    it('should remove focus ring when blurred', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.blur(input);

      // フォーカスリングのクラスは疑似クラスなので、実際のフォーカス状態を確認
      expect(document.activeElement).not.toBe(input);
    });
  });

  describe('パフォーマンスとデバウンス', () => {
    it('should support debounced onChange', async () => {
      jest.useFakeTimers();
      const handleChange = jest.fn();

      render(<Input onChange={handleChange} debounce={300} />);

      const input = screen.getByRole('textbox');

      // 単一文字入力
      fireEvent.change(input, { target: { value: 'H' } });

      // デバウンス時間前はコールバックが呼ばれない
      expect(handleChange).not.toHaveBeenCalled();

      // デバウンス時間経過後
      jest.advanceTimersByTime(300);

      // コールバックが1回呼ばれる
      expect(handleChange).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });
});
