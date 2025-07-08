/**
 * Button Component TDD テスト - Red Phase
 * 基本的なボタンコンポーネントのテスト
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// これらは実装前なので失敗する（Red Phase）
import { Button } from '../../../src/components/ui/button';

describe('Button Component (TDD Red Phase)', () => {
  describe('基本レンダリング', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
    });

    it('should render button with custom className', () => {
      render(<Button className="custom-class">Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('バリアント（スタイル）', () => {
    it('should render default variant', () => {
      render(<Button variant="default">Default Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'bg-gradient-primary',
        'text-primary-foreground'
      );
    });

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'bg-destructive',
        'text-destructive-foreground'
      );
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('glass-ultra', 'border');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'bg-gradient-dark',
        'text-secondary-foreground'
      );
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:glass-neon');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-gradient-primary', 'underline-offset-4');
    });
  });

  describe('サイズ', () => {
    it('should render default size', () => {
      render(<Button size="default">Default Size</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12', 'px-6', 'py-3');
    });

    it('should render small size', () => {
      render(<Button size="sm">Small Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-4');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-14', 'px-10');
    });

    it('should render icon size', () => {
      render(
        <Button size="icon" aria-label="Settings">
          ⚙️
        </Button>
      );

      const button = screen.getByRole('button', { name: 'Settings' });
      expect(button).toHaveClass('h-12', 'w-12');
    });
  });

  describe('インタラクション', () => {
    it('should handle click events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      const handleClick = jest.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should be focusable', () => {
      render(<Button>Focusable Button</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(document.activeElement).toBe(button);
    });
  });

  describe('ローディング状態', () => {
    it('should show loading state', () => {
      render(<Button loading>Loading...</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    });

    it('should show loading spinner when loading', () => {
      render(<Button loading>Save</Button>);

      expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
    });
  });

  describe('アイコン対応', () => {
    it('should render with left icon', () => {
      const Icon = () => <span data-testid="left-icon">←</span>;
      render(<Button leftIcon={<Icon />}>Back</Button>);

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should render with right icon', () => {
      const Icon = () => <span data-testid="right-icon">→</span>;
      render(<Button rightIcon={<Icon />}>Next</Button>);

      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should render with both icons', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>;
      const RightIcon = () => <span data-testid="right-icon">→</span>;
      render(
        <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
          Navigate
        </Button>
      );

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('Navigate')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Button
          aria-label="Save document"
          aria-describedby="save-description"
          aria-pressed={true}
        >
          Save
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Save document');
      expect(button).toHaveAttribute('aria-describedby', 'save-description');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should support type attribute', () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Button with ref</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('asChild機能', () => {
    it('should render as a different element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/home">Home Link</a>
        </Button>
      );

      const link = screen.getByRole('link', { name: 'Home Link' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/home');
    });
  });
});
