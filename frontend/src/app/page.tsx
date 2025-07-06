import { UserNav } from '@/components/auth/UserNav';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <h1 className="text-xl font-bold">X-Post AI Generator</h1>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              <UserNav />
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              AIがあなたの技術発信を支援
            </h1>
            <p className="text-xl text-muted-foreground">
              個人の技術的興味と知識に基づいて、高品質なX（Twitter）投稿を自動生成します
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-card space-y-3 rounded-lg border p-6">
              <h3 className="text-lg font-semibold">🤖 AI投稿生成</h3>
              <p className="text-sm text-muted-foreground">
                あなたのGitHubやブログから学習して、個性的な技術投稿を自動生成
              </p>
            </div>
            <div className="bg-card space-y-3 rounded-lg border p-6">
              <h3 className="text-lg font-semibold">🔒 完全プライバシー</h3>
              <p className="text-sm text-muted-foreground">
                ユーザーデータは完全分離。他のユーザーとデータが混在することはありません
              </p>
            </div>
            <div className="bg-card space-y-3 rounded-lg border p-6">
              <h3 className="text-lg font-semibold">⚡ 継続的発信</h3>
              <p className="text-sm text-muted-foreground">
                毎日10-20件の高品質投稿で、技術発信を継続的にサポート
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
