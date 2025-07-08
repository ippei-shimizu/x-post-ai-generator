'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Card, CardContent, CardHeader } from './card';
import { Form, FormField } from './form';
import { Badge } from './badge';
import { Icons } from './icons';
import type {
  ContentSourceInsert,
  ContentSourceType,
} from '@/types/content-sources';

/**
 * フォーム送信用のデータ型（user_idは除外）
 */
interface FormSubmitData {
  name: string;
  source_type: ContentSourceType;
  url: string;
  config?: Record<string, unknown>;
  is_active: boolean;
}

/**
 * Content Sources フォームのプロパティ
 */
interface ContentSourcesFormProps {
  className?: string;
  initialData?: Partial<ContentSourceInsert>;
  onSubmit?: (data: FormSubmitData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

/**
 * ソースタイプの定義
 */
const SOURCE_TYPES = [
  { value: 'github', label: 'GitHub', icon: Icons.ExternalLink },
  { value: 'rss', label: 'RSS Feed', icon: Icons.ExternalLink },
  { value: 'news', label: 'News', icon: Icons.ExternalLink },
  { value: 'api', label: 'API', icon: Icons.ExternalLink },
  { value: 'webhook', label: 'Webhook', icon: Icons.ExternalLink },
  { value: 'manual', label: 'Manual', icon: Icons.Edit },
] as const;

/**
 * URL バリデーション関数
 */
const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * ソースタイプ別のバリデーション
 */
const getSourceTypeValidation = (sourceType: string) => {
  switch (sourceType) {
    case 'github':
      return {
        urlPattern: /^https:\/\/github\.com\/.+/,
        urlError:
          'GitHubのURLを入力してください (例: https://github.com/user/repo)',
        configFields: ['branch', 'path'],
      };
    case 'rss':
      return {
        urlPattern: /^https?:\/\/.+/,
        urlError: 'RSS フィードのURLを入力してください',
        configFields: ['refresh_interval'],
      };
    case 'news':
      return {
        urlPattern: /^https?:\/\/.+/,
        urlError: 'ニュースサイトのURLを入力してください',
        configFields: ['category', 'tags'],
      };
    default:
      return {
        urlPattern: /^https?:\/\/.+/,
        urlError: '有効なURLを入力してください',
        configFields: [],
      };
  }
};

/**
 * Content Sources フォームコンポーネント
 */
export const ContentSourcesForm = React.forwardRef<
  HTMLDivElement,
  ContentSourcesFormProps
>(
  (
    {
      className,
      initialData,
      onSubmit,
      onCancel,
      isLoading = false,
      mode = 'create',
      ...props
    },
    ref
  ) => {
    const [sourceType, setSourceType] = React.useState(
      initialData?.source_type || 'github'
    );
    const [config, setConfig] = React.useState(initialData?.config || {});

    // ソースタイプの変更時の処理
    const handleSourceTypeChange = (newSourceType: string) => {
      setSourceType(newSourceType as ContentSourceType);
      // 設定をリセット
      setConfig({});
    };

    // 設定値の更新
    const handleConfigChange = (key: string, value: string) => {
      setConfig(
        prev =>
          ({
            ...prev,
            [key]: value,
          }) as Record<string, unknown>
      );
    };

    // フォーム送信の処理
    const handleSubmit = async (values: Record<string, unknown>) => {
      if (!onSubmit) return;

      const formData: FormSubmitData = {
        name: String(values.name),
        source_type: sourceType,
        url: String(values.url),
        config: config as Record<string, unknown>,
        is_active: true,
      };

      await onSubmit(formData);
    };

    // 現在のソースタイプの設定
    const currentValidation = getSourceTypeValidation(sourceType);
    const selectedSourceType = SOURCE_TYPES.find(
      type => type.value === sourceType
    );

    return (
      <div ref={ref} className={cn('space-y-6', className)} {...props}>
        <Card>
          <CardHeader
            title={
              mode === 'create'
                ? '新しいコンテンツソース'
                : 'コンテンツソースの編集'
            }
            description={
              mode === 'create'
                ? 'AIが学習するコンテンツのソースを追加してください'
                : 'コンテンツソースの設定を変更してください'
            }
          />

          <CardContent>
            <Form
              onSubmit={handleSubmit}
              defaultValues={{
                name: initialData?.name || '',
                url: initialData?.url || '',
                description: '',
              }}
            >
              <div className="space-y-6">
                {/* ソースタイプ選択 */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    ソースタイプ
                    <span
                      className="ml-1 text-destructive"
                      aria-label="required"
                    >
                      *
                    </span>
                  </label>

                  <Select
                    value={sourceType}
                    onValueChange={handleSourceTypeChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-label="ソースタイプを選択"
                    >
                      <SelectValue placeholder="ソースタイプを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedSourceType && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <selectedSourceType.icon className="mr-1 h-3 w-3" />
                        {selectedSourceType.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        を選択中
                      </span>
                    </div>
                  )}
                </div>

                {/* 基本情報 */}
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                  <FormField
                    name="name"
                    label="ソース名"
                    description="このソースを識別するための名前"
                    rules={{
                      required: 'ソース名は必須です',
                      minLength: {
                        value: 2,
                        message: 'ソース名は2文字以上で入力してください',
                      },
                      maxLength: {
                        value: 100,
                        message: 'ソース名は100文字以内で入力してください',
                      },
                    }}
                  >
                    {({ value, onChange, onBlur, error }) => (
                      <Input
                        type="text"
                        placeholder={`例: ${selectedSourceType?.label}のリポジトリ`}
                        value={String(value)}
                        onChange={e => onChange(e.target.value)}
                        onBlur={onBlur}
                        error={!!error}
                        helperText={error}
                        leftElement={<Icons.Edit className="h-4 w-4" />}
                        maxLength={100}
                        required
                      />
                    )}
                  </FormField>

                  <FormField
                    name="url"
                    label="URL"
                    description={`${selectedSourceType?.label}のURL`}
                    rules={{
                      required: 'URLは必須です',
                      validate: value => {
                        const url = String(value);
                        if (!validateUrl(url)) {
                          return '有効なURLを入力してください';
                        }
                        if (!currentValidation.urlPattern.test(url)) {
                          return currentValidation.urlError;
                        }
                        return true;
                      },
                    }}
                  >
                    {({ value, onChange, onBlur, error }) => (
                      <Input
                        type="url"
                        placeholder={currentValidation.urlError.replace(
                          'を入力してください',
                          ''
                        )}
                        value={String(value)}
                        onChange={e => onChange(e.target.value)}
                        onBlur={onBlur}
                        error={!!error}
                        helperText={error}
                        leftElement={<Icons.ExternalLink className="h-4 w-4" />}
                        required
                      />
                    )}
                  </FormField>
                </div>

                {/* 説明 */}
                <FormField
                  name="description"
                  label="説明"
                  description="このソースについての説明（オプション）"
                  rules={{
                    maxLength: {
                      value: 500,
                      message: '説明は500文字以内で入力してください',
                    },
                  }}
                >
                  {({ value, onChange, onBlur, error }) => (
                    <Textarea
                      placeholder="このソースから収集するコンテンツについて説明してください..."
                      value={String(value)}
                      onChange={e => onChange(e.target.value)}
                      onBlur={onBlur}
                      className={cn(error && 'border-destructive')}
                      rows={3}
                      maxLength={500}
                    />
                  )}
                </FormField>

                {/* ソースタイプ別の設定 */}
                {currentValidation.configFields.length > 0 && (
                  <Card className="bg-muted/50">
                    <CardHeader
                      className="pb-3"
                      title={`${selectedSourceType?.label} 詳細設定`}
                      description={`${selectedSourceType?.label}固有の設定項目`}
                      headingLevel={4}
                    />
                    <CardContent className="space-y-4">
                      {currentValidation.configFields.map(field => (
                        <div key={field} className="space-y-2">
                          <label className="text-sm font-medium capitalize">
                            {field.replace('_', ' ')}
                          </label>
                          <Input
                            type="text"
                            placeholder={`${field}を入力`}
                            value={
                              ((config as Record<string, unknown>)[
                                field
                              ] as string) || ''
                            }
                            onChange={e =>
                              handleConfigChange(field, e.target.value)
                            }
                            size="sm"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* アクション */}
                <div className="flex flex-col-reverse items-start justify-between gap-4 border-t pt-4 sm:flex-row sm:items-center">
                  <div className="text-xs text-muted-foreground">
                    * 必須項目
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    {onCancel && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                      >
                        キャンセル
                      </Button>
                    )}

                    <Button
                      type="submit"
                      loading={isLoading}
                      loadingText={
                        mode === 'create' ? '作成中...' : '更新中...'
                      }
                      className="w-full sm:w-auto"
                    >
                      {mode === 'create' ? 'ソースを追加' : '変更を保存'}
                    </Button>
                  </div>
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }
);

ContentSourcesForm.displayName = 'ContentSourcesForm';

export type { ContentSourcesFormProps, FormSubmitData };
