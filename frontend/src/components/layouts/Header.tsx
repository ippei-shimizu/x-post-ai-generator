/**
 * Ultra Modern Header - 革新的ヘッダーコンポーネント
 * ナビゲーション・ユーザーメニュー・レスポンシブ対応
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Bot, Menu, X, User, Settings, LogOut, Sparkles } from 'lucide-react';
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
        className={`glass-ultra relative border-b border-white/10 ${className}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-neon shadow-neon flex h-12 w-12 animate-pulse-electric items-center justify-center rounded-2xl border border-white/20">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-gradient-electric text-2xl font-bold">
                X-Post AI Generator
              </h1>
            </div>
            <div
              data-testid="auth-loading"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <div className="bg-gradient-primary h-2 w-2 animate-pulse-electric rounded-full"></div>
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

  // モバイルメニューの処理
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    onMobileMenuToggle?.();
  };

  return (
    <header
      data-testid="app-header"
      className={`glass-ultra backdrop-blur-20 relative z-50 border-b border-white/10 ${className}`}
    >
      {/* Background glow effect */}
      <div className="bg-gradient-primary absolute inset-0 opacity-5"></div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Ultra ロゴ・アプリ名 */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center gap-4">
              <div className="bg-gradient-neon shadow-neon flex h-12 w-12 animate-pulse-electric items-center justify-center rounded-2xl border border-white/20 transition-transform duration-300 group-hover:scale-110">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-gradient-electric text-2xl font-bold group-hover:animate-shimmer">
                X-Post AI Generator
              </h1>
            </Link>
          </div>

          {/* Ultra デスクトップナビゲーション */}
          {isAuthenticated && (
            <nav
              data-testid="main-navigation"
              role="navigation"
              aria-label="メインナビゲーション"
              className="hidden space-x-2 md:flex"
            >
              {navigationItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative rounded-2xl px-6 py-3 text-sm font-medium transition-all duration-300 ${
                    item.isActive
                      ? 'glass-neon text-gradient-primary shadow-electric border border-white/20'
                      : 'text-foreground/80 hover:text-gradient-electric hover-glow'
                  }`}
                >
                  {item.isActive && (
                    <div className="bg-gradient-primary absolute inset-0 rounded-2xl opacity-10"></div>
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              ))}
            </nav>
          )}

          {/* Ultra 右側メニュー */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Ultra ユーザーアバター */}
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
                    className="glass-ultra hover-glow group flex items-center gap-3 rounded-2xl border border-white/20 px-4 py-3 transition-all duration-300"
                  >
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || 'ユーザー'}
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-white/20"
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
                      <div className="bg-gradient-primary shadow-electric flex h-8 w-8 items-center justify-center rounded-full border border-white/20">
                        <span className="text-sm font-bold text-white">
                          {user?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <span className="group-hover:text-gradient-electric hidden text-sm font-semibold text-foreground transition-all duration-300 sm:block">
                      {user?.name || 'ユーザー'}
                    </span>
                    <div className="bg-gradient-primary h-2 w-2 animate-pulse-electric rounded-full"></div>
                  </button>

                  {/* Ultra ユーザーメニュー */}
                  {isUserMenuOpen && (
                    <div
                      data-testid="user-menu"
                      className="glass-ultra shadow-neon absolute right-0 z-50 mt-4 w-72 animate-fade-in rounded-3xl border border-white/20 py-2"
                    >
                      <div className="border-b border-white/20 px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user?.image ? (
                            <Image
                              src={user.image}
                              alt={user.name || 'ユーザー'}
                              width={40}
                              height={40}
                              className="rounded-full border-2 border-white/20"
                            />
                          ) : (
                            <div className="bg-gradient-primary shadow-electric flex h-10 w-10 items-center justify-center rounded-full border border-white/20">
                              <span className="text-lg font-bold text-white">
                                {user?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-gradient-primary text-base font-semibold">
                              {user?.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user?.email}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <Link
                          href="/profile"
                          className="hover:glass-neon hover:text-gradient-electric group flex items-center gap-3 px-6 py-3 text-sm font-medium text-foreground transition-all duration-300"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="group-hover:text-gradient-primary h-4 w-4 transition-all" />
                          プロフィール
                        </Link>

                        <Link
                          href="/settings"
                          className="hover:glass-neon hover:text-gradient-electric group flex items-center gap-3 px-6 py-3 text-sm font-medium text-foreground transition-all duration-300"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="group-hover:text-gradient-primary h-4 w-4 transition-all" />
                          設定
                        </Link>

                        <div className="mx-4 my-2 border-t border-white/20"></div>

                        <button
                          data-testid="logout-button"
                          onClick={handleLogout}
                          className="hover:glass-neon hover:bg-destructive/10 group flex w-full items-center gap-3 px-6 py-3 text-left text-sm font-medium text-destructive transition-all duration-300"
                        >
                          <LogOut className="h-4 w-4" />
                          ログアウト
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ultra モバイルメニューボタン */}
                <button
                  data-testid="mobile-menu-toggle"
                  onClick={handleMobileMenuToggle}
                  className="glass-ultra hover-glow rounded-2xl border border-white/20 p-3 text-foreground md:hidden"
                  aria-label="モバイルメニューを開く"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </>
            ) : (
              /* Ultra ログインボタン */
              <Link href="/auth/signin">
                <button
                  data-testid="login-button"
                  className="bg-gradient-neon shadow-neon hover-levitate group flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-all duration-300"
                >
                  <Sparkles className="h-4 w-4 transition-all group-hover:animate-pulse-electric" />
                  <span className="text-glow">ログイン</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Ultra モバイルナビゲーション */}
      {isAuthenticated && isMobileMenuOpen && (
        <div
          data-testid="mobile-navigation"
          className="glass-ultra animate-fade-in border-t border-white/20 md:hidden"
        >
          <nav className="space-y-2 px-6 pb-6 pt-4">
            {navigationItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group block rounded-2xl px-4 py-4 text-base font-medium transition-all duration-300 ${
                  item.isActive
                    ? 'glass-neon text-gradient-primary shadow-electric border border-white/20'
                    : 'text-foreground/80 hover:glass-neon hover:text-gradient-electric'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary h-2 w-2 animate-pulse-electric rounded-full"></div>
                  <span className="group-hover:text-glow transition-all duration-300">
                    {item.label}
                  </span>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Ultra オーバーレイ（メニューが開いている時） */}
      {(isUserMenuOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-black/50 backdrop-blur-sm"
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
