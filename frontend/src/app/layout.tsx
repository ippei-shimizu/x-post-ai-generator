import type { Metadata, Viewport } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionProvider } from '@/providers/SessionProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'X-Post AI Generator',
  description: 'AI-powered X (Twitter) post generator for engineers',
  keywords: ['AI', 'Twitter', 'X', 'post generation', 'engineering'],
  authors: [{ name: 'X-Post AI Generator Team' }],
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider session={session}>
          <AuthProvider sessionCheckInterval={60000} autoRefresh={true}>
            {children}
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
