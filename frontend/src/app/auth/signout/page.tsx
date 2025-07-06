import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { Button } from '@/components/ui/button';

export default async function SignOutPage() {
  const session = await getServerSession(authOptions);

  // Redirect if not signed in
  if (!session) {
    redirect('/auth/signin');
  }

  const user = session.user;

  return (
    <div className="container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            サインアウト
          </h1>
          <p className="text-sm text-muted-foreground">
            {user?.name} さん、本当にサインアウトしますか？
          </p>
        </div>
        <div className="grid gap-4">
          <SignOutButton className="w-full" variant="destructive">
            サインアウト
          </SignOutButton>
          <Button variant="outline" asChild>
            <Link href="/">キャンセル</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
