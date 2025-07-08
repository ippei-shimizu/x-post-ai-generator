'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * スクリーンリーダー専用テキスト
 * 視覚的には隠れているが、スクリーンリーダーで読み上げられる
 */
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export const ScreenReaderOnly = React.forwardRef<
  HTMLSpanElement,
  ScreenReaderOnlyProps
>(({ children, className }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'sr-only absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0',
        className
      )}
    >
      {children}
    </span>
  );
});
ScreenReaderOnly.displayName = 'ScreenReaderOnly';

/**
 * フォーカスが当たった時のみ表示されるスキップリンク
 */
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ href, children, className }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          'absolute left-4 top-4 z-50 -translate-y-full transform rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-transform focus:translate-y-0',
          className
        )}
      >
        {children}
      </a>
    );
  }
);
SkipLink.displayName = 'SkipLink';

/**
 * ライブリージョン - 動的なコンテンツ変更をスクリーンリーダーに通知
 */
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}

export const LiveRegion = React.forwardRef<HTMLDivElement, LiveRegionProps>(
  ({ children, politeness = 'polite', atomic = false, className }, ref) => {
    return (
      <div
        ref={ref}
        aria-live={politeness}
        aria-atomic={atomic}
        className={cn('sr-only', className)}
      >
        {children}
      </div>
    );
  }
);
LiveRegion.displayName = 'LiveRegion';

/**
 * フォーカス管理フック
 * キーボードナビゲーションとフォーカストラップを提供
 */
interface UseFocusManagementOptions {
  /**
   * フォーカストラップを有効にするか
   */
  trapFocus?: boolean;
  /**
   * Escapeキーでフォーカスを復元するか
   */
  restoreOnEscape?: boolean;
  /**
   * 初期フォーカス要素のセレクタ
   */
  initialFocus?: string;
}

export const useFocusManagement = (
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean = true,
  options: UseFocusManagementOptions = {}
) => {
  const {
    trapFocus = true,
    restoreOnEscape = true,
    initialFocus = '[role="dialog"] [autofocus], [role="dialog"] input, [role="dialog"] button',
  } = options;

  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  // フォーカス可能な要素を取得
  const getFocusableElements = React.useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="checkbox"]:not([disabled])',
      '[role="radio"]:not([disabled])',
    ].join(', ');

    const elements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(selector)
    );

    return elements.filter(
      element =>
        element.offsetParent !== null && // 要素が表示されている
        !element.hasAttribute('aria-hidden') &&
        element.getAttribute('aria-disabled') !== 'true'
    );
  }, [containerRef]);

  // 初期フォーカスの設定
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // 前のアクティブ要素を保存
    previousActiveElement.current = document.activeElement as HTMLElement;

    // 初期フォーカスを設定
    const initialElement =
      containerRef.current.querySelector<HTMLElement>(initialFocus);
    const focusableElements = getFocusableElements();

    const elementToFocus = initialElement || focusableElements[0];
    if (elementToFocus) {
      // 次のマイクロタスクでフォーカスを設定（レンダリング完了後）
      requestAnimationFrame(() => {
        elementToFocus.focus();
      });
    }
  }, [isActive, initialFocus, getFocusableElements, containerRef]);

  // フォーカストラップの実装
  React.useEffect(() => {
    if (!isActive || !trapFocus || !containerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab での逆方向移動
        if (
          currentElement === firstElement ||
          !focusableElements.includes(currentElement)
        ) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab での前方向移動
        if (
          currentElement === lastElement ||
          !focusableElements.includes(currentElement)
        ) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && restoreOnEscape) {
        previousActiveElement.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    if (restoreOnEscape) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (restoreOnEscape) {
        document.removeEventListener('keydown', handleEscape);
      }
    };
  }, [
    isActive,
    trapFocus,
    restoreOnEscape,
    getFocusableElements,
    containerRef,
  ]);

  // クリーンアップ時にフォーカスを復元
  React.useEffect(() => {
    return () => {
      if (
        previousActiveElement.current &&
        document.contains(previousActiveElement.current)
      ) {
        previousActiveElement.current.focus();
      }
    };
  }, []);

  return {
    focusableElements: getFocusableElements(),
    restoreFocus: () => previousActiveElement.current?.focus(),
  };
};

/**
 * アナウンスメント用フック
 * スクリーンリーダーに動的にメッセージを通知
 */
export const useAnnouncement = () => {
  const [announcement, setAnnouncement] = React.useState('');
  const [politeness, setPoliteness] = React.useState<'polite' | 'assertive'>(
    'polite'
  );

  const announce = React.useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      setPoliteness(priority);
      setAnnouncement(message);

      // 少し遅延してクリア（スクリーンリーダーが読み上げる時間を確保）
      setTimeout(() => {
        setAnnouncement('');
      }, 1000);
    },
    []
  );

  const AnnouncementComponent = React.useMemo(
    () => <LiveRegion politeness={politeness}>{announcement}</LiveRegion>,
    [announcement, politeness]
  );

  return {
    announce,
    AnnouncementComponent,
  };
};

/**
 * キーボードナビゲーション用フック
 * 矢印キーでの要素間移動を提供
 */
interface UseKeyboardNavigationOptions {
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  disabled?: boolean;
}

export const useKeyboardNavigation = (
  containerRef: React.RefObject<HTMLElement>,
  options: UseKeyboardNavigationOptions = {}
) => {
  const { orientation = 'both', loop = true, disabled = false } = options;

  React.useEffect(() => {
    if (disabled || !containerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;
      const isArrowKey = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ].includes(key);

      if (!isArrowKey) return;

      // 方向制限のチェック
      if (
        orientation === 'horizontal' &&
        ['ArrowUp', 'ArrowDown'].includes(key)
      )
        return;
      if (
        orientation === 'vertical' &&
        ['ArrowLeft', 'ArrowRight'].includes(key)
      )
        return;

      event.preventDefault();

      const focusableElements = Array.from(
        containerRef.current!.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [role="button"]:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => el.offsetParent !== null);

      if (focusableElements.length === 0) return;

      const currentIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement
      );
      let nextIndex = currentIndex;

      switch (key) {
        case 'ArrowDown':
        case 'ArrowRight':
          nextIndex = currentIndex + 1;
          if (nextIndex >= focusableElements.length) {
            nextIndex = loop ? 0 : focusableElements.length - 1;
          }
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) {
            nextIndex = loop ? focusableElements.length - 1 : 0;
          }
          break;
      }

      focusableElements[nextIndex]?.focus();
    };

    const container = containerRef.current;
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, orientation, loop, disabled]);
};

/**
 * アクセシビリティヘルパーコンポーネント
 * よく使用される属性の組み合わせを提供
 */
interface AccessibilityPropsOptions {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  selected?: boolean;
  pressed?: boolean;
  controls?: string;
  describedBy?: string[];
}

export const useAccessibilityProps = (
  options: AccessibilityPropsOptions = {}
) => {
  const id = React.useId();
  const {
    label,
    description,
    error,
    required,
    disabled,
    expanded,
    selected,
    pressed,
    controls,
    describedBy = [],
  } = options;

  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const ariaDescribedBy =
    [...describedBy, descriptionId, errorId].filter(Boolean).join(' ') ||
    undefined;

  return {
    // 要素のプロパティ
    elementProps: {
      id,
      'aria-labelledby': label ? labelId : undefined,
      'aria-describedby': ariaDescribedBy,
      'aria-required': required,
      'aria-disabled': disabled,
      'aria-expanded': expanded,
      'aria-selected': selected,
      'aria-pressed': pressed,
      'aria-controls': controls,
      'aria-invalid': !!error,
    },
    // ラベル要素のプロパティ
    labelProps: label
      ? {
          id: labelId,
          htmlFor: id,
        }
      : undefined,
    // 説明要素のプロパティ
    descriptionProps: description
      ? {
          id: descriptionId,
        }
      : undefined,
    // エラー要素のプロパティ
    errorProps: error
      ? {
          id: errorId,
          role: 'alert',
          'aria-live': 'assertive' as const,
        }
      : undefined,
  };
};

/**
 * カラーコントラスト検証フック（開発時のみ）
 */
export const useColorContrastValidator = (
  elementRef: React.RefObject<HTMLElement>,
  enabled: boolean = process.env.NODE_ENV === 'development'
) => {
  React.useEffect(() => {
    if (!enabled || !elementRef.current) return;

    // 実際のプロダクトではより高度なコントラスト検証ツールを使用
    const element = elementRef.current;
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;

    // 簡易的な警告（実際の実装ではより詳細な検証が必要）
    if (backgroundColor === 'rgba(0, 0, 0, 0)' && color === 'rgb(0, 0, 0)') {
      console.warn('Potential contrast issue detected:', element);
    }
  }, [elementRef, enabled]);
};
