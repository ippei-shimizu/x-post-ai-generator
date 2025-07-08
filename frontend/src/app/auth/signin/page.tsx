import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { SignInButton } from '@/components/auth/SignInButton';
import { Bot, Shield, Sparkles, Lock, Rocket } from 'lucide-react';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  // Redirect if already signed in
  if (session) {
    redirect('/');
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ultimate Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="bg-gradient-glow absolute left-1/4 top-0 h-96 w-96 animate-float-glow rounded-full opacity-20 blur-3xl"></div>
        <div className="bg-gradient-accent absolute bottom-1/4 right-1/4 h-80 w-80 animate-pulse-electric rounded-full opacity-15 blur-3xl"></div>
        <div className="bg-gradient-neon absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 transform animate-gradient-flow rounded-full opacity-10 blur-3xl"></div>
        <div className="bg-gradient-secondary absolute right-20 top-20 h-64 w-64 animate-electric-pulse rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left side - Revolutionary Brand showcase */}
        <div className="relative hidden h-full flex-col overflow-hidden p-12 text-white lg:flex">
          {/* Ultra glass background */}
          <div className="glass-ultra absolute inset-0"></div>

          {/* Dynamic background particles */}
          <div className="absolute inset-0 opacity-30">
            <div className="bg-gradient-neon absolute left-1/4 top-1/4 h-72 w-72 animate-gradient-flow rounded-full blur-3xl"></div>
            <div className="bg-gradient-glow absolute bottom-1/4 right-1/4 h-64 w-64 animate-pulse-electric rounded-full blur-3xl"></div>
            <div className="bg-gradient-accent absolute left-1/3 top-1/2 h-48 w-48 animate-float-glow rounded-full blur-3xl"></div>
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0">
            <div className="bg-gradient-primary absolute left-16 top-24 h-2 w-2 animate-float-glow rounded-full"></div>
            <div className="bg-gradient-accent absolute right-20 top-1/3 h-1 w-1 animate-pulse-electric rounded-full"></div>
            <div className="bg-gradient-glow absolute bottom-1/3 left-1/4 h-3 w-3 animate-float-glow rounded-full"></div>
            <div className="bg-gradient-neon absolute bottom-24 right-1/3 h-2 w-2 animate-pulse-electric rounded-full"></div>
          </div>

          {/* Logo and ultra branding */}
          <div className="relative z-20 flex items-center text-2xl font-bold">
            <div className="bg-gradient-neon shadow-neon mr-4 flex h-14 w-14 animate-pulse-electric items-center justify-center rounded-2xl border border-white/20">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <span className="text-gradient-electric">X-Post-AI-Generator</span>
          </div>

          {/* Revolutionary features preview */}
          <div className="relative z-20 mt-20 space-y-12">
            <div className="space-y-6">
              <h2 className="text-balance text-4xl font-bold leading-tight lg:text-5xl">
                <span className="text-gradient-neon animate-gradient-flow">
                  AI革命
                </span>
                <span className="text-foreground">で</span>
                <br />
                <span className="text-gradient-electric animate-electric-pulse">
                  技術発信
                </span>
                <span className="text-foreground">を</span>
                <br />
                <span className="text-gradient-primary animate-text-glow">
                  次元上昇
                </span>
              </h2>
              <p className="text-foreground/90 text-xl leading-relaxed">
                個人の技術的興味と専門性に基づいた
                <span className="text-gradient-glow font-semibold">
                  革新的投稿生成
                </span>
                システム
              </p>
            </div>

            <div className="space-y-8">
              <div className="hover-levitate group flex items-start gap-6">
                <div className="bg-gradient-primary shadow-neon flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="group-hover:text-gradient-electric text-xl font-bold transition-all duration-300">
                    AI投稿生成
                  </h3>
                  <p className="text-foreground/80 leading-relaxed">
                    GitHubとブログから学習し、
                    <span className="text-gradient-primary font-semibold">
                      個性的な技術投稿
                    </span>
                    を自動作成
                  </p>
                </div>
              </div>

              <div className="hover-levitate group flex items-start gap-6">
                <div className="bg-gradient-accent shadow-electric flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="group-hover:text-gradient-electric text-xl font-bold transition-all duration-300">
                    完全プライバシー
                  </h3>
                  <p className="text-foreground/80 leading-relaxed">
                    <span className="text-gradient-accent font-semibold">
                      Row Level Security
                    </span>
                    により ユーザーデータは100%分離保護
                  </p>
                </div>
              </div>

              <div className="hover-levitate group flex items-start gap-6">
                <div className="bg-gradient-glow shadow-electric flex h-14 w-14 animate-pulse-electric items-center justify-center rounded-2xl border border-white/20">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="group-hover:text-gradient-electric text-xl font-bold transition-all duration-300">
                    継続的発信
                  </h3>
                  <p className="text-foreground/80 leading-relaxed">
                    毎日
                    <span className="text-gradient-glow font-semibold">
                      10-20件の高品質投稿
                    </span>
                    で 技術ブランディングを飛躍的強化
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ultra quote */}
          <div className="relative z-20 mt-auto">
            <div className="glass-ultra rounded-3xl border border-white/20 p-8">
              <blockquote className="space-y-4">
                <p className="text-glow text-xl italic">
                  &ldquo;技術発信の
                  <span className="text-gradient-primary font-semibold">
                    継続性と品質
                  </span>
                  を両立する、
                  <span className="text-gradient-electric font-semibold">
                    まったく新次元の体験
                  </span>
                  &rdquo;
                </p>
                <footer className="text-foreground/60 text-sm font-semibold">
                  X-Post-AI-Generator Development Team
                </footer>
              </blockquote>
            </div>
          </div>
        </div>

        {/* Right side - Ultra modern Sign in form */}
        <div className="relative lg:p-12">
          <div className="mx-auto flex w-full flex-col justify-center space-y-12 sm:w-[480px]">
            {/* Mobile ultra logo */}
            <div className="flex items-center justify-center lg:hidden">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-neon shadow-neon flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 text-white">
                  <Bot className="h-8 w-8" />
                </div>
                <span className="text-gradient-electric text-2xl font-bold">
                  X-Post-AI-Generator
                </span>
              </div>
            </div>

            {/* Ultra Sign in form */}
            <div className="glass-ultra relative overflow-hidden rounded-3xl border border-white/20 p-10">
              {/* Card glow effect */}
              <div className="bg-gradient-primary absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 hover:opacity-5"></div>

              <div className="relative flex flex-col space-y-8 text-center">
                <div className="space-y-4">
                  <div className="glass-dark mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
                    <div className="bg-gradient-electric h-2 w-2 animate-pulse-electric rounded-full"></div>
                    <span className="text-gradient-primary">
                      Secure Authentication
                    </span>
                  </div>

                  <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
                    <span className="text-gradient-neon animate-gradient-flow">
                      サインイン
                    </span>
                  </h1>
                  <p className="text-xl leading-relaxed text-muted-foreground">
                    Google アカウントでサインインして、
                    <br />
                    <span className="text-gradient-electric font-semibold">
                      AI革新的投稿生成
                    </span>
                    を開始しましょう
                  </p>
                </div>

                <div className="space-y-6">
                  <SignInButton
                    className="group w-full"
                    variant="ultra"
                    size="xl"
                  >
                    <span className="flex items-center gap-3">
                      <Rocket className="h-6 w-6 transition-all group-hover:animate-pulse-electric" />
                      <span className="text-glow">Google でサインイン</span>
                    </span>
                  </SignInButton>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-sm font-semibold uppercase">
                      <span className="glass-dark rounded-full border border-white/10 px-4 py-2 text-muted-foreground">
                        または
                      </span>
                    </div>
                  </div>

                  <div className="glass-neon hover-glow rounded-2xl border border-white/20 p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-accent shadow-electric flex h-10 w-10 items-center justify-center rounded-xl border border-white/20">
                        <Lock className="h-5 w-5 text-white" />
                      </div>
                      <div className="space-y-2 text-left">
                        <p className="text-gradient-primary font-semibold">
                          デモアカウント
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          <span className="font-semibold">
                            demo@example.com
                          </span>
                          <br />
                          本格運用前の機能確認用アカウント
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ultra Terms */}
            <div className="text-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                サインインすることで、
                <a
                  href="/terms"
                  className="text-gradient-primary hover:text-glow hover-electric font-semibold transition-all duration-300"
                >
                  利用規約
                </a>
                と
                <a
                  href="/privacy"
                  className="text-gradient-primary hover:text-glow hover-electric font-semibold transition-all duration-300"
                >
                  プライバシーポリシー
                </a>
                に同意するものとします。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
