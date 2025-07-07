import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionProvider } from '@/providers/SessionProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { Header } from '@/components/layouts/Header';
import './globals.css';

// Modern typography with Inter
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

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
      <body
        className={`min-h-screen bg-background font-sans antialiased ${inter.variable}`}
      >
        <SessionProvider session={session}>
          <AuthProvider sessionCheckInterval={60000} autoRefresh={true}>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
