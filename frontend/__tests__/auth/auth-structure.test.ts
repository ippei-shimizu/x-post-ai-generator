import { describe, it, expect } from '@jest/globals';
import { existsSync } from 'fs';
import { join } from 'path';

describe('NextAuth Structure Tests', () => {
  describe('File Structure', () => {
    it('should have auth API route file', () => {
      const routePath = join(
        process.cwd(),
        'src/app/api/auth/[...nextauth]/route.ts'
      );
      expect(existsSync(routePath)).toBe(true);
    });

    it('should have auth library file', () => {
      const authPath = join(process.cwd(), 'src/lib/auth.ts');
      expect(existsSync(authPath)).toBe(true);
    });

    it('should have auth RLS integration file', () => {
      const rlsPath = join(process.cwd(), 'src/lib/auth-rls.ts');
      expect(existsSync(rlsPath)).toBe(true);
    });

    it('should have session provider file', () => {
      const providerPath = join(
        process.cwd(),
        'src/providers/SessionProvider.tsx'
      );
      expect(existsSync(providerPath)).toBe(true);
    });

    it('should have NextAuth type definitions', () => {
      const typesPath = join(process.cwd(), 'src/types/next-auth.d.ts');
      expect(existsSync(typesPath)).toBe(true);
    });
  });

  describe('Auth Component Files', () => {
    it('should have SignInButton component', () => {
      const componentPath = join(
        process.cwd(),
        'src/components/auth/SignInButton.tsx'
      );
      expect(existsSync(componentPath)).toBe(true);
    });

    it('should have SignOutButton component', () => {
      const componentPath = join(
        process.cwd(),
        'src/components/auth/SignOutButton.tsx'
      );
      expect(existsSync(componentPath)).toBe(true);
    });

    it('should have UserNav component', () => {
      const componentPath = join(
        process.cwd(),
        'src/components/auth/UserNav.tsx'
      );
      expect(existsSync(componentPath)).toBe(true);
    });
  });

  describe('Auth Hook Files', () => {
    it('should have useAuth hook', () => {
      const hookPath = join(process.cwd(), 'src/hooks/useAuth.ts');
      expect(existsSync(hookPath)).toBe(true);
    });

    it('should have useAuthGuard hook', () => {
      const hookPath = join(process.cwd(), 'src/hooks/useAuthGuard.ts');
      expect(existsSync(hookPath)).toBe(true);
    });
  });

  describe('Auth Page Files', () => {
    it('should have signin page', () => {
      const pagePath = join(process.cwd(), 'src/app/auth/signin/page.tsx');
      expect(existsSync(pagePath)).toBe(true);
    });

    it('should have signout page', () => {
      const pagePath = join(process.cwd(), 'src/app/auth/signout/page.tsx');
      expect(existsSync(pagePath)).toBe(true);
    });

    it('should have error page', () => {
      const pagePath = join(process.cwd(), 'src/app/auth/error/page.tsx');
      expect(existsSync(pagePath)).toBe(true);
    });
  });

  describe('UI Component Files', () => {
    it('should have button component', () => {
      const componentPath = join(process.cwd(), 'src/components/ui/button.tsx');
      expect(existsSync(componentPath)).toBe(true);
    });

    it('should have avatar component', () => {
      const componentPath = join(process.cwd(), 'src/components/ui/avatar.tsx');
      expect(existsSync(componentPath)).toBe(true);
    });

    it('should have dropdown menu component', () => {
      const componentPath = join(
        process.cwd(),
        'src/components/ui/dropdown-menu.tsx'
      );
      expect(existsSync(componentPath)).toBe(true);
    });

    it('should have icons component', () => {
      const componentPath = join(process.cwd(), 'src/components/ui/icons.tsx');
      expect(existsSync(componentPath)).toBe(true);
    });
  });
});
