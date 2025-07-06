import type { Metadata, Viewport } from 'next';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
