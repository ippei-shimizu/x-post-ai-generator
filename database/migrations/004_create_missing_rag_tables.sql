-- ===================================
-- Issue #27: 未実装RAGテーブル作成とRLSポリシー実装
-- ===================================
-- raw_content と content_chunks テーブルの作成
-- 完全なユーザーデータ分離RLSポリシーの実装

-- ===================================
-- 1. raw_content テーブル作成
-- ===================================

CREATE TABLE IF NOT EXISTS raw_content (
    -- 主キー
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- ユーザー分離のための外部キー（必須）
    user_id UUID NOT NULL,
    
    -- ソース情報
    source_id UUID,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT,
    
    -- コンテンツハッシュ（重複防止用）
    content_hash VARCHAR(64),
    
    -- メタデータ
    metadata JSONB DEFAULT '{}',
    
    -- 自動削除用の期限（30日）
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- アクティブフラグ
    is_active BOOLEAN DEFAULT true,
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 外部キー制約
    CONSTRAINT fk_raw_content_user_id FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_raw_content_source_id FOREIGN KEY (source_id) 
        REFERENCES content_sources(id) ON DELETE SET NULL,
    
    -- チェック制約
    CONSTRAINT check_content_not_empty CHECK (length(content) > 0),
    CONSTRAINT check_title_not_empty CHECK (length(title) > 0)
);

-- raw_content テーブルインデックス
CREATE INDEX IF NOT EXISTS idx_raw_content_user_id ON raw_content(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_content_user_active ON raw_content(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_raw_content_expires ON raw_content(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_raw_content_hash ON raw_content(content_hash) WHERE content_hash IS NOT NULL;

-- ===================================
-- 2. content_chunks テーブル作成
-- ===================================

CREATE TABLE IF NOT EXISTS content_chunks (
    -- 主キー
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- ユーザー分離のための外部キー（必須）
    user_id UUID NOT NULL,
    
    -- 元コンテンツへの参照
    raw_content_id UUID NOT NULL,
    
    -- チャンク情報
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    token_count INTEGER,
    
    -- 隣接チャンクとのオーバーラップ情報
    overlap_with_previous INTEGER DEFAULT 0,
    overlap_with_next INTEGER DEFAULT 0,
    
    -- メタデータ
    metadata JSONB DEFAULT '{}',
    
    -- アクティブフラグ
    is_active BOOLEAN DEFAULT true,
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 外部キー制約
    CONSTRAINT fk_content_chunks_user_id FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_content_chunks_raw_content_id FOREIGN KEY (raw_content_id) 
        REFERENCES raw_content(id) ON DELETE CASCADE,
    
    -- チェック制約
    CONSTRAINT check_chunk_text_not_empty CHECK (length(chunk_text) > 0),
    CONSTRAINT check_chunk_index_positive CHECK (chunk_index >= 0),
    CONSTRAINT check_token_count_positive CHECK (token_count IS NULL OR token_count > 0)
);

-- content_chunks テーブルインデックス
CREATE INDEX IF NOT EXISTS idx_content_chunks_user_id ON content_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_content_chunks_user_active ON content_chunks(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_content_chunks_raw_content ON content_chunks(raw_content_id);
CREATE INDEX IF NOT EXISTS idx_content_chunks_user_raw_content ON content_chunks(user_id, raw_content_id);
CREATE INDEX IF NOT EXISTS idx_content_chunks_index ON content_chunks(raw_content_id, chunk_index);

-- ===================================
-- 3. updated_at自動更新トリガー
-- ===================================

-- raw_content テーブル用トリガー
CREATE TRIGGER update_raw_content_updated_at 
    BEFORE UPDATE ON raw_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- content_chunks テーブル用トリガー
CREATE TRIGGER update_content_chunks_updated_at 
    BEFORE UPDATE ON content_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 4. Row Level Security (RLS) 有効化
-- ===================================

-- raw_content テーブルRLS有効化
ALTER TABLE raw_content ENABLE ROW LEVEL SECURITY;

-- content_chunks テーブルRLS有効化
ALTER TABLE content_chunks ENABLE ROW LEVEL SECURITY;

-- ===================================
-- 5. raw_content テーブル RLSポリシー実装
-- ===================================

-- SELECT ポリシー：ユーザーは自分のデータのみ閲覧可能
CREATE POLICY select_own_raw_content ON raw_content
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- INSERT ポリシー：ユーザーは自分のデータのみ作成可能
CREATE POLICY insert_own_raw_content ON raw_content
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- UPDATE ポリシー：ユーザーは自分のデータのみ更新可能
CREATE POLICY update_own_raw_content ON raw_content
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE ポリシー：ユーザーは自分のデータのみ削除可能
CREATE POLICY delete_own_raw_content ON raw_content
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ===================================
-- 6. content_chunks テーブル RLSポリシー実装
-- ===================================

-- SELECT ポリシー：ユーザーは自分のデータのみ閲覧可能
CREATE POLICY select_own_content_chunks ON content_chunks
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- INSERT ポリシー：ユーザーは自分のデータのみ作成可能
CREATE POLICY insert_own_content_chunks ON content_chunks
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- UPDATE ポリシー：ユーザーは自分のデータのみ更新可能
CREATE POLICY update_own_content_chunks ON content_chunks
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE ポリシー：ユーザーは自分のデータのみ削除可能
CREATE POLICY delete_own_content_chunks ON content_chunks
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ===================================
-- 7. 管理者権限・アプリケーション権限の分離
-- ===================================

-- サービスロール（管理者）には全権限付与
GRANT ALL ON TABLE raw_content TO service_role;
GRANT ALL ON TABLE content_chunks TO service_role;

-- 認証済みユーザーには基本権限のみ
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE raw_content TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE content_chunks TO authenticated;

-- ===================================
-- 8. 期限切れコンテンツ自動削除関数
-- ===================================

CREATE OR REPLACE FUNCTION cleanup_expired_raw_content()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM raw_content
    WHERE expires_at < NOW()
    AND is_active = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % expired raw content records', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- サービスロールに実行権限付与
GRANT EXECUTE ON FUNCTION cleanup_expired_raw_content TO service_role;

-- ===================================
-- 9. ユーザー別RAGデータ統計関数
-- ===================================

CREATE OR REPLACE FUNCTION get_user_rag_data_stats(
    target_user_id UUID
)
RETURNS TABLE(
    total_raw_content BIGINT,
    total_chunks BIGINT,
    total_embeddings BIGINT,
    avg_chunks_per_content REAL,
    total_tokens BIGINT,
    data_size_mb REAL
) AS $$
BEGIN
    -- セキュリティチェック：呼び出し元ユーザーのデータのみ
    IF auth.uid() IS NOT NULL AND target_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot view other user RAG statistics';
    END IF;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM raw_content WHERE user_id = target_user_id AND is_active = true)::BIGINT,
        (SELECT COUNT(*) FROM content_chunks WHERE user_id = target_user_id AND is_active = true)::BIGINT,
        (SELECT COUNT(*) FROM content_embeddings WHERE user_id = target_user_id AND is_active = true)::BIGINT,
        CASE 
            WHEN (SELECT COUNT(*) FROM raw_content WHERE user_id = target_user_id AND is_active = true) > 0 THEN
                (SELECT COUNT(*) FROM content_chunks WHERE user_id = target_user_id AND is_active = true)::REAL / 
                (SELECT COUNT(*) FROM raw_content WHERE user_id = target_user_id AND is_active = true)::REAL
            ELSE 0.0
        END,
        COALESCE((SELECT SUM(token_count) FROM content_chunks WHERE user_id = target_user_id AND is_active = true), 0)::BIGINT,
        (
            COALESCE((SELECT SUM(octet_length(content)) FROM raw_content WHERE user_id = target_user_id AND is_active = true), 0) +
            COALESCE((SELECT SUM(octet_length(chunk_text)) FROM content_chunks WHERE user_id = target_user_id AND is_active = true), 0)
        )::REAL / 1024.0 / 1024.0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 認証済みユーザーに実行権限付与
GRANT EXECUTE ON FUNCTION get_user_rag_data_stats TO authenticated;

-- ===================================
-- 10. テーブルコメント
-- ===================================

COMMENT ON TABLE raw_content IS 'ユーザー別生コンテンツテーブル（Issue #27 RLS対応）';
COMMENT ON TABLE content_chunks IS 'ユーザー別チャンク分割コンテンツテーブル（Issue #27 RLS対応）';

COMMENT ON COLUMN raw_content.user_id IS 'ユーザーID（RLS分離キー）';
COMMENT ON COLUMN raw_content.expires_at IS '30日自動削除期限';
COMMENT ON COLUMN content_chunks.user_id IS 'ユーザーID（RLS分離キー）';
COMMENT ON COLUMN content_chunks.chunk_index IS 'チャンク順序番号';

-- ===================================
-- 完了ログ
-- ===================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Issue #27: RAGテーブルRLSポリシー実装完了';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ raw_content テーブル作成完了';
    RAISE NOTICE '✓ content_chunks テーブル作成完了';
    RAISE NOTICE '✓ RLS有効化: raw_content, content_chunks';
    RAISE NOTICE '✓ RLSポリシー: SELECT/INSERT/UPDATE/DELETE各4つ';
    RAISE NOTICE '✓ 管理者権限とアプリケーション権限分離';
    RAISE NOTICE '✓ インデックス最適化完了';
    RAISE NOTICE '✓ 自動削除機能実装';
    RAISE NOTICE '✓ ユーザー統計機能実装';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Issue #27実装完了 - 全RAGテーブルRLS対応済み';
    RAISE NOTICE '========================================';
END $$;