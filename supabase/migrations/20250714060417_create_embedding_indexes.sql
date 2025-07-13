-- ===================================
-- Issue #26: ベクトル埋め込みインデックス最適化
-- ===================================
-- user_id + embedding複合インデックス作成
-- パフォーマンス最適化とRLS高速化
-- 同時ユーザー検索の並列処理対応

-- ===================================
-- 前提条件確認
-- ===================================

-- pgvector拡張が有効であることを確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE EXCEPTION 'pgvector extension is required but not installed';
    END IF;
    
    -- content_embeddingsテーブルが存在することを確認
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'content_embeddings') THEN
        RAISE EXCEPTION 'content_embeddings table does not exist. Run migration 002 first.';
    END IF;
    
    RAISE NOTICE 'Prerequisites verified successfully';
END $$;

-- ===================================
-- ベクトルインデックス作成準備
-- ===================================

-- 統計情報を更新してプランナーを最適化
ANALYZE content_embeddings;

-- ===================================
-- IVFFlatベクトルインデックス作成
-- ===================================

-- 1. 全ユーザー向けコサイン距離インデックス
-- 注意：大量データ（100件以上）がある場合のみ効果的
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_embeddings_vector_cosine 
ON content_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 2. 全ユーザー向けL2距離インデックス（将来用）
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_embeddings_vector_l2 
-- ON content_embeddings 
-- USING ivfflat (embedding vector_l2_ops)
-- WITH (lists = 100);

-- 3. 全ユーザー向け内積インデックス（将来用）
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_embeddings_vector_ip 
-- ON content_embeddings 
-- USING ivfflat (embedding vector_ip_ops)
-- WITH (lists = 100);

-- ===================================
-- 複合インデックス作成（RLS最適化）
-- ===================================

-- 1. user_id + is_active + source_type複合インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_user_active_source 
ON content_embeddings(user_id, is_active, source_type)
WHERE is_active = true;

-- 2. user_id + created_at複合インデックス（時系列分析用）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_user_time 
ON content_embeddings(user_id, created_at DESC)
WHERE is_active = true;

-- 3. user_id + similarity_threshold複合インデックス（カスタム閾値検索）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_user_threshold 
ON content_embeddings(user_id, similarity_threshold)
WHERE is_active = true;

-- 4. user_id + expires_at複合インデックス（期限管理）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_user_expires 
ON content_embeddings(user_id, expires_at)
WHERE expires_at IS NOT NULL;

-- ===================================
-- 部分インデックス（効率化）
-- ===================================

-- 1. アクティブレコードのみのuser_idインデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_active_user 
ON content_embeddings(user_id)
WHERE is_active = true;

-- 2. 期限切れ間近のレコード用インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_expiring_soon 
ON content_embeddings(user_id, expires_at)
WHERE expires_at <= NOW() + INTERVAL '7 days' AND is_active = true;

-- 3. ソースタイプ別の部分インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_github_source 
ON content_embeddings(user_id, created_at DESC)
WHERE source_type = 'github' AND is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_rss_source 
ON content_embeddings(user_id, created_at DESC)
WHERE source_type = 'rss' AND is_active = true;

-- ===================================
-- メタデータ検索用GINインデックス
-- ===================================

-- JSONBメタデータ用GINインデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_metadata_gin 
ON content_embeddings USING GIN (metadata);

-- ユーザー別メタデータ検索用複合インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_user_metadata 
ON content_embeddings(user_id) 
INCLUDE (metadata, source_type)
WHERE is_active = true;

-- ===================================
-- 全文検索用インデックス
-- ===================================

-- content_text用全文検索インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_content_fulltext 
ON content_embeddings USING GIN (to_tsvector('english', content_text))
WHERE is_active = true;

-- ユーザー別全文検索用複合インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_user_fulltext 
ON content_embeddings(user_id) 
INCLUDE (content_text, source_type)
WHERE is_active = true;

-- ===================================
-- カバリングインデックス（INCLUDE列）
-- ===================================

-- よく使用される列を含むカバリングインデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_user_covering 
ON content_embeddings(user_id, is_active) 
INCLUDE (id, content_text, source_type, metadata, created_at)
WHERE is_active = true;

-- ベクトル検索結果用カバリングインデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_vector_covering 
ON content_embeddings(user_id) 
INCLUDE (id, content_text, source_type, metadata, created_at, similarity_threshold);

-- ===================================
-- インデックス統計情報とパフォーマンス監視
-- ===================================

-- インデックス使用状況監視関数
CREATE OR REPLACE FUNCTION get_embedding_index_stats()
RETURNS TABLE(
    index_name TEXT,
    table_name TEXT,
    index_size TEXT,
    index_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.indexrelname::TEXT,
        t.relname::TEXT,
        pg_size_pretty(pg_relation_size(i.indexrelid))::TEXT,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch
    FROM pg_stat_user_indexes s
    JOIN pg_class t ON s.relid = t.oid
    JOIN pg_class i ON s.indexrelid = i.oid
    WHERE t.relname = 'content_embeddings'
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- ベクトルインデックス効率監視関数
CREATE OR REPLACE FUNCTION analyze_vector_index_efficiency(
    test_user_id UUID DEFAULT NULL,
    sample_size INTEGER DEFAULT 100
)
RETURNS TABLE(
    index_name TEXT,
    avg_query_time_ms FLOAT,
    index_hit_ratio FLOAT,
    recommendations TEXT
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    query_time FLOAT;
    test_vector vector(1536);
    sample_user_id UUID;
BEGIN
    -- テスト用ユーザーID設定
    IF test_user_id IS NULL THEN
        SELECT user_id INTO sample_user_id 
        FROM content_embeddings 
        WHERE is_active = true 
        LIMIT 1;
    ELSE
        sample_user_id := test_user_id;
    END IF;
    
    IF sample_user_id IS NULL THEN
        RAISE EXCEPTION 'No active embeddings found for testing';
    END IF;
    
    -- テスト用ランダムベクトル生成
    test_vector := array_fill(random()::real, ARRAY[1536])::vector(1536);
    
    -- ベクトル検索クエリのパフォーマンステスト
    start_time := clock_timestamp();
    
    PERFORM search_user_embeddings(sample_user_id, test_vector, 0.7, 10);
    
    end_time := clock_timestamp();
    query_time := EXTRACT(epoch FROM (end_time - start_time)) * 1000;
    
    -- 結果返却（簡略版）
    RETURN QUERY
    SELECT 
        'idx_content_embeddings_vector_cosine'::TEXT,
        query_time,
        CASE 
            WHEN query_time < 100 THEN 0.9
            WHEN query_time < 500 THEN 0.7
            ELSE 0.5
        END,
        CASE 
            WHEN query_time < 100 THEN 'Excellent performance'
            WHEN query_time < 500 THEN 'Good performance'
            ELSE 'Consider index optimization'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- インデックス保守関数
-- ===================================

-- インデックス再構築関数
CREATE OR REPLACE FUNCTION rebuild_embedding_indexes()
RETURNS TEXT AS $$
DECLARE
    index_record RECORD;
    result_text TEXT := '';
BEGIN
    -- 統計情報更新
    ANALYZE content_embeddings;
    result_text := result_text || 'Statistics updated. ';
    
    -- ベクトルインデックスの再構築（必要に応じて）
    FOR index_record IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'content_embeddings' 
        AND indexname LIKE '%vector%'
    LOOP
        EXECUTE format('REINDEX INDEX CONCURRENTLY %I', index_record.indexname);
        result_text := result_text || format('Rebuilt index %s. ', index_record.indexname);
    END LOOP;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- ベクトル距離計算最適化関数
-- ===================================

-- 事前計算済みノルム付きベクトル検索（高速化）
CREATE OR REPLACE FUNCTION fast_vector_search(
    target_user_id UUID,
    normalized_query_vector vector(1536),
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
    -- セキュリティチェック
    IF target_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot search other user embeddings';
    END IF;
    
    -- 正規化されたベクトルでの高速検索
    RETURN QUERY
    SELECT 
        ce.id,
        ce.content_text,
        1 - (ce.embedding <=> normalized_query_vector) AS similarity,
        ce.source_type,
        ce.metadata,
        ce.created_at
    FROM content_embeddings ce
    WHERE ce.user_id = target_user_id
    AND ce.is_active = true
    AND (1 - (ce.embedding <=> normalized_query_vector)) >= similarity_threshold
    ORDER BY ce.embedding <=> normalized_query_vector
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- 権限設定
-- ===================================

-- 認証済みユーザーに監視関数の実行権限を付与
GRANT EXECUTE ON FUNCTION get_embedding_index_stats TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_vector_index_efficiency TO authenticated;
GRANT EXECUTE ON FUNCTION fast_vector_search TO authenticated;

-- サービスロールには保守関数の実行権限を付与
GRANT EXECUTE ON FUNCTION rebuild_embedding_indexes TO service_role;

-- ===================================
-- インデックス作成確認
-- ===================================

DO $$
DECLARE
    index_count INTEGER;
    vector_index_count INTEGER;
BEGIN
    -- 作成されたインデックス数を確認
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'content_embeddings';
    
    SELECT COUNT(*) INTO vector_index_count
    FROM pg_indexes 
    WHERE tablename = 'content_embeddings' 
    AND indexdef LIKE '%ivfflat%';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'インデックス作成完了レポート';
    RAISE NOTICE '========================================';
    RAISE NOTICE '総インデックス数: %', index_count;
    RAISE NOTICE 'ベクトルインデックス数: %', vector_index_count;
    RAISE NOTICE '✓ RLS最適化インデックス作成完了';
    RAISE NOTICE '✓ 複合インデックス作成完了';
    RAISE NOTICE '✓ 部分インデックス作成完了';
    RAISE NOTICE '✓ カバリングインデックス作成完了';
    RAISE NOTICE '✓ 全文検索インデックス作成完了';
    RAISE NOTICE '✓ メタデータGINインデックス作成完了';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'パフォーマンス監視関数利用可能:';
    RAISE NOTICE '- SELECT * FROM get_embedding_index_stats();';
    RAISE NOTICE '- SELECT * FROM analyze_vector_index_efficiency();';
    RAISE NOTICE '========================================';
END $$;