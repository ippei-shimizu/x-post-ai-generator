/**
 * Layout関連の型定義
 * Header・Navigation・User Menu の型定義
 */

import { type ReactNode } from 'react';

// Header コンポーネントの Props 型
export interface HeaderProps {
  className?: string;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
}

// Navigation メニューアイテムの型
export interface NavigationItem {
  label: string;
  href: string;
  icon?: ReactNode;
  isActive?: boolean;
  requireAuth?: boolean;
  description?: string;
}

// Navigation コンポーネントの Props 型
export interface NavigationProps {
  items: NavigationItem[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'mobile';
  currentPath?: string;
}

// User Avatar コンポーネントの Props 型
export interface UserAvatarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
  onMenuToggle?: () => void;
}

// User Menu アイテムの型
export interface UserMenuItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  action?: () => void;
  variant?: 'default' | 'danger';
  separator?: boolean;
}

// User Menu コンポーネントの Props 型
export interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  menuItems: UserMenuItem[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// Mobile Menu の Props 型
export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  userMenuItems: UserMenuItem[];
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  className?: string;
}

// Layout 状態の型
export interface LayoutState {
  isMobileMenuOpen: boolean;
  isUserMenuOpen: boolean;
  currentPath: string;
  isAuthenticated: boolean;
}

// Layout コンテキストの型
export interface LayoutContextValue {
  state: LayoutState;
  actions: {
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;
    toggleUserMenu: () => void;
    closeUserMenu: () => void;
    setCurrentPath: (path: string) => void;
  };
}

// Layout Provider の Props 型
export interface LayoutProviderProps {
  children: ReactNode;
  initialPath?: string;
}

// デフォルトナビゲーションアイテム
export const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'ダッシュボード',
    href: '/dashboard',
    requireAuth: true,
    description: 'メインダッシュボード',
  },
  {
    label: '投稿生成',
    href: '/generate',
    requireAuth: true,
    description: 'AI投稿生成',
  },
  {
    label: '投稿管理',
    href: '/posts',
    requireAuth: true,
    description: '生成済み投稿管理',
  },
  {
    label: '設定',
    href: '/settings',
    requireAuth: true,
    description: 'ユーザー設定',
  },
];

// デフォルトユーザーメニューアイテム
export const DEFAULT_USER_MENU_ITEMS: UserMenuItem[] = [
  {
    label: 'プロフィール',
    href: '/profile',
  },
  {
    label: '設定',
    href: '/settings',
  },
  {
    label: '',
    separator: true,
  },
  {
    label: 'ログアウト',
    variant: 'danger',
    action: () => {
      // ログアウト処理はコンポーネント側で実装
    },
  },
];

// レスポンシブブレークポイント
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

// Layout 関連の定数
export const LAYOUT_CONSTANTS = {
  HEADER_HEIGHT: '64px',
  MOBILE_MENU_WIDTH: '280px',
  USER_MENU_WIDTH: '220px',
  Z_INDEX: {
    HEADER: 50,
    MOBILE_MENU: 60,
    USER_MENU: 70,
    OVERLAY: 40,
  },
} as const;

// 型ガード関数
export function isValidNavigationItem(item: unknown): item is NavigationItem {
  if (!item || typeof item !== 'object') return false;

  const navItem = item as Record<string, unknown>;
  return (
    typeof navItem.label === 'string' &&
    typeof navItem.href === 'string' &&
    (navItem.requireAuth === undefined ||
      typeof navItem.requireAuth === 'boolean')
  );
}

export function isValidUserMenuItem(item: unknown): item is UserMenuItem {
  if (!item || typeof item !== 'object') return false;

  const menuItem = item as Record<string, unknown>;
  return (
    typeof menuItem.label === 'string' &&
    (menuItem.href === undefined || typeof menuItem.href === 'string') &&
    (menuItem.action === undefined || typeof menuItem.action === 'function')
  );
}

// Utility 型
export type LayoutVariant = 'default' | 'compact' | 'minimal';
export type ThemeMode = 'light' | 'dark' | 'system';
export type NavigationStyle = 'tabs' | 'pills' | 'underline';

// Layout 設定の型
export interface LayoutConfig {
  variant: LayoutVariant;
  theme: ThemeMode;
  navigationStyle: NavigationStyle;
  showBreadcrumbs: boolean;
  stickyHeader: boolean;
  collapseSidebar: boolean;
}
