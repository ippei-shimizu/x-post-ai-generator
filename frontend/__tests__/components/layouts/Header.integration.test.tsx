/**
 * Header 統合テスト - shadcn/ui統合後
 * 基本機能の統合テスト
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import '@testing-library/jest-dom';

import { Header } from '../../../src/components/layouts/Header';
import { AuthProvider } from '../../../src/providers/AuthProvider';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/dashboard',
}));

// Mock NextAuth
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
  useSession: () => mockUseSession(),
  signOut: jest.fn(),
}));

const TEST_SESSION = {
  user: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: '2025-12-31T23:59:59.000Z',
};

describe('Header Integration Test', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: TEST_SESSION,
      status: 'authenticated',
    });
  });

  it('renders header with navigation and user avatar', () => {
    render(
      <SessionProvider session={TEST_SESSION}>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </SessionProvider>
    );

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByText('X-Post AI Generator')).toBeInTheDocument();
    expect(screen.getByTestId('main-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('shows login button when not authenticated', () => {
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

  it('shows mobile menu toggle', () => {
    render(
      <SessionProvider session={TEST_SESSION}>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </SessionProvider>
    );

    expect(screen.getByTestId('mobile-menu-toggle')).toBeInTheDocument();
  });
});
