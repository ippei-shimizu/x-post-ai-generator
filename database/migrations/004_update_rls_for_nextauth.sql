-- ===================================
-- NextAuth.js 対応 RLS ポリシー更新
-- ===================================

-- NextAuth.js 統合関数を追加
\i database/functions/set_user_context.sql

-- ===================================
-- 既存テーブルのRLSポリシーを NextAuth対応に更新
-- ===================================

-- 1. users テーブル（既存のRLS削除 → NextAuth対応に更新）
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

-- NextAuth.js 対応 users テーブル RLS
CREATE POLICY "nextauth_users_select" ON users
    FOR SELECT 
    USING (current_user_id() = id);

CREATE POLICY "nextauth_users_insert" ON users
    FOR INSERT 
    WITH CHECK (current_user_id() = id);

CREATE POLICY "nextauth_users_update" ON users
    FOR UPDATE 
    USING (current_user_id() = id);

CREATE POLICY "nextauth_users_delete" ON users
    FOR DELETE 
    USING (current_user_id() = id);

-- 2. personas テーブル
DROP POLICY IF EXISTS "Users can view own personas" ON personas;
DROP POLICY IF EXISTS "Users can insert own personas" ON personas;
DROP POLICY IF EXISTS "Users can update own personas" ON personas;
DROP POLICY IF EXISTS "Users can delete own personas" ON personas;

CREATE POLICY "nextauth_personas_select" ON personas
    FOR SELECT 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_personas_insert" ON personas
    FOR INSERT 
    WITH CHECK (current_user_id() = user_id);

CREATE POLICY "nextauth_personas_update" ON personas
    FOR UPDATE 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_personas_delete" ON personas
    FOR DELETE 
    USING (current_user_id() = user_id);

-- 3. generated_posts テーブル
DROP POLICY IF EXISTS "Users can view own posts" ON generated_posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON generated_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON generated_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON generated_posts;

CREATE POLICY "nextauth_posts_select" ON generated_posts
    FOR SELECT 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_posts_insert" ON generated_posts
    FOR INSERT 
    WITH CHECK (current_user_id() = user_id);

CREATE POLICY "nextauth_posts_update" ON generated_posts
    FOR UPDATE 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_posts_delete" ON generated_posts
    FOR DELETE 
    USING (current_user_id() = user_id);

-- 4. content_sources テーブル
DROP POLICY IF EXISTS "Users can view own sources" ON content_sources;
DROP POLICY IF EXISTS "Users can insert own sources" ON content_sources;
DROP POLICY IF EXISTS "Users can update own sources" ON content_sources;
DROP POLICY IF EXISTS "Users can delete own sources" ON content_sources;

CREATE POLICY "nextauth_sources_select" ON content_sources
    FOR SELECT 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_sources_insert" ON content_sources
    FOR INSERT 
    WITH CHECK (current_user_id() = user_id);

CREATE POLICY "nextauth_sources_update" ON content_sources
    FOR UPDATE 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_sources_delete" ON content_sources
    FOR DELETE 
    USING (current_user_id() = user_id);

-- 5. raw_content テーブル
DROP POLICY IF EXISTS "Users can view own content" ON raw_content;
DROP POLICY IF EXISTS "Users can insert own content" ON raw_content;
DROP POLICY IF EXISTS "Users can update own content" ON raw_content;
DROP POLICY IF EXISTS "Users can delete own content" ON raw_content;

CREATE POLICY "nextauth_raw_content_select" ON raw_content
    FOR SELECT 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_raw_content_insert" ON raw_content
    FOR INSERT 
    WITH CHECK (current_user_id() = user_id);

CREATE POLICY "nextauth_raw_content_update" ON raw_content
    FOR UPDATE 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_raw_content_delete" ON raw_content
    FOR DELETE 
    USING (current_user_id() = user_id);

-- 6. content_chunks テーブル
DROP POLICY IF EXISTS "Users can view own chunks" ON content_chunks;
DROP POLICY IF EXISTS "Users can insert own chunks" ON content_chunks;
DROP POLICY IF EXISTS "Users can update own chunks" ON content_chunks;
DROP POLICY IF EXISTS "Users can delete own chunks" ON content_chunks;

CREATE POLICY "nextauth_chunks_select" ON content_chunks
    FOR SELECT 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_chunks_insert" ON content_chunks
    FOR INSERT 
    WITH CHECK (current_user_id() = user_id);

CREATE POLICY "nextauth_chunks_update" ON content_chunks
    FOR UPDATE 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_chunks_delete" ON content_chunks
    FOR DELETE 
    USING (current_user_id() = user_id);

-- 7. content_embeddings テーブル（ユーザー固有RAGシステム）
DROP POLICY IF EXISTS "Users can view own embeddings" ON content_embeddings;
DROP POLICY IF EXISTS "Users can insert own embeddings" ON content_embeddings;
DROP POLICY IF EXISTS "Users can update own embeddings" ON content_embeddings;
DROP POLICY IF EXISTS "Users can delete own embeddings" ON content_embeddings;

CREATE POLICY "nextauth_embeddings_select" ON content_embeddings
    FOR SELECT 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_embeddings_insert" ON content_embeddings
    FOR INSERT 
    WITH CHECK (current_user_id() = user_id);

CREATE POLICY "nextauth_embeddings_update" ON content_embeddings
    FOR UPDATE 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_embeddings_delete" ON content_embeddings
    FOR DELETE 
    USING (current_user_id() = user_id);

-- 8. user_settings テーブル
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;

CREATE POLICY "nextauth_settings_select" ON user_settings
    FOR SELECT 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_settings_insert" ON user_settings
    FOR INSERT 
    WITH CHECK (current_user_id() = user_id);

CREATE POLICY "nextauth_settings_update" ON user_settings
    FOR UPDATE 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_settings_delete" ON user_settings
    FOR DELETE 
    USING (current_user_id() = user_id);

-- 9. api_usage_logs テーブル
DROP POLICY IF EXISTS "Users can view own logs" ON api_usage_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON api_usage_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON api_usage_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON api_usage_logs;

CREATE POLICY "nextauth_logs_select" ON api_usage_logs
    FOR SELECT 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_logs_insert" ON api_usage_logs
    FOR INSERT 
    WITH CHECK (current_user_id() = user_id);

CREATE POLICY "nextauth_logs_update" ON api_usage_logs
    FOR UPDATE 
    USING (current_user_id() = user_id);

CREATE POLICY "nextauth_logs_delete" ON api_usage_logs
    FOR DELETE 
    USING (current_user_id() = user_id);

-- ===================================
-- 特別なポリシー: 公開データアクセス
-- ===================================

-- 未認証ユーザーでも読み取り可能なテーブル（必要に応じて）
-- 例: サイト紹介用の匿名統計など

-- 例: 匿名での統計確認（個人情報除外）
CREATE POLICY "allow_anonymous_stats" ON users
    FOR SELECT 
    USING (false); -- 現在は無効化、必要に応じて条件追加

-- ===================================
-- ユーザー固有検索関数の NextAuth 対応
-- ===================================

-- search_user_content 関数を NextAuth 対応に更新
DROP FUNCTION IF EXISTS search_user_content(uuid, vector, float, int);

CREATE OR REPLACE FUNCTION search_user_content(
    target_user_id uuid,
    query_embedding vector(1536),
    similarity_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    chunk_text text,
    similarity float,
    metadata jsonb,
    created_at timestamp with time zone
) AS $$
BEGIN
    -- NextAuth.js 認証チェック
    IF NOT is_authenticated() THEN
        RAISE EXCEPTION 'Authentication required for content search';
    END IF;
    
    -- ユーザーアクセス権限チェック
    IF NOT can_access_user_data(target_user_id) THEN
        RAISE EXCEPTION 'Access denied: Cannot search other users content';
    END IF;

    -- ユーザー固有ベクトル検索実行
    RETURN QUERY
    SELECT 
        ce.id,
        cc.chunk_text,
        (ce.embedding <=> query_embedding) as similarity,
        rc.metadata,
        ce.created_at
    FROM content_embeddings ce
    JOIN content_chunks cc ON ce.chunk_id = cc.id
    JOIN raw_content rc ON cc.raw_content_id = rc.id
    WHERE 
        ce.user_id = target_user_id
        AND (ce.embedding <=> query_embedding) < (1 - similarity_threshold)
    ORDER BY ce.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数権限設定
GRANT EXECUTE ON FUNCTION search_user_content(uuid, vector, float, int) TO authenticated;

-- ===================================
-- 完了ログ
-- ===================================

DO $$
BEGIN
    RAISE NOTICE 'NextAuth.js RLS ポリシー更新完了';
    RAISE NOTICE '- 全テーブルで current_user_id() 関数を使用';
    RAISE NOTICE '- ユーザー固有検索関数を NextAuth 対応に更新';
    RAISE NOTICE '- 認証必須アクセス制御を強化';
END $$;