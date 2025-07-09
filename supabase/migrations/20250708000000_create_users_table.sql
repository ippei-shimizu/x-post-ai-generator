-- Users テーブル作成マイグレーション
-- Supabase Auth と連携し、RLS による完全なデータ分離を実現

-- users テーブル作成
CREATE TABLE IF NOT EXISTS public.users (
  -- Supabase Auth のユーザーIDを主キーとして使用
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 基本情報
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  
  -- Google OAuth 情報
  google_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- タイムスタンプ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- 制約
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_-]{3,50}$' OR username IS NULL)
);

-- インデックス作成（検索性能向上）
CREATE INDEX users_email_idx ON public.users(email);
CREATE INDEX users_google_id_idx ON public.users(google_id);
CREATE INDEX users_username_idx ON public.users(username) WHERE username IS NOT NULL;

-- updated_at 自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 自動更新トリガー
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー: ユーザーは自分のデータのみ閲覧可能
CREATE POLICY "Users can view own data" 
  ON public.users 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

-- RLS ポリシー: ユーザーは自分のデータのみ更新可能
CREATE POLICY "Users can update own data" 
  ON public.users 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS ポリシー: ユーザーは自分のデータのみ作成可能（IDが一致する場合のみ）
CREATE POLICY "Users can insert own data" 
  ON public.users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- RLS ポリシー: ユーザーは自分のデータのみ削除可能
CREATE POLICY "Users can delete own data" 
  ON public.users 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = id);

-- Supabase Auth 連携トリガー関数
-- auth.users にユーザーが作成されたら public.users にも自動作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  google_id_value TEXT;
  display_name_value TEXT;
  avatar_url_value TEXT;
BEGIN
  -- raw_user_meta_data からGoogle情報を抽出
  google_id_value := NEW.raw_user_meta_data->>'sub';
  display_name_value := NEW.raw_user_meta_data->>'name';
  avatar_url_value := NEW.raw_user_meta_data->>'avatar_url';
  
  -- Google IDが取得できない場合は、別の場所から取得を試みる
  IF google_id_value IS NULL THEN
    google_id_value := NEW.raw_app_meta_data->'provider_id';
  END IF;
  
  -- それでも取得できない場合は、一時的にIDを使用
  IF google_id_value IS NULL THEN
    google_id_value := NEW.id::TEXT;
  END IF;
  
  -- public.users にレコードを作成
  INSERT INTO public.users (
    id,
    email,
    display_name,
    avatar_url,
    google_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    display_name_value,
    avatar_url_value,
    google_id_value,
    NEW.created_at,
    NEW.updated_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users への INSERT トリガー
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Supabase Auth 更新時の同期トリガー関数
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
DECLARE
  display_name_value TEXT;
  avatar_url_value TEXT;
BEGIN
  -- raw_user_meta_data から情報を抽出
  display_name_value := NEW.raw_user_meta_data->>'name';
  avatar_url_value := NEW.raw_user_meta_data->>'avatar_url';
  
  -- public.users のレコードを更新
  UPDATE public.users
  SET 
    email = NEW.email,
    display_name = COALESCE(display_name_value, display_name),
    avatar_url = COALESCE(avatar_url_value, avatar_url),
    updated_at = NEW.updated_at
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users への UPDATE トリガー
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();

-- コメント追加（ドキュメンテーション）
COMMENT ON TABLE public.users IS 'ユーザー情報を管理するテーブル。Supabase Authと連携し、RLSによる完全なデータ分離を実現';
COMMENT ON COLUMN public.users.id IS 'Supabase AuthのユーザーID（UUID）';
COMMENT ON COLUMN public.users.email IS 'ユーザーのメールアドレス（一意制約）';
COMMENT ON COLUMN public.users.username IS 'ユーザー名（オプション、一意制約）';
COMMENT ON COLUMN public.users.display_name IS '表示名';
COMMENT ON COLUMN public.users.avatar_url IS 'プロフィール画像のURL';
COMMENT ON COLUMN public.users.google_id IS 'Google OAuth ID（一意制約）';
COMMENT ON COLUMN public.users.created_at IS 'レコード作成日時';
COMMENT ON COLUMN public.users.updated_at IS 'レコード更新日時';

-- 権限設定
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon; -- 匿名ユーザーはRLSにより実際にはアクセスできない