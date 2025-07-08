-- ===================================
-- pgvector拡張セットアップとcontent_embeddingsテーブル作成
-- ===================================
-- ベクトル検索基盤の構築：OpenAI Embeddings (1536次元) 対応
-- Row Level Security (RLS) によりユーザーベクトルデータを完全分離

-- ===================================
-- pgvector拡張の有効化
-- ===================================

-- pgvector拡張を有効化（ベクトル検索のため）
CREATE EXTENSION IF NOT EXISTS vector;

-- 拡張確認ログ
DO $$
BEGIN
    RAISE NOTICE 'pgvector extension enabled - vector type and similarity operators available';
END $$;

-- ===================================
-- content_embeddings テーブル作成
-- ===================================

CREATE TABLE IF NOT EXISTS content_embeddings (
    -- 基本情報
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- コンテンツ情報
    content_text TEXT NOT NULL,
    content_hash VARCHAR(64),  -- 重複防止用ハッシュ
    source_type VARCHAR(50) NOT NULL DEFAULT 'unknown',
    source_url TEXT,
    
    -- ベクトル埋め込み（OpenAI text-embedding-ada-002 標準：1536次元）
    embedding vector(1536) NOT NULL,
    
    -- 埋め込みメタデータ
    model_name VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    embedding_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 検索制御
    similarity_threshold REAL DEFAULT 0.7,
    is_active BOOLEAN DEFAULT true,
    
    -- 追加メタデータ（JSONB）
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 外部キー制約
    CONSTRAINT fk_content_embeddings_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    -- 制約条件
    CONSTRAINT chk_content_embeddings_content_length CHECK (length(content_text) >= 1),
    CONSTRAINT chk_content_embeddings_similarity_threshold CHECK (
        similarity_threshold >= 0.0 AND similarity_threshold <= 1.0
    ),
    CONSTRAINT chk_content_embeddings_source_type CHECK (
        source_type IN ('github', 'rss', 'news', 'api', 'webhook', 'manual', 'test', 'unknown')
    )
);

-- ===================================
-- パフォーマンス最適化インデックス
-- ===================================

-- ユーザー別検索用の基本インデックス
CREATE INDEX IF NOT EXISTS idx_content_embeddings_user_id 
    ON content_embeddings(user_id);

-- アクティブなベクトルのユーザー別インデックス
CREATE INDEX IF NOT EXISTS idx_content_embeddings_user_active 
    ON content_embeddings(user_id, is_active) 
    WHERE is_active = true;

-- ソースタイプ別検索用
CREATE INDEX IF NOT EXISTS idx_content_embeddings_user_source 
    ON content_embeddings(user_id, source_type);

-- コンテンツハッシュでの重複チェック用
CREATE INDEX IF NOT EXISTS idx_content_embeddings_content_hash 
    ON content_embeddings(content_hash);

-- JSONB メタデータ検索用（GINインデックス）
CREATE INDEX IF NOT EXISTS idx_content_embeddings_metadata 
    ON content_embeddings USING GIN (metadata);

-- ===================================
-- ベクトル類似度検索用インデックス
-- ===================================

-- IVFFlat インデックス（高速近似検索用）
-- lists パラメータ: データ量に応じて調整（データ行数/1000が目安）
CREATE INDEX IF NOT EXISTS idx_content_embeddings_vector_ivfflat 
    ON content_embeddings 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

-- ユーザー別ベクトル検索最適化（部分インデックス）
CREATE INDEX IF NOT EXISTS idx_content_embeddings_user_vector_active 
    ON content_embeddings 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 50)
    WHERE is_active = true;

-- ===================================
-- Row Level Security (RLS) 設定
-- ===================================

-- RLS有効化
ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー: ユーザーは自分のベクトルデータのみ閲覧可能
CREATE POLICY "Users can view own embeddings" 
    ON content_embeddings 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- INSERT ポリシー: ユーザーは自分のuser_idでのみベクトル作成可能
CREATE POLICY "Users can insert own embeddings" 
    ON content_embeddings 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- UPDATE ポリシー: ユーザーは自分のベクトルデータのみ更新可能
CREATE POLICY "Users can update own embeddings" 
    ON content_embeddings 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- DELETE ポリシー: ユーザーは自分のベクトルデータのみ削除可能
CREATE POLICY "Users can delete own embeddings" 
    ON content_embeddings 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ===================================
-- ユーザー固有ベクトル検索関数
-- ===================================

-- ユーザー固有のベクトル類似度検索関数
CREATE OR REPLACE FUNCTION search_user_embeddings(
    target_user_id UUID,
    query_vector vector(1536),
    similarity_threshold REAL DEFAULT 0.7,
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    content_text TEXT,
    source_type VARCHAR(50),
    source_url TEXT,
    similarity REAL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- セキュリティチェック: 呼び出し元が対象ユーザーと一致することを確認
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Access denied: Cannot search other user embeddings';
    END IF;
    
    -- ユーザー固有のベクトル類似度検索を実行
    RETURN QUERY
    SELECT 
        e.id,
        e.content_text,
        e.source_type,
        e.source_url,
        (1 - (e.embedding <=> query_vector))::REAL as similarity,
        e.metadata,
        e.created_at
    FROM content_embeddings e
    WHERE e.user_id = target_user_id
        AND e.is_active = true
        AND (1 - (e.embedding <=> query_vector)) >= similarity_threshold
    ORDER BY e.embedding <=> query_vector
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- ベクトル埋め込み統計関数
-- ===================================

-- ユーザーのベクトル埋め込み統計を取得する関数
CREATE OR REPLACE FUNCTION get_user_embeddings_stats(target_user_id UUID)
RETURNS TABLE(
    total_embeddings INTEGER,
    active_embeddings INTEGER,
    by_source_type JSONB,
    avg_similarity_threshold REAL,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- セキュリティチェック: 呼び出し元が対象ユーザーと一致することを確認
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Access denied: Cannot access other user embedding statistics';
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_embeddings,
        COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_embeddings,
        jsonb_object_agg(
            source_type, 
            COUNT(*) FILTER (WHERE source_type = e.source_type)
        ) as by_source_type,
        AVG(similarity_threshold)::REAL as avg_similarity_threshold,
        MAX(updated_at) as last_activity
    FROM content_embeddings e
    WHERE e.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- ベクトル距離計算ヘルパー関数
-- ===================================

-- コサイン類似度計算（1 - コサイン距離）
CREATE OR REPLACE FUNCTION cosine_similarity(
    vector1 vector(1536),
    vector2 vector(1536)
)
RETURNS REAL AS $$
BEGIN
    RETURN 1 - (vector1 <=> vector2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ユークリッド距離計算
CREATE OR REPLACE FUNCTION euclidean_distance(
    vector1 vector(1536),
    vector2 vector(1536)
)
RETURNS REAL AS $$
BEGIN
    RETURN vector1 <-> vector2;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===================================
-- トリガー関数（updated_at自動更新）
-- ===================================

-- updated_at自動更新トリガー
CREATE TRIGGER update_content_embeddings_updated_at
    BEFORE UPDATE ON content_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 権限設定
-- ===================================

-- 認証済みユーザーに適切な権限を付与
GRANT SELECT, INSERT, UPDATE, DELETE ON content_embeddings TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ベクトル検索関数の実行権限
GRANT EXECUTE ON FUNCTION search_user_embeddings(UUID, vector(1536), REAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_embeddings_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cosine_similarity(vector(1536), vector(1536)) TO authenticated;
GRANT EXECUTE ON FUNCTION euclidean_distance(vector(1536), vector(1536)) TO authenticated;

-- ===================================
-- コメント追加（ドキュメント化）
-- ===================================

COMMENT ON TABLE content_embeddings IS 'ユーザー固有のベクトル埋め込みデータ（1536次元OpenAI標準）';
COMMENT ON COLUMN content_embeddings.user_id IS 'ベクトルデータ所有者のユーザーID（外部キー）';
COMMENT ON COLUMN content_embeddings.content_text IS '元のテキストコンテンツ';
COMMENT ON COLUMN content_embeddings.embedding IS 'ベクトル埋め込み（1536次元）';
COMMENT ON COLUMN content_embeddings.source_type IS 'コンテンツのソースタイプ';
COMMENT ON COLUMN content_embeddings.similarity_threshold IS '検索時の類似度閾値';
COMMENT ON COLUMN content_embeddings.model_name IS '使用された埋め込みモデル名';

COMMENT ON FUNCTION search_user_embeddings(UUID, vector(1536), REAL, INTEGER) IS 'ユーザー固有のベクトル類似度検索（RLS保護）';
COMMENT ON FUNCTION get_user_embeddings_stats(UUID) IS 'ユーザー別ベクトル埋め込み統計（RLS保護）';

-- ===================================
-- 初期設定とテストデータ作成関数
-- ===================================

-- テスト用ベクトル埋め込み作成関数（開発環境用）
CREATE OR REPLACE FUNCTION create_test_embedding(
    target_user_id UUID,
    test_content TEXT,
    test_source_type VARCHAR(50) DEFAULT 'test'
)
RETURNS UUID AS $$
DECLARE
    embedding_id UUID;
    test_vector vector(1536);
BEGIN
    -- セキュリティチェック
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Access denied: Cannot create embeddings for other users';
    END IF;
    
    -- テスト用のランダムベクトル生成（実際の運用では OpenAI API を使用）
    test_vector := array_fill(random()::real, ARRAY[1536])::vector(1536);
    
    -- ベクトル埋め込みレコード作成
    INSERT INTO content_embeddings (
        user_id, 
        content_text, 
        embedding, 
        source_type,
        model_name,
        metadata
    )
    VALUES (
        target_user_id,
        test_content,
        test_vector,
        test_source_type,
        'test-model',
        jsonb_build_object('test', true, 'created_by', 'create_test_embedding')
    )
    RETURNING id INTO embedding_id;
    
    RETURN embedding_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_test_embedding(UUID, TEXT, VARCHAR) TO authenticated;

-- ===================================
-- 完了ログ
-- ===================================

DO $$
BEGIN
    RAISE NOTICE 'pgvector拡張セットアップ完了';
    RAISE NOTICE 'content_embeddings テーブル作成完了: 1536次元ベクトル対応';
    RAISE NOTICE 'RLS ポリシー設定完了: ユーザー別ベクトルデータ分離';
    RAISE NOTICE 'ベクトル類似度検索インデックス作成完了: IVFFlat最適化';
    RAISE NOTICE 'ユーザー固有検索関数作成完了: セキュリティ保護付き';
END $$;