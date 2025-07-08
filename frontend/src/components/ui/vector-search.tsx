'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Card, CardContent, CardHeader } from './card';
import { ScrollArea } from './scroll-area';
import { Progress } from './progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { Icons } from './icons';
import type { VectorSearchResult, VectorSearchQuery } from '@/types/vector';

/**
 * ベクトル検索フィルタ設定
 */
interface VectorSearchFilters {
  sourceTypes: string[];
  similarityThreshold: number;
  maxResults: number;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * ベクトル検索コンポーネントのプロパティ
 */
interface VectorSearchProps {
  className?: string;
  onSearch?: (query: VectorSearchQuery) => Promise<VectorSearchResult[]>;
  isLoading?: boolean;
  results?: VectorSearchResult[];
  placeholder?: string;
  filters?: VectorSearchFilters;
  onFiltersChange?: (filters: VectorSearchFilters) => void;
  showFilters?: boolean;
  maxHeight?: string;
  emptyStateMessage?: string;
  errorMessage?: string;
}

/**
 * 検索結果アイテムコンポーネント
 */
interface SearchResultItemProps {
  result: VectorSearchResult;
  onSelect?: (result: VectorSearchResult) => void;
  className?: string;
}

const SearchResultItem = React.forwardRef<
  HTMLDivElement,
  SearchResultItemProps
>(({ result, onSelect, className }, ref) => {
  const handleClick = () => {
    onSelect?.(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(result);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        'group cursor-pointer rounded-lg border border-border p-4 transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`検索結果: ${result.content_text.substring(0, 100)}...`}
    >
      <div className="space-y-3">
        {/* コンテンツテキスト */}
        <p className="line-clamp-3 text-sm leading-relaxed text-foreground">
          {result.content_text}
        </p>

        {/* メタデータとスコア */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {result.source_type}
            </Badge>

            {result.source_url && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Icons.ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs truncate">{result.source_url}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* 類似度スコア */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">類似度:</span>
            <div className="flex items-center gap-1">
              <Progress
                value={result.similarity * 100}
                className="h-1 w-16 sm:w-12"
                aria-label={`類似度 ${Math.round(result.similarity * 100)}%`}
              />
              <span className="min-w-[3ch] font-mono text-xs text-muted-foreground">
                {Math.round(result.similarity * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* 作成日時 */}
        <div className="text-xs text-muted-foreground">
          作成日: {new Date(result.created_at).toLocaleDateString('ja-JP')}
        </div>
      </div>
    </div>
  );
});
SearchResultItem.displayName = 'SearchResultItem';

/**
 * ベクトル検索コンポーネント
 */
export const VectorSearch = React.forwardRef<HTMLDivElement, VectorSearchProps>(
  (
    {
      className,
      onSearch,
      isLoading = false,
      results = [],
      placeholder = 'ベクトル検索でコンテンツを探す...',
      filters,
      onFiltersChange,
      showFilters = false,
      maxHeight = '500px',
      emptyStateMessage = '検索結果が見つかりませんでした',
      errorMessage,
      ...props
    },
    ref
  ) => {
    const [query, setQuery] = React.useState('');
    const searchId = React.useId();
    const resultsId = React.useId();

    // 検索実行
    const handleSearch = React.useCallback(async () => {
      if (!query.trim() || !onSearch) return;

      const searchQuery: VectorSearchQuery = {
        user_id: '', // 実際の実装では認証されたユーザーIDを使用
        query_vector: [], // 実際の実装ではクエリをベクトル化
        similarity_threshold: filters?.similarityThreshold || 0.7,
        match_count: filters?.maxResults || 10,
        source_type: filters?.sourceTypes?.[0] as any,
        active_only: true,
      };

      await onSearch(searchQuery);
    }, [query, onSearch, filters]);

    // エンターキーでの検索
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading) {
        handleSearch();
      }
    };

    // 検索結果の状態
    const hasResults = results.length > 0;
    const showEmptyState = !isLoading && !hasResults && query.trim() !== '';
    const showErrorState = !!errorMessage;

    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {/* 検索入力欄 */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              id={searchId}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              leftElement={<Icons.Search className="h-4 w-4" />}
              rightElement={
                isLoading ? (
                  <Icons.Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={handleSearch}
                    disabled={!query.trim() || isLoading}
                    aria-label="検索実行"
                  >
                    <Icons.Search className="h-4 w-4" />
                  </Button>
                )
              }
              className="pr-20"
              aria-describedby={`${searchId}-description`}
            />
          </div>

          <p
            id={`${searchId}-description`}
            className="text-xs text-muted-foreground"
          >
            {isLoading
              ? '検索中...'
              : hasResults
                ? `${results.length}件の結果が見つかりました`
                : 'キーワードを入力してベクトル検索を実行'}
          </p>
        </div>

        {/* フィルタ設定 (将来の拡張用) */}
        {showFilters && filters && onFiltersChange && (
          <Card>
            <CardHeader
              className="pb-3"
              title="検索フィルタ"
              headingLevel={4}
            />
            <CardContent className="space-y-3">
              {/* フィルタ設定UI - 将来実装 */}
              <div className="text-xs text-muted-foreground">
                フィルタ設定は今後実装予定です
              </div>
            </CardContent>
          </Card>
        )}

        {/* 検索結果 */}
        <div className="space-y-2">
          {/* エラー状態 */}
          {showErrorState && (
            <Card className="border-destructive">
              <CardContent className="flex items-center gap-3 p-4">
                <Icons.AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    検索エラー
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {errorMessage}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 空の状態 */}
          {showEmptyState && !showErrorState && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Icons.SearchX className="text-muted-foreground/50 mb-4 h-12 w-12" />
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  {emptyStateMessage}
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  別のキーワードで検索してみてください
                </p>
              </CardContent>
            </Card>
          )}

          {/* 検索結果リスト */}
          {hasResults && !showErrorState && (
            <div>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-medium">検索結果</h3>
                <span className="text-xs text-muted-foreground">
                  {results.length}件
                </span>
              </div>

              <ScrollArea
                className="space-y-3 pr-4"
                style={{ maxHeight }}
                aria-labelledby={resultsId}
              >
                <div id={resultsId} className="sr-only">
                  ベクトル検索結果一覧
                </div>

                <div className="space-y-3">
                  {results.map(result => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      onSelect={selectedResult => {
                        // 選択時のアクション (将来実装)
                        console.log('Selected result:', selectedResult);
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    );
  }
);

VectorSearch.displayName = 'VectorSearch';

export { SearchResultItem };
export type { VectorSearchProps, SearchResultItemProps, VectorSearchFilters };
