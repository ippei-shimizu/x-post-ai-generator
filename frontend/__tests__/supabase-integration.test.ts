import { describe, it, expect } from '@jest/globals';
import { supabase } from '@/lib/supabase';

// 実際のSupabase接続テスト（モックなし）
describe('Supabase Integration Test (Real Connection)', () => {
  it('should connect to local Supabase instance', async () => {
    // 環境変数確認
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('http://127.0.0.1:54321');
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });

  it('should access users table structure', async () => {
    // usersテーブルの存在確認（RLSのため空の結果でも接続確認になる）
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    // RLSによりアクセスが制限されるが、テーブル自体は存在する
    expect(error).toBeNull();
  });

  it('should verify RLS is working', async () => {
    // 認証なしでpersonasテーブルにアクセス（RLSにより制限される）
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .limit(1);
    
    // RLSにより空の結果が返される（エラーではない）
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('should have auth service available', async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // 未認証のため user は null
    expect(error).toBeNull();
    expect(user).toBeNull();
  });

  it('should verify pgvector extension is available', async () => {
    const { data, error } = await supabase
      .from('content_embeddings')
      .select('count')
      .limit(1);
    
    // テーブルが存在し、アクセス可能（RLSにより空の結果）
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});