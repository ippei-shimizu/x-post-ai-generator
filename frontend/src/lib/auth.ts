import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';

// Supabase client for auth operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for NextAuth');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for NextAuth');
}

// Create admin Supabase client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const authOptions: NextAuthOptions = {
  // Authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request additional Google scopes if needed
          scope: 'openid email profile',
          // Ensure fresh consent for better security
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],

  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Callback functions for JWT and session management
  callbacks: {
    // Sign in callback - handle user creation/update in Supabase
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if user exists in auth_users table
          const { data: existingUser, error: checkError } = await supabaseAdmin
            .from('auth_users')
            .select('id')
            .eq('email', user.email)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            // Error other than "not found"
            console.error('Error checking user:', checkError);
            return false;
          }

          if (!existingUser) {
            // Create new user in auth_users table
            const { error: insertError } = await supabaseAdmin
              .from('auth_users')
              .insert({
                id: user.id,
                email: user.email,
                name: user.name || '',
                image: user.image || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (insertError) {
              console.error('Error creating user:', insertError);
              return false;
            }
          }

          return true;
        } catch (error) {
          console.error('SignIn callback error:', error);
          return false;
        }
      }
      return true;
    },

    // JWT callback - runs whenever JWT is created/updated
    async jwt({ token, user, account }) {
      // Add user ID to token when user signs in
      if (user) {
        token.uid = user.id;
        token.email = user.email || '';
        token.name = user.name || '';
        token.picture = user.image || '';
      }

      // Add provider information
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }

      return token;
    },

    // Session callback - runs whenever session is accessed
    async session({ session, token }) {
      // Add user ID to session for RLS
      if (token) {
        session.user.id = token.uid as string;
        session.user.email = (token.email as string) || '';
        session.user.name = (token.name as string) || '';
        session.user.image = (token.picture as string) || '';
      }

      return session;
    },

    // Redirect callback - control where user goes after sign in
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allow same-origin URLs
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default redirect
      return baseUrl;
    },
  },

  // Custom pages
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  // Events for logging and debugging
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log('🔐 User signed in:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      });
    },
    async signOut({ session, token }) {
      console.log('👋 User signed out:', {
        userId: token?.uid || session?.user?.id,
      });
    },
    async createUser({ user }) {
      console.log('👤 New user created:', {
        userId: user.id,
        email: user.email,
      });
    },
  },

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Security settings
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

// Export default for NextAuth API route
export default authOptions;
