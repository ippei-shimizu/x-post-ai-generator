import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AuthErrorPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

const errorMessages = {
  Configuration: '認証設定に問題があります。管理者にお問い合わせください。',
  AccessDenied: 'アクセスが拒否されました。適切な権限がありません。',
  Verification: '認証の検証に失敗しました。もう一度お試しください。',
  Default: '認証中にエラーが発生しました。もう一度お試しください。',
} as const;

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const params = await searchParams;
  const error = params.error as keyof typeof errorMessages;
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-destructive text-2xl font-semibold tracking-tight">
            認証エラー
          </h1>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
        <div className="grid gap-4">
          <Button asChild>
            <Link href="/auth/signin">再度サインインする</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">ホームに戻る</Link>
          </Button>
        </div>
        {error && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              エラーコード: {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
