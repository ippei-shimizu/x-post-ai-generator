/**
 * Issue #21: search_user_content サービステスト
 *
 * TDD Green Phase: フロントエンドサービスの型安全性と統合テスト
 */

import {
  searchUserContent,
  searchUserContentByText,
  searchUserContentByTopics,
  searchUserContentByDateRange,
  searchUserContentBySourceType,
  searchUserContentHighPrecision,
  searchUserContentBroad,
  deduplicateSearchResults,
  mergeSearchResults,
  updatePerformanceStats,
  getSearchPerformanceStats,
} from '@/services/search-user-content';

import type {
  SearchUserContentParams,
  SearchUserContentResult,
  SearchUserContentResponse,
} from '@/types/search-user-content';

import {
  isValidSearchUserContentParams,
  createDefaultSearchParams,
  SEARCH_USER_CONTENT_CONSTRAINTS,
} from '@/types/search-user-content';

// Supabase mock
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    rpc: jest.fn(),
  },
}));

// Performance.now mock
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true,
});

// Get mocked supabase instance for tests
const { supabase: mockSupabase } = jest.requireMock('@/lib/supabase');

describe('search-user-content service', () => {
  const testUserId = '11111111-1111-1111-1111-111111111111';
  const testVector = Array.from({ length: 1536 }, (_, i) => Math.sin(i) * 0.5);

  const mockUser = {
    id: testUserId,
    email: 'test@example.com',
  };

  const mockSearchResult: SearchUserContentResult = {
    id: 'content-1',
    content_text: 'Test content for vector search',
    source_type: 'github',
    source_url: 'https://github.com/test/repo',
    similarity: 0.85,
    metadata: {
      model_name: 'text-embedding-ada-002',
      embedding_created_at: '2024-01-01T00:00:00Z',
      similarity_threshold: 0.7,
      is_active: true,
      metadata: {},
      query_info: {
        query_timestamp: '2024-01-01T12:00:00Z',
        requested_threshold: 0.7,
        requested_count: 10,
        source_filter: null,
        date_filter: {
          start_date: null,
          end_date: null,
        },
      },
    },
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000); // 初期時刻
    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    jest.restoreAllMocks();
  });

  describe('searchUserContent', () => {
    const validParams: SearchUserContentParams = {
      target_user_id: testUserId,
      query_vector: testVector,
      search_similarity_threshold: 0.7,
      match_count: 10,
    };

    it('should successfully search user content with valid parameters', async () => {
      // Setup mocks
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValue({
        data: [mockSearchResult],
        error: null,
      });
      mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(1050); // 50ms実行時間

      // Execute
      const result = await searchUserContent(validParams);

      // Verify
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual(mockSearchResult);
      expect(result.total_count).toBe(1);
      expect(result.execution_time_ms).toBe(50);
      expect(result.error).toBeUndefined();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_user_content', {
        target_user_id: testUserId,
        query_vector: testVector,
        search_similarity_threshold: 0.7,
        match_count: 10,
        start_date: null,
        end_date: null,
        source_type_filter: null,
        active_only: true,
      });
    });

    it('should handle authentication error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Authentication failed'),
      });

      const result = await searchUserContent(validParams);

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('Error');
      expect(result.error?.message).toContain('User authentication required');
      expect(result.results).toHaveLength(0);
    });

    it('should prevent cross-user access', async () => {
      const otherUserId = '22222222-2222-2222-2222-222222222222';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { ...mockUser, id: otherUserId } },
        error: null,
      });

      const result = await searchUserContent(validParams);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Access denied');
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await searchUserContent(validParams);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Database query failed');
    });

    it('should validate parameters before execution', async () => {
      const invalidParams = {
        ...validParams,
        search_similarity_threshold: 1.5, // Invalid threshold > 1.0
      };

      const result = await searchUserContent(invalidParams);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid search parameters');
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
    });

    it('should apply default parameters correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const minimalParams: SearchUserContentParams = {
        target_user_id: testUserId,
        query_vector: testVector,
      };

      await searchUserContent(minimalParams);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_user_content', {
        target_user_id: testUserId,
        query_vector: testVector,
        search_similarity_threshold:
          SEARCH_USER_CONTENT_CONSTRAINTS.SIMILARITY_THRESHOLD.DEFAULT,
        match_count: SEARCH_USER_CONTENT_CONSTRAINTS.MATCH_COUNT.DEFAULT,
        start_date: null,
        end_date: null,
        source_type_filter: null,
        active_only: true,
      });
    });

    it('should warn about slow performance', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });
      mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(2500); // 1500ms実行時間

      await searchUserContent(validParams);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('search_user_content performance warning')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('searchUserContentByText', () => {
    it('should generate embeddings and perform search', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValue({
        data: [mockSearchResult],
        error: null,
      });

      const result = await searchUserContentByText(testUserId, 'test query');

      expect(result.results).toHaveLength(1);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'search_user_content',
        expect.objectContaining({
          target_user_id: testUserId,
          query_vector: expect.any(Array),
        })
      );
    });

    it('should handle text embedding generation errors', async () => {
      // Mock embedding generation to fail
      const result = await searchUserContentByText(testUserId, '');

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('TextSearchError');
    });
  });

  describe('searchUserContentByTopics', () => {
    it('should perform parallel searches for multiple topics', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValue({
        data: [mockSearchResult],
        error: null,
      });

      const topics = ['React', 'TypeScript', 'Jest'];
      const results = await searchUserContentByTopics(testUserId, topics);

      expect(results).toHaveLength(3);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(3);
    });

    it('should handle errors gracefully in multi-topic search', async () => {
      const topics = ['Topic 1', 'Topic 2'];
      const results = await searchUserContentByTopics(testUserId, topics);

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('specialized search functions', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.rpc.mockResolvedValue({
        data: [mockSearchResult],
        error: null,
      });
    });

    it('should perform date range search', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await searchUserContentByDateRange(
        testUserId,
        'test',
        startDate,
        endDate
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'search_user_content',
        expect.objectContaining({
          start_date: '2024-01-01T00:00:00.000Z',
          end_date: '2024-01-31T00:00:00.000Z',
        })
      );
    });

    it('should perform source type filtered search', async () => {
      await searchUserContentBySourceType(testUserId, 'test', 'github');

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'search_user_content',
        expect.objectContaining({
          source_type_filter: 'github',
        })
      );
    });

    it('should perform high precision search', async () => {
      await searchUserContentHighPrecision(testUserId, 'test');

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'search_user_content',
        expect.objectContaining({
          search_similarity_threshold: 0.85,
        })
      );
    });

    it('should perform broad search', async () => {
      await searchUserContentBroad(testUserId, 'test');

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'search_user_content',
        expect.objectContaining({
          search_similarity_threshold: 0.5,
        })
      );
    });
  });

  describe('utility functions', () => {
    it('should deduplicate search results', () => {
      const duplicatedResults = [
        mockSearchResult,
        { ...mockSearchResult, similarity: 0.9 }, // 同じID
        { ...mockSearchResult, id: 'content-2', similarity: 0.8 },
      ];

      const deduplicated = deduplicateSearchResults(duplicatedResults);

      expect(deduplicated).toHaveLength(2);
      expect(deduplicated[0]?.id).toBe('content-1');
      expect(deduplicated[1]?.id).toBe('content-2');
    });

    it('should merge multiple search responses', () => {
      const responses: SearchUserContentResponse[] = [
        {
          results: [mockSearchResult],
          total_count: 1,
          execution_time_ms: 100,
        },
        {
          results: [{ ...mockSearchResult, id: 'content-2' }],
          total_count: 1,
          execution_time_ms: 150,
        },
      ];

      const merged = mergeSearchResults(responses);

      expect(merged.results).toHaveLength(2);
      expect(merged.total_count).toBe(2);
      expect(merged.execution_time_ms).toBe(250);
      expect(merged.error).toBeUndefined();
    });

    it('should merge responses with errors', () => {
      const responses: SearchUserContentResponse[] = [
        {
          results: [],
          total_count: 0,
          error: { code: 'Error1', message: 'First error' },
        },
        {
          results: [mockSearchResult],
          total_count: 1,
        },
      ];

      const merged = mergeSearchResults(responses);

      expect(merged.error).toBeDefined();
      if (merged.error) {
        expect(merged.error.code).toBe('MultipleErrors');
      }
    });
  });

  describe('performance tracking', () => {
    beforeEach(() => {
      // Reset performance history
      while (getSearchPerformanceStats().totalSearches > 0) {
        updatePerformanceStats(0, false);
      }
    });

    it('should track performance statistics', () => {
      updatePerformanceStats(100, false);
      updatePerformanceStats(200, false);
      updatePerformanceStats(300, true);

      const stats = getSearchPerformanceStats();

      expect(stats.totalSearches).toBe(3);
      expect(stats.averageExecutionTime).toBe(200);
      expect(stats.maxExecutionTime).toBe(300);
      expect(stats.minExecutionTime).toBe(100);
      expect(stats.successRate).toBe(2 / 3);
    });

    it('should return zero stats when no data', () => {
      const stats = getSearchPerformanceStats();

      expect(stats.totalSearches).toBe(0);
      expect(stats.averageExecutionTime).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });
});

describe('type validation functions', () => {
  const validParams: SearchUserContentParams = {
    target_user_id: 'test-user-id',
    query_vector: Array.from({ length: 1536 }, (_, i) => i * 0.001),
    search_similarity_threshold: 0.7,
    match_count: 10,
  };

  describe('isValidSearchUserContentParams', () => {
    it('should validate correct parameters', () => {
      expect(isValidSearchUserContentParams(validParams)).toBe(true);
    });

    it('should reject null or undefined input', () => {
      expect(isValidSearchUserContentParams(null)).toBe(false);
      expect(isValidSearchUserContentParams(undefined)).toBe(false);
    });

    it('should reject missing target_user_id', () => {
      const invalid = { ...validParams };
      delete (invalid as any).target_user_id;
      expect(isValidSearchUserContentParams(invalid)).toBe(false);
    });

    it('should reject invalid vector dimensions', () => {
      const invalid = { ...validParams, query_vector: [1, 2, 3] }; // Wrong dimension
      expect(isValidSearchUserContentParams(invalid)).toBe(false);
    });

    it('should reject invalid similarity threshold', () => {
      const invalid = { ...validParams, search_similarity_threshold: 1.5 }; // > 1.0
      expect(isValidSearchUserContentParams(invalid)).toBe(false);
    });

    it('should reject invalid match count', () => {
      const invalid = { ...validParams, match_count: -1 }; // < 0
      expect(isValidSearchUserContentParams(invalid)).toBe(false);
    });

    it('should reject invalid source type', () => {
      const invalid = { ...validParams, source_type_filter: 'invalid' as any };
      expect(isValidSearchUserContentParams(invalid)).toBe(false);
    });

    it('should accept valid optional parameters', () => {
      const withOptionals = {
        ...validParams,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        source_type_filter: 'github' as const,
        active_only: false,
      };
      expect(isValidSearchUserContentParams(withOptionals)).toBe(true);
    });
  });

  describe('createDefaultSearchParams', () => {
    it('should create default parameters', () => {
      const userId = 'test-user';
      const vector = Array.from({ length: 1536 }, () => 0.1);

      const params = createDefaultSearchParams(userId, vector);

      expect(params.target_user_id).toBe(userId);
      expect(params.query_vector).toBe(vector);
      expect(params.search_similarity_threshold).toBe(0.7);
      expect(params.match_count).toBe(10);
      expect(params.active_only).toBe(true);
    });
  });
});
