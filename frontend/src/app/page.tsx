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
    <div className="relative min-h-screen">
      {/* Ultimate Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="bg-gradient-glow absolute left-1/4 top-0 h-96 w-96 animate-float-glow rounded-full opacity-20 blur-3xl"></div>
        <div className="bg-gradient-accent absolute bottom-1/4 right-1/4 h-80 w-80 animate-pulse-electric rounded-full opacity-15 blur-3xl"></div>
        <div className="bg-gradient-neon absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 transform animate-gradient-flow rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 lg:py-48">
        {/* Dynamic mesh gradient */}
        <div className="bg-gradient-dark absolute inset-0 opacity-50"></div>

        {/* Floating particles effect */}
        <div className="absolute inset-0">
          <div className="bg-gradient-primary absolute left-10 top-20 h-2 w-2 animate-float-glow rounded-full"></div>
          <div className="bg-gradient-accent absolute right-20 top-40 h-1 w-1 animate-pulse-electric rounded-full"></div>
          <div className="bg-gradient-glow absolute bottom-32 left-1/3 h-3 w-3 animate-float-glow rounded-full"></div>
          <div className="bg-gradient-neon absolute bottom-20 right-1/4 h-2 w-2 animate-pulse-electric rounded-full"></div>
        </div>

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-6xl text-center">
            <div className="animate-fade-in space-y-8">
              {/* Status badge with ultra effects */}
              <div className="glass-ultra hover-glow inline-flex items-center gap-3 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-foreground">
                <Sparkles className="text-gradient-electric h-5 w-5 animate-pulse-electric" />
                <span className="text-gradient-primary">
                  AI-Powered Tech Content Generation
                </span>
                <div className="bg-gradient-glow h-2 w-2 animate-pulse-electric rounded-full"></div>
              </div>

              {/* Main heading with mind-blowing effects */}
              <h1 className="text-balance text-6xl font-bold tracking-tight lg:text-8xl xl:text-9xl">
                <span className="text-gradient-neon animate-gradient-flow">
                  AI
                </span>
                <span className="text-foreground">があなたの</span>
                <br />
                <span className="text-gradient-electric block animate-electric-pulse">
                  技術発信
                </span>
                <span className="text-foreground">を</span>
                <span className="text-gradient-primary animate-text-glow">
                  支援
                </span>
              </h1>

              {/* Subtitle with glow effect */}
              <p className="mx-auto max-w-3xl text-balance text-xl leading-relaxed text-muted-foreground lg:text-2xl">
                個人の技術的興味と知識に基づいて、
                <span className="text-gradient-electric font-semibold">
                  高品質なX（Twitter）投稿
                </span>
                を自動生成。
                <br />
                継続的な技術発信で
                <span className="text-gradient-primary font-semibold">
                  エンジニアブランディング
                </span>
                を加速させましょう。
              </p>

              {/* CTA buttons with ultra effects */}
              <div className="flex flex-col gap-6 pt-8 sm:flex-row sm:justify-center sm:gap-8">
                <Button asChild variant="ultra" size="xl" className="group">
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center gap-3"
                  >
                    <span className="text-glow">今すぐ始める</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="glass" size="xl" className="group">
                  <Link
                    href="#features"
                    className="inline-flex items-center gap-3"
                  >
                    <span>機能を見る</span>
                    <Sparkles className="h-5 w-5 transition-all group-hover:animate-pulse-electric" />
                  </Link>
                </Button>
              </div>

              {/* Tech stack showcase */}
              <div className="pt-16">
                <p className="mb-8 text-sm text-muted-foreground">
                  最先端技術で構築された次世代プラットフォーム
                </p>
                <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
                  {[
                    'Next.js',
                    'OpenAI',
                    'Supabase',
                    'PostgreSQL',
                    'TypeScript',
                  ].map((tech, index) => (
                    <div
                      key={tech}
                      className="glass-dark hover-electric rounded-xl px-4 py-2 text-sm font-medium"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {tech}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 lg:py-48">
        {/* Section background effects */}
        <div className="absolute inset-0">
          <div className="bg-gradient-secondary absolute right-1/4 top-1/4 h-72 w-72 animate-pulse-electric rounded-full opacity-20 blur-3xl"></div>
          <div className="bg-gradient-accent absolute bottom-1/3 left-1/3 h-64 w-64 animate-float-glow rounded-full opacity-15 blur-3xl"></div>
        </div>

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-7xl">
            {/* Section header */}
            <div className="mb-24 text-center">
              <div className="glass-ultra mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium">
                <div className="bg-gradient-electric h-2 w-2 animate-pulse-electric rounded-full"></div>
                <span className="text-gradient-primary">
                  Revolutionary Features
                </span>
              </div>

              <h2 className="mb-6 text-5xl font-bold tracking-tight lg:text-6xl">
                <span className="text-gradient-electric">革新的な</span>
                <span className="text-foreground">機能</span>
              </h2>

              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground lg:text-2xl">
                最新のAI技術とプライバシー保護を組み合わせた、
                <br className="hidden lg:block" />
                <span className="text-gradient-primary font-semibold">
                  次世代の技術発信プラットフォーム
                </span>
              </p>
            </div>

            {/* Features grid */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="hover-levitate glass-ultra group relative overflow-hidden rounded-3xl border border-white/10 p-8">
                {/* Card glow effect */}
                <div className="bg-gradient-primary absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-5"></div>

                <div className="relative">
                  <div className="bg-gradient-primary shadow-neon mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                    <Bot className="h-8 w-8 text-white" />
                  </div>

                  <h3 className="group-hover:text-gradient-electric mb-4 text-2xl font-bold transition-all duration-300">
                    AI投稿生成
                  </h3>

                  <p className="text-lg leading-relaxed text-muted-foreground">
                    あなたの
                    <span className="text-gradient-primary font-semibold">
                      GitHubリポジトリやブログ
                    </span>
                    から学習し、
                    個性的で高品質な技術投稿を自動生成。最新のトレンドと個人の専門性を組み合わせます。
                  </p>

                  {/* Feature highlights */}
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="bg-gradient-primary h-1.5 w-1.5 rounded-full"></div>
                      個人データに基づく学習
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="bg-gradient-accent h-1.5 w-1.5 rounded-full"></div>
                      最新トレンド自動反映
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="hover-levitate glass-ultra group relative overflow-hidden rounded-3xl border border-white/10 p-8">
                <div className="bg-gradient-accent absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-5"></div>

                <div className="relative">
                  <div className="bg-gradient-accent shadow-electric mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                    <Shield className="h-8 w-8 text-white" />
                  </div>

                  <h3 className="group-hover:text-gradient-electric mb-4 text-2xl font-bold transition-all duration-300">
                    完全プライバシー保護
                  </h3>

                  <p className="text-lg leading-relaxed text-muted-foreground">
                    <span className="text-gradient-accent font-semibold">
                      Row Level Security
                    </span>
                    によるデータ完全分離。
                    他ユーザーとのデータ混在は一切なく、あなたの情報は100%プライベートに保護されます。
                  </p>

                  <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="bg-gradient-accent h-1.5 w-1.5 rounded-full"></div>
                      ユーザー間完全分離
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="bg-gradient-glow h-1.5 w-1.5 rounded-full"></div>
                      エンドツーエンド暗号化
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="hover-levitate glass-ultra group relative overflow-hidden rounded-3xl border border-white/10 p-8">
                <div className="bg-gradient-glow absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-5"></div>

                <div className="relative">
                  <div className="bg-gradient-glow shadow-neon mb-6 inline-flex h-16 w-16 animate-pulse-electric items-center justify-center rounded-2xl">
                    <Zap className="h-8 w-8 text-white" />
                  </div>

                  <h3 className="group-hover:text-gradient-electric mb-4 text-2xl font-bold transition-all duration-300">
                    継続的発信
                  </h3>

                  <p className="text-lg leading-relaxed text-muted-foreground">
                    毎日
                    <span className="text-gradient-glow font-semibold">
                      10-20件の高品質投稿
                    </span>
                    を自動生成。
                    コンスタントな技術発信により、エンジニアとしての個人ブランディングを強化します。
                  </p>

                  <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="bg-gradient-glow h-1.5 w-1.5 rounded-full"></div>
                      自動スケジューリング
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="bg-gradient-primary h-1.5 w-1.5 rounded-full"></div>
                      品質保証システム
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional features showcase */}
            <div className="mt-24 text-center">
              <div className="glass-ultra mx-auto max-w-4xl rounded-3xl border border-white/10 p-12">
                <h3 className="mb-6 text-3xl font-bold">
                  <span className="text-gradient-neon">さらなる特徴</span>
                </h3>
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                  {[
                    { icon: '🚀', label: '高速生成', desc: 'リアルタイム処理' },
                    {
                      icon: '🎯',
                      label: '精密ターゲティング',
                      desc: '個人最適化',
                    },
                    {
                      icon: '📊',
                      label: '詳細分析',
                      desc: 'パフォーマンス追跡',
                    },
                    { icon: '🔄', label: '継続改善', desc: 'AI学習システム' },
                  ].map((feature, index) => (
                    <div key={index} className="hover-electric text-center">
                      <div className="mb-3 text-4xl">{feature.icon}</div>
                      <div className="text-gradient-primary mb-1 font-semibold">
                        {feature.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {feature.desc}
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="bg-gradient-accent h-8 w-8 rounded"></div>
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
