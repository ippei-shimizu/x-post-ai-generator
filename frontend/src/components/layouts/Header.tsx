/**
 * Header - アプリケーションヘッダーコンポーネント
 * ナビゲーション・ユーザーメニュー・レスポンシブ対応
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import type { HeaderProps, NavigationItem } from '../../types/layout';
import { DEFAULT_NAVIGATION_ITEMS } from '../../types/layout';

// Header コンポーネント
export function Header({
  className = '',
  showMobileMenu = false,
  onMobileMenuToggle,
}: HeaderProps): React.JSX.Element {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(showMobileMenu);

  // NextAuth.jsから直接取得した認証状態
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const isLoading = status === 'loading';
  const user = session?.user;

  // ナビゲーションアイテムの準備
  const navigationItems: NavigationItem[] = DEFAULT_NAVIGATION_ITEMS.map(
    item => ({
      ...item,
      isActive: pathname === item.href,
    })
  );

  // 認証状態がロード中の場合
  if (isLoading) {
    return (
      <header
        data-testid="app-header"
        className={`border-b border-gray-200 bg-white ${className}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                X-Post AI Generator
              </h1>
            </div>
            <div data-testid="auth-loading" className="text-sm text-gray-500">
              認証状況を確認中...
            </div>
          </div>
        </div>
      </header>
    );
  }

  // ユーザーメニューの処理
  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    signOut({ callbackUrl: '/' });
  };

  const handleLogin = () => {
    // カスタムサインインページに遷移
    window.location.href = '/auth/signin';
  };

  // モバイルメニューの処理
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    onMobileMenuToggle?.();
  };

  return (
    <header
      data-testid="app-header"
      className={`border-b border-gray-200 bg-white ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* ロゴ・アプリ名 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-gray-900">
                X-Post AI Generator
              </h1>
            </Link>
          </div>

          {/* デスクトップナビゲーション */}
          {isAuthenticated && (
            <nav
              data-testid="main-navigation"
              role="navigation"
              aria-label="メインナビゲーション"
              className="hidden space-x-8 md:flex"
            >
              {navigationItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    item.isActive
                      ? 'active bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* 右側メニュー */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* ユーザーアイコン（ログインボタンの代替） */}
                <div className="relative">
                  <button
                    data-testid="user-avatar"
                    aria-label="ユーザーメニューを開く"
                    onClick={handleUserMenuToggle}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleUserMenuToggle();
                      }
                    }}
                    className="flex items-center space-x-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 transition-colors hover:bg-blue-100"
                  >
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || 'ユーザー'}
                        width={28}
                        height={28}
                        className="rounded-full"
                        onError={e => {
                          console.error(
                            'Failed to load user image:',
                            user.image
                          );
                          // フォールバック：画像読み込み失敗時は非表示にする
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600">
                        <span className="text-sm font-medium text-white">
                          {user?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <span className="hidden text-sm font-medium text-blue-700 sm:block">
                      {user?.name || 'ユーザー'}
                    </span>
                    <svg
                      className="h-4 w-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* ユーザーメニュー */}
                  {isUserMenuOpen && (
                    <div
                      data-testid="user-menu"
                      className="absolute right-0 z-50 mt-2 w-64 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                    >
                      <div className="border-b border-gray-100 px-4 py-2 text-sm text-gray-700">
                        <div className="font-medium">{user?.name}</div>
                        <div className="text-gray-500">{user?.email}</div>
                      </div>

                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        プロフィール
                      </Link>

                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        設定
                      </Link>

                      <hr className="my-1" />

                      <button
                        data-testid="logout-button"
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                      >
                        ログアウト
                      </button>
                    </div>
                  )}
                </div>

                {/* モバイルメニューボタン */}
                <button
                  data-testid="mobile-menu-toggle"
                  onClick={handleMobileMenuToggle}
                  className="rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 md:hidden"
                  aria-label="モバイルメニューを開く"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </>
            ) : (
              /* ログインボタン */
              <button
                data-testid="login-button"
                onClick={handleLogin}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                ログイン
              </button>
            )}
          </div>
        </div>
      </div>

      {/* モバイルナビゲーション */}
      {isAuthenticated && isMobileMenuOpen && (
        <div
          data-testid="mobile-navigation"
          className="border-t border-gray-200 bg-white md:hidden"
        >
          <nav className="space-y-1 px-4 pb-3 pt-2">
            {navigationItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${
                  item.isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* オーバーレイ（メニューが開いている時） */}
      {(isUserMenuOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </header>
  );
}

// デフォルトエクスポート
export default Header;
