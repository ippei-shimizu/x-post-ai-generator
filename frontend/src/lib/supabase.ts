import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Supabase client configuration with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables with descriptive errors
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
}

if (!supabaseAnonKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required'
  );
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
}

// Create Supabase client with optimized configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Optimize token refresh timing
    storageKey: 'x-post-ai-auth',
    flowType: 'pkce', // Use PKCE flow for enhanced security
  },
  // Global configuration for RLS and monitoring
  global: {
    headers: {
      'X-Client-Info': 'x-post-ai-generator',
      'X-Client-Version': '1.0.0',
    },
  },
  // Optimize database settings
  db: {
    schema: 'public',
  },
  // Realtime configuration for future features
  realtime: {
    params: {
      eventsPerSecond: 2, // Rate limit for realtime events
    },
  },
});

// Server-side client for admin operations (service role)
export const createServerClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'x-post-ai-generator-server',
      },
    },
  });
};

// Enhanced helper function to get current user with error handling
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error('Error fetching user:', error.message);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Unexpected error fetching user:', error);
    return null;
  }
};

// Optimized authentication check with caching
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session !== null && session.expires_at
      ? new Date(session.expires_at * 1000) > new Date()
      : false;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Helper function to get user ID for RLS with validation
export const getUserId = async (): Promise<string | null> => {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      console.warn('No authenticated user found');
      return null;
    }
    return user.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// Enhanced error handler for Supabase operations
export const handleSupabaseError = (error: any, operation: string) => {
  const errorMessage = error?.message || 'Unknown error';
  const errorCode = error?.code || 'UNKNOWN';

  console.error(`Supabase ${operation} error [${errorCode}]:`, errorMessage);

  // Handle specific error types
  switch (errorCode) {
    case 'PGRST116': // Row Level Security violation
      throw new Error('Access denied: You can only access your own data');
    case 'PGRST301': // JSON Web Token expired
      throw new Error('Your session has expired. Please log in again.');
    case '42501': // PostgreSQL insufficient privilege
      throw new Error('Insufficient permissions for this operation');
    default:
      throw new Error(`Database operation failed: ${errorMessage}`);
  }
};

// User-safe database query wrapper
export const safeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  operation: string
): Promise<T | null> => {
  try {
    const { data, error } = await queryFn();
    if (error) {
      handleSupabaseError(error, operation);
    }
    return data;
  } catch (error) {
    console.error(`Safe query failed for ${operation}:`, error);
    throw error;
  }
};

// Export types for TypeScript
export type { User, Session } from '@supabase/supabase-js';
