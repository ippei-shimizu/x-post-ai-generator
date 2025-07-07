import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Shield,
  Zap,
  Github,
  Rss,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-primary relative overflow-hidden py-24 lg:py-32">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-gradient-accent blur-3xl"></div>
          <div className="bg-gradient-subtle absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full blur-3xl"></div>
        </div>

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="animate-fade-in space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                AI-Powered Tech Content Generation
              </div>

              <h1 className="text-balance text-5xl font-bold tracking-tight text-white lg:text-7xl">
                AIがあなたの
                <span className="block text-gradient-accent">技術発信</span>
                を支援
              </h1>

              <p className="mx-auto max-w-2xl text-balance text-xl text-white/80">
                個人の技術的興味と知識に基づいて、高品質なX（Twitter）投稿を自動生成。
                継続的な技術発信でエンジニアブランディングを加速させましょう。
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center gap-2"
                  >
                    今すぐ始める
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Link href="#features">機能を見る</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">
                革新的な機能
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                最新のAI技術とプライバシー保護を組み合わせた、次世代の技術発信プラットフォーム
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="hover-lift shadow-modern hover:shadow-modern-lg group rounded-xl border bg-card p-8 transition-all duration-300">
                <div className="bg-gradient-primary mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg text-white">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="group-hover:text-gradient-primary mb-3 text-xl font-semibold transition-colors">
                  AI投稿生成
                </h3>
                <p className="text-muted-foreground">
                  あなたのGitHubリポジトリやブログから学習し、個性的で高品質な技術投稿を自動生成。
                  最新のトレンドと個人の専門性を組み合わせます。
                </p>
              </div>

              <div className="hover-lift shadow-modern hover:shadow-modern-lg group rounded-xl border bg-card p-8 transition-all duration-300">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-accent text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="group-hover:text-gradient-primary mb-3 text-xl font-semibold transition-colors">
                  完全プライバシー保護
                </h3>
                <p className="text-muted-foreground">
                  Row Level
                  Securityによるデータ完全分離。他ユーザーとのデータ混在は一切なく、
                  あなたの情報は100%プライベートに保護されます。
                </p>
              </div>

              <div className="hover-lift shadow-modern hover:shadow-modern-lg group rounded-xl border bg-card p-8 transition-all duration-300">
                <div className="bg-gradient-subtle mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="group-hover:text-gradient-primary mb-3 text-xl font-semibold transition-colors">
                  継続的発信
                </h3>
                <p className="text-muted-foreground">
                  毎日10-20件の高品質投稿を自動生成。コンスタントな技術発信により、
                  エンジニアとしての個人ブランディングを強化します。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="bg-muted/30 py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold tracking-tight lg:text-4xl">
              最新技術スタック
            </h2>
            <p className="mb-12 text-lg text-muted-foreground">
              Next.js、Supabase、OpenAI GPT-4、pgvectorなど、最先端の技術で構築
            </p>

            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <div className="bg-gradient-primary h-8 w-8 rounded"></div>
                Next.js
              </div>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <div className="h-8 w-8 rounded bg-gradient-accent"></div>
                Supabase
              </div>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <div className="bg-gradient-subtle h-8 w-8 rounded"></div>
                OpenAI
              </div>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Github className="h-8 w-8" />
                GitHub API
              </div>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Rss className="h-8 w-8" />
                RSS Feeds
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-4xl">
              今すぐ始めましょう
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Googleアカウントでサインインして、AI支援による技術発信を体験してください
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-primary hover:bg-primary/90"
            >
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2"
              >
                無料で始める
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
