-- ===================================
-- NextAuth.js テーブル作成
-- ===================================
-- NextAuth.js Supabase Adapter用のテーブルを作成
-- 詳細: https://authjs.dev/reference/adapter/supabase

-- 1. accounts テーブル（OAuth アカウント情報）
CREATE TABLE IF NOT EXISTS accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type varchar(255) NOT NULL,
    provider varchar(255) NOT NULL,
    provider_account_id varchar(255) NOT NULL,
    refresh_token text,
    access_token text,
    expires_at bigint,
    id_token text,
    scope text,
    session_state text,
    token_type text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(provider, provider_account_id)
);

-- 2. sessions テーブル（セッション情報）
CREATE TABLE IF NOT EXISTS sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token varchar(255) UNIQUE NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. users テーブル（NextAuth.js用拡張）
-- 既存のusersテーブルと競合しないよう、auth_users として作成
CREATE TABLE IF NOT EXISTS auth_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    google_id varchar(255) UNIQUE, -- Google OAuth の数値ID
    name varchar(255),
    email varchar(255) UNIQUE,
    email_verified timestamp with time zone,
    image text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. verification_tokens テーブル（メール認証用）
CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- ===================================
-- インデックス作成（パフォーマンス最適化）
-- ===================================

-- accounts テーブル用インデックス
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);
CREATE INDEX IF NOT EXISTS accounts_provider_idx ON accounts(provider);
CREATE INDEX IF NOT EXISTS accounts_provider_account_id_idx ON accounts(provider_account_id);

-- sessions テーブル用インデックス
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_session_token_idx ON sessions(session_token);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires);

-- auth_users テーブル用インデックス
CREATE INDEX IF NOT EXISTS auth_users_email_idx ON auth_users(email);
CREATE INDEX IF NOT EXISTS auth_users_google_id_idx ON auth_users(google_id);

-- verification_tokens テーブル用インデックス
CREATE INDEX IF NOT EXISTS verification_tokens_token_idx ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS verification_tokens_expires_idx ON verification_tokens(expires);

-- ===================================
-- Row Level Security (RLS) 設定
-- ===================================

-- RLS 有効化
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- accounts テーブル RLS ポリシー
CREATE POLICY "Users can view own accounts"
    ON accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
    ON accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
    ON accounts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
    ON accounts FOR DELETE
    USING (auth.uid() = user_id);

-- sessions テーブル RLS ポリシー
CREATE POLICY "Users can view own sessions"
    ON sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
    ON sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
    ON sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
    ON sessions FOR DELETE
    USING (auth.uid() = user_id);

-- auth_users テーブル RLS ポリシー
CREATE POLICY "Users can view own profile"
    ON auth_users FOR SELECT
    USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile"
    ON auth_users FOR INSERT
    WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
    ON auth_users FOR UPDATE
    USING (auth.uid()::text = id::text);

-- verification_tokens は一時的なデータのため制限を緩く設定
CREATE POLICY "Anyone can insert verification tokens"
    ON verification_tokens FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can select verification tokens"
    ON verification_tokens FOR SELECT
    USING (true);

-- ===================================
-- トリガー関数（updated_at自動更新）
-- ===================================

-- updated_at 自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー設定
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_auth_users_updated_at
    BEFORE UPDATE ON auth_users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ===================================
-- NextAuth.js統合のためのビュー作成
-- ===================================

-- NextAuth.js が期待する 'users' ビューを作成
-- これにより既存の users テーブルと競合せずに統合可能
CREATE OR REPLACE VIEW nextauth_users AS
SELECT 
    id,
    name,
    email,
    email_verified,
    image,
    created_at,
    updated_at
FROM auth_users;

-- ===================================
-- 一般ユーザーへの権限付与
-- ===================================

-- NextAuth.js が使用するテーブルへの適切な権限を付与
GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_users TO authenticated;
GRANT SELECT, INSERT, DELETE ON verification_tokens TO authenticated;

-- シーケンスへの権限付与（UUIDを使用するため不要だが、念のため）
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===================================
-- コメント追加（ドキュメント化）
-- ===================================

COMMENT ON TABLE accounts IS 'NextAuth.js OAuth アカウント情報';
COMMENT ON TABLE sessions IS 'NextAuth.js セッション管理';
COMMENT ON TABLE auth_users IS 'NextAuth.js ユーザー情報（認証用）';
COMMENT ON TABLE verification_tokens IS 'NextAuth.js メール認証トークン';

COMMENT ON COLUMN accounts.provider IS 'OAuth プロバイダー (google, github等)';
COMMENT ON COLUMN accounts.provider_account_id IS 'プロバイダー固有のユーザーID';
COMMENT ON COLUMN sessions.session_token IS 'セッション識別用トークン';
COMMENT ON COLUMN sessions.expires IS 'セッション有効期限';

-- ===================================
-- 完了ログ
-- ===================================

DO $$
BEGIN
    RAISE NOTICE 'NextAuth.js テーブル作成完了: accounts, sessions, auth_users, verification_tokens';
    RAISE NOTICE 'RLS ポリシー設定完了: ユーザー別データ分離';
    RAISE NOTICE 'インデックス作成完了: パフォーマンス最適化';
END $$;