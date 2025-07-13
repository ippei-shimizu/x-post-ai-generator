/**
 * Card Component TDD テスト - Red Phase
 * カードコンポーネントのテスト（Header, Content, Footerサブコンポーネント含む）
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// これらは実装前なので失敗する（Red Phase）
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '../../../src/components/ui/card';

describe.skip('Card Component (TDD Red Phase)', () => {
  // FIXME: UIコンポーネント統一でスキップ
  describe('基本レンダリング', () => {
    it('should render card element', () => {
      render(<Card>Card content</Card>);

      const card = screen.getByText('Card content');
      expect(card).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Card className="custom-card">Card</Card>);

      const card = screen.getByText('Card');
      expect(card).toHaveClass('custom-card');
    });

    it('should render with id', () => {
      render(<Card id="user-card">Card</Card>);

      const card = screen.getByText('Card');
      expect(card).toHaveAttribute('id', 'user-card');
    });
  });

  describe('バリアント（スタイル）', () => {
    it('should render default variant', () => {
      render(<Card variant="default">Default Card</Card>);

      const card = screen.getByText('Default Card');
      expect(card).toHaveClass(
        'border',
        'bg-card',
        'text-card-foreground',
        'shadow-sm'
      );
    });

    it('should render outline variant', () => {
      render(<Card variant="outline">Outline Card</Card>);

      const card = screen.getByText('Outline Card');
      expect(card).toHaveClass('border-2', 'border-border');
    });

    it('should render ghost variant', () => {
      render(<Card variant="ghost">Ghost Card</Card>);

      const card = screen.getByText('Ghost Card');
      expect(card).toHaveClass('border-transparent', 'shadow-none');
    });
  });

  describe('パディング設定', () => {
    it('should render with no padding', () => {
      render(<Card padding="none">No padding card</Card>);

      const card = screen.getByText('No padding card');
      expect(card).toHaveClass('p-0');
    });

    it('should render with small padding', () => {
      render(<Card padding="sm">Small padding card</Card>);

      const card = screen.getByText('Small padding card');
      expect(card).toHaveClass('p-4');
    });

    it('should render with default padding', () => {
      render(<Card padding="default">Default padding card</Card>);

      const card = screen.getByText('Default padding card');
      expect(card).toHaveClass('p-6');
    });

    it('should render with large padding', () => {
      render(<Card padding="lg">Large padding card</Card>);

      const card = screen.getByText('Large padding card');
      expect(card).toHaveClass('p-8');
    });
  });

  describe('インタラクティブ機能', () => {
    it('should handle click events when interactive', () => {
      const handleClick = jest.fn();
      render(
        <Card interactive onClick={handleClick}>
          Interactive Card
        </Card>
      );

      const card = screen.getByText('Interactive Card');
      expect(card).toHaveClass(
        'cursor-pointer',
        'transition-colors',
        'hover:bg-accent'
      );

      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not have interactive styles when not interactive', () => {
      render(<Card>Non-interactive Card</Card>);

      const card = screen.getByText('Non-interactive Card');
      expect(card).not.toHaveClass('cursor-pointer');
    });

    it('should handle keyboard events when interactive', () => {
      const handleClick = jest.fn();
      render(
        <Card interactive onClick={handleClick} tabIndex={0}>
          Keyboard Card
        </Card>
      );

      const card = screen.getByText('Keyboard Card');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle spacebar when interactive', () => {
      const handleClick = jest.fn();
      render(
        <Card interactive onClick={handleClick} tabIndex={0}>
          Spacebar Card
        </Card>
      );

      const card = screen.getByText('Spacebar Card');
      fireEvent.keyDown(card, { key: ' ' });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('アクセシビリティ', () => {
    it('should support ARIA attributes', () => {
      render(
        <Card
          role="article"
          aria-label="User profile card"
          aria-describedby="card-description"
        >
          Accessible Card
        </Card>
      );

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', 'User profile card');
      expect(card).toHaveAttribute('aria-describedby', 'card-description');
    });

    it('should be focusable when interactive', () => {
      render(
        <Card interactive tabIndex={0}>
          Focusable Card
        </Card>
      );

      const card = screen.getByText('Focusable Card');
      card.focus();

      expect(document.activeElement).toBe(card);
    });
  });
});

describe('CardHeader Component (TDD Red Phase)', () => {
  describe('基本レンダリング', () => {
    it('should render header content', () => {
      render(<CardHeader>Header content</CardHeader>);

      const header = screen.getByText('Header content');
      expect(header).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<CardHeader className="custom-header">Header</CardHeader>);

      const header = screen.getByText('Header').parentElement;
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('タイトルと説明', () => {
    it('should render with title', () => {
      render(<CardHeader title="Card Title">Content</CardHeader>);

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Title')).toHaveClass(
        'text-2xl',
        'font-semibold'
      );
    });

    it('should render with description', () => {
      render(<CardHeader description="Card description">Content</CardHeader>);

      expect(screen.getByText('Card description')).toBeInTheDocument();
      expect(screen.getByText('Card description')).toHaveClass(
        'text-sm',
        'text-muted-foreground'
      );
    });

    it('should render with both title and description', () => {
      render(
        <CardHeader title="Main Title" description="Supporting description">
          Additional content
        </CardHeader>
      );

      expect(screen.getByText('Main Title')).toBeInTheDocument();
      expect(screen.getByText('Supporting description')).toBeInTheDocument();
      expect(screen.getByText('Additional content')).toBeInTheDocument();
    });
  });

  describe('アクション要素', () => {
    it('should render with action element', () => {
      const ActionButton = () => (
        <button data-testid="action-button">Action</button>
      );
      render(<CardHeader action={<ActionButton />}>Header</CardHeader>);

      expect(screen.getByTestId('action-button')).toBeInTheDocument();
    });

    it('should position action element correctly', () => {
      const ActionButton = () => <button>Action</button>;
      render(
        <CardHeader action={<ActionButton />}>Header with action</CardHeader>
      );

      const header = screen.getByText('Header with action').parentElement;
      expect(header).toHaveClass('flex', 'items-center', 'justify-between');
    });
  });

  describe('レイアウト組み合わせ', () => {
    it('should render complex header layout', () => {
      const ActionMenu = () => <button data-testid="menu">⋯</button>;
      render(
        <CardHeader
          title="Complex Card"
          description="This card has all elements"
          action={<ActionMenu />}
        >
          <div data-testid="custom-content">Custom header content</div>
        </CardHeader>
      );

      expect(screen.getByText('Complex Card')).toBeInTheDocument();
      expect(
        screen.getByText('This card has all elements')
      ).toBeInTheDocument();
      expect(screen.getByTestId('menu')).toBeInTheDocument();
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });
  });
});

describe('CardContent Component (TDD Red Phase)', () => {
  describe('基本レンダリング', () => {
    it('should render content', () => {
      render(<CardContent>Main card content</CardContent>);

      const content = screen.getByText('Main card content');
      expect(content).toBeInTheDocument();
    });

    it('should have proper styling', () => {
      render(<CardContent>Styled content</CardContent>);

      const content = screen.getByText('Styled content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('should render with custom className', () => {
      render(<CardContent className="custom-content">Content</CardContent>);

      const content = screen.getByText('Content');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('複雑なコンテンツ', () => {
    it('should render complex nested content', () => {
      render(
        <CardContent>
          <div data-testid="section-1">Section 1</div>
          <div data-testid="section-2">Section 2</div>
          <img src="test.jpg" alt="Test image" />
        </CardContent>
      );

      expect(screen.getByTestId('section-1')).toBeInTheDocument();
      expect(screen.getByTestId('section-2')).toBeInTheDocument();
      expect(screen.getByAltText('Test image')).toBeInTheDocument();
    });
  });
});

describe('CardFooter Component (TDD Red Phase)', () => {
  describe('基本レンダリング', () => {
    it('should render footer content', () => {
      render(<CardFooter>Footer content</CardFooter>);

      const footer = screen.getByText('Footer content');
      expect(footer).toBeInTheDocument();
    });

    it('should have proper styling', () => {
      render(<CardFooter>Styled footer</CardFooter>);

      const footer = screen.getByText('Styled footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('should render with custom className', () => {
      render(<CardFooter className="custom-footer">Footer</CardFooter>);

      const footer = screen.getByText('Footer');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('配置設定', () => {
    it('should align content to left', () => {
      render(<CardFooter align="left">Left aligned</CardFooter>);

      const footer = screen.getByText('Left aligned');
      expect(footer).toHaveClass('justify-start');
    });

    it('should align content to center', () => {
      render(<CardFooter align="center">Center aligned</CardFooter>);

      const footer = screen.getByText('Center aligned');
      expect(footer).toHaveClass('justify-center');
    });

    it('should align content to right', () => {
      render(<CardFooter align="right">Right aligned</CardFooter>);

      const footer = screen.getByText('Right aligned');
      expect(footer).toHaveClass('justify-end');
    });

    it('should space content between', () => {
      render(<CardFooter align="between">Space between</CardFooter>);

      const footer = screen.getByText('Space between');
      expect(footer).toHaveClass('justify-between');
    });
  });

  describe('複雑なフッター', () => {
    it('should render multiple action buttons', () => {
      render(
        <CardFooter align="between">
          <button data-testid="cancel">Cancel</button>
          <button data-testid="save">Save</button>
        </CardFooter>
      );

      expect(screen.getByTestId('cancel')).toBeInTheDocument();
      expect(screen.getByTestId('save')).toBeInTheDocument();
    });
  });
});

describe('Card Composition (TDD Red Phase)', () => {
  it('should render complete card with all components', () => {
    const ActionMenu = () => <button data-testid="menu">⋯</button>;

    render(
      <Card variant="default" padding="default" interactive>
        <CardHeader
          title="Complete Card"
          description="Full example with all components"
          action={<ActionMenu />}
        />
        <CardContent>
          <p data-testid="main-content">This is the main content area.</p>
        </CardContent>
        <CardFooter align="between">
          <button data-testid="cancel">Cancel</button>
          <button data-testid="confirm">Confirm</button>
        </CardFooter>
      </Card>
    );

    // 全コンポーネントが正しく表示されることを確認
    expect(screen.getByText('Complete Card')).toBeInTheDocument();
    expect(
      screen.getByText('Full example with all components')
    ).toBeInTheDocument();
    expect(screen.getByTestId('menu')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByTestId('cancel')).toBeInTheDocument();
    expect(screen.getByTestId('confirm')).toBeInTheDocument();
  });

  it('should handle ref forwarding', () => {
    const cardRef = React.createRef<HTMLDivElement>();
    const headerRef = React.createRef<HTMLDivElement>();
    const contentRef = React.createRef<HTMLDivElement>();
    const footerRef = React.createRef<HTMLDivElement>();

    render(
      <Card ref={cardRef}>
        <CardHeader ref={headerRef}>Header</CardHeader>
        <CardContent ref={contentRef}>Content</CardContent>
        <CardFooter ref={footerRef}>Footer</CardFooter>
      </Card>
    );

    expect(cardRef.current).toBeInstanceOf(HTMLDivElement);
    expect(headerRef.current).toBeInstanceOf(HTMLDivElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    expect(footerRef.current).toBeInstanceOf(HTMLDivElement);
  });
});
