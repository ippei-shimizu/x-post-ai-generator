import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { SignInButton } from '@/components/auth/SignInButton';
import { Bot, Shield, Sparkles } from 'lucide-react';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  // Redirect if already signed in
  if (session) {
    redirect('/');
  }

  return (
    <div className="container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left side - Brand showcase */}
      <div className="bg-gradient-primary relative hidden h-full flex-col p-10 text-white lg:flex">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-1/3 top-1/3 h-64 w-64 rounded-full bg-gradient-accent blur-3xl"></div>
          <div className="bg-gradient-subtle absolute bottom-1/3 right-1/3 h-64 w-64 rounded-full blur-3xl"></div>
        </div>

        {/* Logo and branding */}
        <div className="relative z-20 flex items-center text-xl font-bold">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <Bot className="h-6 w-6" />
          </div>
          X-Post-AI-Generator
        </div>

        {/* Features preview */}
        <div className="relative z-20 mt-16 space-y-8">
          <div className="space-y-4">
            <h2 className="text-balance text-3xl font-bold">
              AI支援で技術発信を
              <br />
              次のレベルへ
            </h2>
            <p className="text-lg text-white/80">
              個人の技術的興味と専門性に基づいた高品質な投稿を自動生成
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI投稿生成</h3>
                <p className="text-sm text-white/80">
                  GitHubとブログから学習し、個性的な技術投稿を自動作成
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">プライバシー保護</h3>
                <p className="text-sm text-white/80">
                  ユーザーデータは完全分離で100%プライベート
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">継続的発信</h3>
                <p className="text-sm text-white/80">
                  毎日10-20件の投稿で技術ブランディングを強化
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-3">
            <p className="text-lg italic">
              &ldquo;技術発信の継続性と品質を両立する、まったく新しい体験&rdquo;
            </p>
            <footer className="text-sm opacity-80">
              X-Post-AI-Generator Team
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right side - Sign in form */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center justify-center lg:hidden">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary flex h-12 w-12 items-center justify-center rounded-lg text-white">
                <Bot className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold">X-Post-AI-Generator</span>
            </div>
          </div>

          {/* Sign in form */}
          <div className="flex flex-col space-y-6 text-center">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">サインイン</h1>
              <p className="text-muted-foreground">
                Google アカウントでサインインして、AI投稿生成を開始しましょう
              </p>
            </div>

            <div className="space-y-4">
              <SignInButton className="w-full" variant="gradient" size="lg">
                Google でサインイン
              </SignInButton>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    または
                  </span>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>デモアカウント:</strong> demo@example.com
                  <br />
                  本格運用前の機能確認用アカウント
                </p>
              </div>
            </div>
          </div>

          {/* Terms */}
          <p className="text-center text-sm text-muted-foreground">
            サインインすることで、
            <a
              href="/terms"
              className="font-medium underline underline-offset-4 transition-colors hover:text-primary"
            >
              利用規約
            </a>
            と
            <a
              href="/privacy"
              className="font-medium underline underline-offset-4 transition-colors hover:text-primary"
            >
              プライバシーポリシー
            </a>
            に同意するものとします。
          </p>
        </div>
      </div>
    </div>
  );
}
