/**
 * UI Component Type Definitions
 * 共通UIコンポーネントの型定義
 */

import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  HTMLAttributes,
} from 'react';
import type { VariantProps } from 'class-variance-authority';

// ========================================
// Button Component Types
// ========================================

/**
 * ボタンのバリアント（スタイル）定義
 */
export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

/**
 * ボタンのサイズ定義
 */
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

/**
 * ボタンコンポーネントのProps
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// ========================================
// Input Component Types
// ========================================

/**
 * インプットのタイプ定義（XSS対策考慮）
 */
export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local';

/**
 * インプットのサイズ定義
 */
export type InputSize = 'default' | 'sm' | 'lg';

/**
 * インプットコンポーネントのProps
 */
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  type?: InputType;
  size?: InputSize;
  error?: boolean;
  helperText?: string | undefined;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  sanitize?: boolean; // XSS対策用サニタイズフラグ
  debounce?: number; // デバウンス時間（ミリ秒）
  label?: string; // アクセシビリティ向上のためのラベル
  description?: string; // フィールドの説明
}

// ========================================
// Card Component Types
// ========================================

/**
 * カードのバリアント定義
 */
export type CardVariant = 'default' | 'outline' | 'ghost';

/**
 * カードコンポーネントのProps
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'default' | 'lg';
  interactive?: boolean;
  semanticRole?:
    | 'article'
    | 'region'
    | 'section'
    | 'listitem'
    | 'button'
    | 'none'; // セマンティックrole推奨
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6; // CardHeader用見出しレベル
}

/**
 * カードヘッダーのProps
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6; // 見出しレベル（アクセシビリティ向上）
}

/**
 * カードコンテンツのProps
 */
export type CardContentProps = HTMLAttributes<HTMLDivElement>;

/**
 * カードフッターのProps
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between';
}

// ========================================
// Form Component Types
// ========================================

/**
 * フォームフィールドの状態
 */
export interface FormFieldState {
  value: unknown;
  error?: string | undefined;
  touched?: boolean;
  dirty?: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

/**
 * フォームのバリデーションルール
 */
export interface ValidationRule {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  validate?: (value: unknown, formData?: Record<string, unknown>) => string | boolean | Promise<string | boolean>;
}

/**
 * フォームフィールドのProps
 */
export interface FormFieldProps {
  name: string;
  label?: string;
  description?: string;
  rules?: ValidationRule;
  defaultValue?: unknown;
  children: (field: FormFieldState) => ReactNode;
}

/**
 * フォームのProps
 */
export interface FormProps extends Omit<HTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children'> {
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  defaultValues?: Record<string, unknown>;
  mode?: 'onSubmit' | 'onBlur' | 'onChange' | 'all';
  showErrorSummary?: boolean; // エラーサマリーの表示制御
  errorSummaryTitle?: string; // エラーサマリーのタイトル
  children?: ReactNode | ((context: { isSubmitting: boolean; values: Record<string, unknown>; errors: Record<string, string> }) => ReactNode);
}

// ========================================
// Common UI Types
// ========================================

/**
 * アクセシビリティ関連のProps
 */
export interface AriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  'aria-disabled'?: boolean;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  role?: string;
}

/**
 * アニメーション関連のProps
 */
export interface AnimationProps {
  animate?: boolean;
  animationDuration?: number;
  animationDelay?: number;
  animationType?: 'fade' | 'slide' | 'scale' | 'none';
}

/**
 * レスポンシブ関連のユーティリティ型
 */
export type Responsive<T> = T | { sm?: T; md?: T; lg?: T; xl?: T; '2xl'?: T };

/**
 * カラーパレット定義
 */
export type ColorScheme =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

/**
 * 共通のUIコンポーネントProps
 */
export interface BaseUIProps extends AriaProps {
  className?: string;
  id?: string;
  testId?: string;
}

// ========================================
// Utility Types
// ========================================

/**
 * shadcn/uiのcvaバリアント型のヘルパー
 */
export type UIVariantProps<T extends (...args: unknown[]) => unknown> =
  VariantProps<T>;

/**
 * コンポーネントのrefを含むProps型
 */
export type PropsWithRef<T, E = HTMLElement> = T & {
  ref?: React.Ref<E>;
};

/**
 * 必須プロパティを作成するユーティリティ型
 */
export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * オプショナルプロパティを作成するユーティリティ型
 */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
