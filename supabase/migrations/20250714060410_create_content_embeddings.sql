-- ===================================
-- Issue #26: ユーザー分離ベクトルテーブル設計
-- ===================================
-- content_embeddingsテーブルの詳細設計
-- ユーザーごとに完全分離されたベクトル埋め込みテーブル
-- Row Level Securityによる保護を実装

-- ===================================
-- 拡張機能確認（pgvectorが必須）
-- ===================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ===================================
-- content_embeddingsテーブル作成
-- ===================================
CREATE TABLE IF NOT EXISTS content_embeddings (
    -- 主キー
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- ユーザー分離のための外部キー（必須）
    user_id UUID NOT NULL,
    
    -- チャンクテーブルへの参照（オプション - 将来の拡張用）
    chunk_id UUID,
    
    -- 埋め込みベクトル（1536次元 - OpenAI text-embedding-ada-002互換）
    embedding vector(1536) NOT NULL,
    
    -- 埋め込み元のテキスト内容（検索結果表示用）
    content_text TEXT NOT NULL,
    
    -- ソースの種類（github, rss, web, manual等）
    source_type VARCHAR(50) NOT NULL DEFAULT 'manual',
    
    -- ソースID（content_sourcesテーブルへの参照）
    source_id UUID,
    
    -- 使用された埋め込みモデル名
    model_name VARCHAR(100) NOT NULL DEFAULT 'text-embedding-ada-002',
    
    -- 類似度検索時の閾値設定（ユーザー別カスタマイズ可能）
    similarity_threshold FLOAT DEFAULT 0.7,
    
    -- メタデータ（追加情報をJSONBで柔軟に保存）
    metadata JSONB DEFAULT '{}',
    
    -- アクティブフラグ（論理削除用）
    is_active BOOLEAN DEFAULT true,
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 30日自動削除用の期限
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- 外部キー制約
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    
    -- インデックス用のチェック制約
    CONSTRAINT check_embedding_dimension CHECK (vector_dims(embedding) = 1536),
    CONSTRAINT check_content_not_empty CHECK (length(content_text) > 0),
    CONSTRAINT check_source_type CHECK (source_type IN ('github', 'rss', 'web', 'manual', 'api', 'test'))
);

-- ===================================
-- インデックス作成
-- ===================================

-- 1. user_id単独インデックス（RLS高速化）
CREATE INDEX idx_content_embeddings_user_id 
ON content_embeddings(user_id);

-- 2. user_id + is_active複合インデックス（アクティブレコード検索高速化）
CREATE INDEX idx_content_embeddings_user_active 
ON content_embeddings(user_id, is_active);

-- 3. user_id + source_type複合インデックス（ソースタイプ別検索）
CREATE INDEX idx_content_embeddings_user_source 
ON content_embeddings(user_id, source_type);

-- 4. user_id + created_at複合インデックス（時系列検索）
CREATE INDEX idx_content_embeddings_user_created 
ON content_embeddings(user_id, created_at DESC);

-- 5. expires_at単独インデックス（期限切れレコード削除用）
CREATE INDEX idx_content_embeddings_expires 
ON content_embeddings(expires_at) 
WHERE expires_at IS NOT NULL;

-- 6. ベクトル類似度検索用IVFFlatインデックス（コサイン距離）
-- 注意：データが100件以上ある場合に作成することを推奨
-- CREATE INDEX idx_content_embeddings_vector_cosine 
-- ON content_embeddings 
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- ===================================
-- Row Level Security (RLS) 設定
-- ===================================

-- RLS有効化
ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;

-- SELECTポリシー：ユーザーは自分のデータのみ参照可能
CREATE POLICY select_own_embeddings ON content_embeddings
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- INSERTポリシー：ユーザーは自分のデータのみ作成可能
CREATE POLICY insert_own_embeddings ON content_embeddings
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- UPDATEポリシー：ユーザーは自分のデータのみ更新可能
CREATE POLICY update_own_embeddings ON content_embeddings
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETEポリシー：ユーザーは自分のデータのみ削除可能
CREATE POLICY delete_own_embeddings ON content_embeddings
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ===================================
-- トリガー関数
-- ===================================

-- 更新時刻自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER update_content_embeddings_updated_at 
    BEFORE UPDATE ON content_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 期限切れレコード自動削除関数
-- ===================================

CREATE OR REPLACE FUNCTION cleanup_expired_embeddings()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM content_embeddings
    WHERE expires_at < NOW()
    AND is_active = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % expired embedding records', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- ベクトル類似度検索関数
-- ===================================

-- ユーザー固有のベクトル類似度検索
CREATE OR REPLACE FUNCTION search_user_embeddings(
    target_user_id UUID,
    query_vector vector(1536),
    similarity_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    content_text TEXT,
    similarity FLOAT,
    source_type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- セキュリティチェック：呼び出し元ユーザーのデータのみ検索可能
    IF target_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot search other user embeddings';
    END IF;
    
    RETURN QUERY
    SELECT 
        ce.id,
        ce.content_text,
        1 - (ce.embedding <=> query_vector) AS similarity,
        ce.source_type,
        ce.metadata,
        ce.created_at
    FROM content_embeddings ce
    WHERE ce.user_id = target_user_id
    AND ce.is_active = true
    AND (1 - (ce.embedding <=> query_vector)) >= similarity_threshold
    ORDER BY ce.embedding <=> query_vector
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- ユーザー別埋め込み統計情報取得関数
-- ===================================

CREATE OR REPLACE FUNCTION get_user_embeddings_stats(
    target_user_id UUID
)
RETURNS TABLE(
    total_embeddings BIGINT,
    active_embeddings BIGINT,
    source_breakdown JSONB,
    oldest_embedding TIMESTAMP WITH TIME ZONE,
    newest_embedding TIMESTAMP WITH TIME ZONE,
    expiring_soon_count BIGINT
) AS $$
BEGIN
    -- セキュリティチェック
    IF target_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot view other user statistics';
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_embeddings,
        COUNT(*) FILTER (WHERE is_active = true)::BIGINT AS active_embeddings,
        jsonb_object_agg(
            source_type, 
            source_count
        ) AS source_breakdown,
        MIN(created_at) AS oldest_embedding,
        MAX(created_at) AS newest_embedding,
        COUNT(*) FILTER (
            WHERE expires_at <= NOW() + INTERVAL '7 days' 
            AND is_active = true
        )::BIGINT AS expiring_soon_count
    FROM (
        SELECT 
            source_type,
            COUNT(*) AS source_count,
            created_at,
            expires_at,
            is_active
        FROM content_embeddings
        WHERE user_id = target_user_id
        GROUP BY source_type, created_at, expires_at, is_active
    ) AS stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- パフォーマンス最適化のためのヘルパー関数
-- ===================================

-- ベクトル正規化関数（コサイン類似度計算の前処理）
CREATE OR REPLACE FUNCTION normalize_vector(v vector(1536))
RETURNS vector(1536) AS $$
DECLARE
    magnitude FLOAT;
BEGIN
    magnitude := sqrt(vector_norm(v));
    IF magnitude = 0 THEN
        RETURN v;
    END IF;
    RETURN v / magnitude;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===================================
-- アクセスログテーブル（監査用）
-- ===================================

CREATE TABLE IF NOT EXISTS embedding_access_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    embedding_id UUID,
    query_vector_hash VARCHAR(64),
    result_count INTEGER,
    execution_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_log_user_id FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- アクセスログ用インデックス
CREATE INDEX idx_embedding_access_logs_user_created 
ON embedding_access_logs(user_id, created_at DESC);

-- ===================================
-- 開発・テスト用ヘルパー関数
-- ===================================

-- テスト用埋め込みデータ作成
CREATE OR REPLACE FUNCTION create_test_embedding(
    test_user_id UUID,
    test_content TEXT,
    test_source_type VARCHAR(50) DEFAULT 'test'
)
RETURNS UUID AS $$
DECLARE
    new_embedding_id UUID;
    test_vector vector(1536);
BEGIN
    -- セキュリティチェック
    IF test_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot create embeddings for other users';
    END IF;
    
    -- ランダムなテストベクトル生成（実際の環境ではOpenAI APIを使用）
    test_vector := array_fill(random()::real, ARRAY[1536])::vector(1536);
    
    INSERT INTO content_embeddings (
        user_id,
        embedding,
        content_text,
        source_type,
        metadata
    ) VALUES (
        test_user_id,
        test_vector,
        test_content,
        test_source_type,
        jsonb_build_object('test', true, 'created_at', NOW())
    ) RETURNING id INTO new_embedding_id;
    
    RETURN new_embedding_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- 権限設定
-- ===================================

-- 認証済みユーザーに関数の実行権限を付与
GRANT EXECUTE ON FUNCTION search_user_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_embeddings_stats TO authenticated;
GRANT EXECUTE ON FUNCTION normalize_vector TO authenticated;
GRANT EXECUTE ON FUNCTION create_test_embedding TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_embeddings TO authenticated;

-- サービスロールには全権限を付与
GRANT ALL ON TABLE content_embeddings TO service_role;
GRANT ALL ON TABLE embedding_access_logs TO service_role;

-- ===================================
-- マイグレーション情報
-- ===================================

COMMENT ON TABLE content_embeddings IS 'ユーザー分離型ベクトル埋め込みテーブル（Issue #26）';
COMMENT ON COLUMN content_embeddings.user_id IS 'ユーザーID（RLS分離キー）';
COMMENT ON COLUMN content_embeddings.embedding IS '1536次元ベクトル埋め込み（OpenAI互換）';
COMMENT ON COLUMN content_embeddings.similarity_threshold IS 'ユーザー別類似度閾値設定';
COMMENT ON COLUMN content_embeddings.expires_at IS '30日自動削除期限';

-- ===================================
-- 完了ログ
-- ===================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'content_embeddingsテーブル作成完了';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ テーブル作成: content_embeddings';
    RAISE NOTICE '✓ インデックス: user_id, source_type, created_at, expires_at';
    RAISE NOTICE '✓ RLSポリシー: SELECT, INSERT, UPDATE, DELETE';
    RAISE NOTICE '✓ ベクトル検索関数: search_user_embeddings';
    RAISE NOTICE '✓ 統計情報関数: get_user_embeddings_stats';
    RAISE NOTICE '✓ 自動削除対応: 30日期限';
    RAISE NOTICE '✓ アクセスログ: embedding_access_logs';
    RAISE NOTICE '========================================';
END $$;
