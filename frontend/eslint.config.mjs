import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // TypeScriptプラグインの問題を回避
      '@typescript-eslint/no-unsafe-declaration-merging': 'off', // ESLint 9 互換性問題を回避
      '@typescript-eslint/no-unused-vars': 'off', // ESLint 9 互換性問題を回避
    },
  },
  {
    ignores: ['src/types/supabase.ts'], // Supabase自動生成型定義を無視
  },
];

export default eslintConfig;
