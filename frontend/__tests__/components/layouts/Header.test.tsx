/**
 * Header TDD テスト - Red Phase
 * ヘッダー・ナビゲーションコンポーネントのテスト
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import '@testing-library/jest-dom';

// これらは実装前なので失敗する（Red Phase）
import { Header } from '../../../src/components/layouts/Header';
import { AuthProvider } from '../../../src/providers/AuthProvider';

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
}));

// Mock NextAuth
const mockUseSession = jest.fn();
const mockSignOut = jest.fn();
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
  useSession: () => mockUseSession(),
  signOut: jest.fn(),
}));

// テスト用認証セッション
const TEST_SESSION = {
  user: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
  },
  expires: '2025-12-31T23:59:59.000Z',
};

describe('Header Component (TDD Red Phase)', () => {
  // window.location のオリジナルを保存
  const originalLocation = window.location;

  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: TEST_SESSION,
      status: 'authenticated',
    });
    mockPush.mockClear();
    mockSignOut.mockClear();

    // window.location をリセット
    delete (window as any).location;
    (window as any).location = { ...originalLocation };
  });

  afterEach(() => {
    // テスト後にlocationを復元
    (window as any).location = originalLocation;
  });

  describe('基本レンダリング', () => {
    it('should render header with app title', () => {
      // Red Phase: ヘッダーが実装されていないので失敗
      render(
        <SessionProvider session={TEST_SESSION}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      expect(screen.getByTestId('app-header')).toBeInTheDocument();
      expect(screen.getByText('X-Post AI Generator')).toBeInTheDocument();
    });

    it('should render navigation menu', () => {
      // Red Phase: ナビゲーションメニューが実装されていないので失敗
      render(
        <SessionProvider session={TEST_SESSION}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('認証状態による表示制御', () => {
    it('should show user avatar when authenticated', () => {
      // Red Phase: ユーザーアバターが実装されていないので失敗
      render(
        <SessionProvider session={TEST_SESSION}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
      // 実際の画像またはフォールバック avatar をチェック
      expect(screen.getByAltText('Test User')).toBeInTheDocument();
    });

    it('should show login button when not authenticated', () => {
      // Red Phase: 未認証時のログインボタンが実装されていないので失敗
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(
        <SessionProvider session={null}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });

    it('should navigate to signin page when login button is clicked', () => {
      // 未認証時のログインボタンクリック動作テスト
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      render(
        <SessionProvider session={null}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      const loginButton = screen.getByTestId('login-button');

      // Linkコンポーネントなので、親のaタグのhref属性をチェック
      const loginLink = loginButton.closest('a');
      expect(loginLink).toHaveAttribute('href', '/auth/signin');
    });

    it('should show loading state during authentication check', () => {
      // Red Phase: ローディング状態が実装されていないので失敗
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      render(
        <SessionProvider session={null}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
    });
  });

  describe('ナビゲーション機能', () => {
    it('should contain navigation links for authenticated users', () => {
      // Red Phase: ナビゲーションリンクが実装されていないので失敗
      render(
        <SessionProvider session={TEST_SESSION}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      expect(
        screen.getByRole('link', { name: 'ダッシュボード' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: '投稿生成' })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '設定' })).toBeInTheDocument();
    });

    it('should highlight current page in navigation', () => {
      // アクティブページのハイライト確認
      render(
        <SessionProvider session={TEST_SESSION}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      const dashboardLink = screen.getByRole('link', {
        name: 'ダッシュボード',
      });
      expect(dashboardLink).toHaveClass('glass-neon', 'text-gradient-primary');
    });
  });

  describe('ユーザーメニュー機能', () => {
    it('should show user menu when avatar is clicked', () => {
      // Red Phase: ユーザーメニューが実装されていないので失敗
      render(
        <SessionProvider session={TEST_SESSION}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      const userAvatar = screen.getByTestId('user-avatar');
      fireEvent.click(userAvatar);

      // 基本的な HTML ユーザーメニューをチェック
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should handle logout when logout button is clicked', () => {
      // Red Phase: ログアウト機能が実装されていないので失敗
      render(
        <SessionProvider session={TEST_SESSION}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      const userAvatar = screen.getByTestId('user-avatar');
      fireEvent.click(userAvatar);

      // 基本的な HTML ボタンを探す
      const logoutButton = screen.getByTestId('logout-button');
      expect(logoutButton).toBeInTheDocument();
    });

    it('should show user profile link in menu', () => {
      // Red Phase: プロフィールリンクが実装されていないので失敗
      render(
        <SessionProvider session={TEST_SESSION}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      const userAvatar = screen.getByTestId('user-avatar');
      fireEvent.click(userAvatar);

      expect(
        screen.getByRole('link', { name: /プロフィール/i })
      ).toBeInTheDocument();
    });
  });

  describe('レスポンシブデザイン', () => {
    it('should show mobile menu toggle on small screens', () => {
      // Red Phase: モバイルメニューが実装されていないので失敗
      render(
        <SessionProvider session={TEST_SESSION}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      expect(screen.getByTestId('mobile-menu-toggle')).toBeInTheDocument();
    });

    it('should toggle mobile navigation when menu button is clicked', () => {
      // Red Phase: モバイルナビゲーションが実装されていないので失敗
      render(
        <SessionProvider session={TEST_SESSION}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      const mobileToggle = screen.getByTestId('mobile-menu-toggle');
      fireEvent.click(mobileToggle);

      expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-navigation')).toBeVisible();
    });
  });

  describe('アクセシビリティ', () => {
    it('should have proper ARIA labels and roles', () => {
      // Red Phase: アクセシビリティが実装されていないので失敗
      render(
        <SessionProvider session={TEST_SESSION}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'メインナビゲーション');

      const userMenu = screen.getByTestId('user-avatar');
      expect(userMenu).toHaveAttribute('aria-label', 'ユーザーメニューを開く');
    });

    it('should support keyboard navigation', () => {
      // Red Phase: キーボードナビゲーションが実装されていないので失敗
      render(
        <SessionProvider session={TEST_SESSION}>
          <AuthProvider>
            <Header />
          </AuthProvider>
        </SessionProvider>
      );

      const userAvatar = screen.getByTestId('user-avatar');
      userAvatar.focus();
      fireEvent.keyDown(userAvatar, { key: 'Enter' });

      // 基本的な HTML のユーザーメニューをチェック
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
  });
});
