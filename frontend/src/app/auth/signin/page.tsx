import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { SignInButton } from '@/components/auth/SignInButton';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  // Redirect if already signed in
  if (session) {
    redirect('/');
  }

  return (
    <div className="container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="m8 3 4 8 5-5v11H5V6l3-3z" />
          </svg>
          X-Post-AI-Generator
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;AIがあなたの技術的洞察を自動的に投稿として変換し、継続的な技術発信を支援します。&rdquo;
            </p>
            <footer className="text-sm">X-Post-AI-Generator Team</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              アカウントにサインイン
            </h1>
            <p className="text-sm text-muted-foreground">
              Google アカウントでサインインして、AI投稿生成を開始しましょう
            </p>
          </div>
          <div className="grid gap-6">
            <SignInButton className="w-full">Google でサインイン</SignInButton>
          </div>
          <p className="px-8 text-center text-sm text-muted-foreground">
            サインインすることで、
            <a
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              利用規約
            </a>
            と
            <a
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
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
