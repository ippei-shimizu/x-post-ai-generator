/**
 * Users Database Operations Tests
 * TDD Red Phase: RLS と Supabase Auth 連携のテスト
 */

import { createClient } from '@supabase/supabase-js';
import { getCurrentUser, updateCurrentUser, checkUsernameAvailability } from '@/lib/database/users';
import type { Database } from '@/types/database';

// Supabase クライアントのモック
jest.mock('@supabase/supabase-js');

const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    admin: {
      deleteUser: jest.fn(),
    },
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        maybeSingle: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
};

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('Users Database Operations (TDD Red Phase)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
    // Set up environment variables for tests
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  describe('getCurrentUser', () => {
    it('should return user data when authenticated', async () => {
      // Red Phase: 実装前なので失敗する
      const mockSession = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'test@example.com',
        },
      };

      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        google_id: 'google_123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockUser,
            error: null,
          }),
        })),
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getCurrentUser();

      expect(result).toEqual({
        data: mockUser,
        error: null,
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should return error when not authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toEqual({
        data: null,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User is not authenticated',
        },
      });
    });

    it('should return error when session retrieval fails', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' },
      });

      const result = await getCurrentUser();

      expect(result).toEqual({
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'Failed to get session',
          details: 'Session error',
        },
      });
    });
  });

  describe('updateCurrentUser', () => {
    it('should update user data when authenticated', async () => {
      const mockSession = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'test@example.com',
        },
      };

      const updates = {
        display_name: 'Updated Name',
        username: 'updateduser',
      };

      const updatedUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'test@example.com',
        username: 'updateduser',
        display_name: 'Updated Name',
        avatar_url: 'https://example.com/avatar.jpg',
        google_id: 'google_123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T01:00:00Z',
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: updatedUser,
              error: null,
            }),
          })),
        })),
      }));

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await updateCurrentUser(updates);

      expect(result).toEqual({
        data: updatedUser,
        error: null,
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockUpdate).toHaveBeenCalledWith(updates);
    });

    it('should return error when not authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await updateCurrentUser({ display_name: 'New Name' });

      expect(result).toEqual({
        data: null,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User is not authenticated',
        },
      });
    });
  });

  describe('checkUsernameAvailability', () => {
    it('should return true when username is available', async () => {
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        })),
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await checkUsernameAvailability('newuser123');

      expect(result).toEqual({
        data: true,
        error: null,
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('id');
    });

    it('should return false when username is taken', async () => {
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'some-user-id' },
            error: null,
          }),
        })),
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await checkUsernameAvailability('existinguser');

      expect(result).toEqual({
        data: false,
        error: null,
      });
    });

    it('should return error for invalid username format', async () => {
      const result = await checkUsernameAvailability('ab');

      expect(result).toEqual({
        data: null,
        error: {
          code: 'INVALID_USERNAME',
          message: 'Username must be 3-50 characters and contain only letters, numbers, hyphens, and underscores',
        },
      });
    });

    it('should return error for username with special characters', async () => {
      const result = await checkUsernameAvailability('user@name');

      expect(result).toEqual({
        data: null,
        error: {
          code: 'INVALID_USERNAME',
          message: 'Username must be 3-50 characters and contain only letters, numbers, hyphens, and underscores',
        },
      });
    });
  });

  describe('RLS Policy Compliance', () => {
    it('should only access data with proper user context', async () => {
      // Red Phase: RLS ポリシーの動作確認
      const mockSession = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'test@example.com',
        },
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockSelect = jest.fn(() => ({
        eq: jest.fn((field, value) => {
          // RLS ensures user can only access their own data
          expect(field).toBe('id');
          expect(value).toBe(mockSession.user.id);
          
          return {
            single: jest.fn().mockResolvedValue({
              data: { id: mockSession.user.id },
              error: null,
            }),
          };
        }),
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      } as any);

      await getCurrentUser();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
    });

    it('should handle RLS policy violations', async () => {
      // Red Phase: RLS ポリシー違反のテスト
      const mockSession = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'test@example.com',
        },
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: '42501',
              message: 'new row violates row-level security policy',
              details: 'Failing row contains (other-user-id, ...)',
              hint: 'Check RLS policies',
            },
          }),
        })),
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getCurrentUser();

      expect(result).toEqual({
        data: null,
        error: {
          code: '42501',
          message: 'new row violates row-level security policy',
          details: 'Failing row contains (other-user-id, ...)',
          hint: 'Check RLS policies',
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockSupabaseClient.auth.getSession.mockRejectedValue(
        new Error('Network error')
      );

      const result = await getCurrentUser();

      expect(result).toEqual({
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
          details: 'Network error',
        },
      });
    });

    it('should handle database errors', async () => {
      const mockSession = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'test@example.com',
        },
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: '23505',
              message: 'duplicate key value violates unique constraint',
              details: 'Key (email)=(test@example.com) already exists.',
            },
          }),
        })),
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getCurrentUser();

      expect(result).toEqual({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint',
          details: 'Key (email)=(test@example.com) already exists.',
        },
      });
    });
  });
});