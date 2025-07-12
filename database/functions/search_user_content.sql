-- ===================================
-- Issue #21: ユーザー固有検索関数 - RLS統合ベクトル検索
-- ===================================
-- Phase 1-11: ユーザーIDで制限されたベクトル類似度検索を行うPostgreSQL関数
-- すべての要件を満たす完全な実装（TDD Green Phase）

CREATE OR REPLACE FUNCTION search_user_content(
    target_user_id UUID,
    query_vector vector(1536),
    search_similarity_threshold REAL DEFAULT 0.7,
    match_count INTEGER DEFAULT 10,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    source_type_filter VARCHAR(50) DEFAULT NULL,
    active_only BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    content_text TEXT,
    source_type VARCHAR(50),
    source_url TEXT,
    similarity REAL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    query_start_time TIMESTAMP;
    execution_time INTERVAL;
    results_count INTEGER;
BEGIN
    -- パフォーマンス測定開始
    query_start_time := clock_timestamp();
    
    -- ===================================
    -- セキュリティ検証（関数レベルでのユーザー認証チェック）
    -- ===================================
    
    -- 1. ユーザー認証確認: 呼び出し元が対象ユーザーと一致することを確認
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required: User must be authenticated to search content'
            USING ERRCODE = '42501', HINT = 'Please authenticate before making this request';
    END IF;
    
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Access denied: Cannot search other user content (requested: %, authenticated: %)', 
            target_user_id, auth.uid()
            USING ERRCODE = '42501', HINT = 'Users can only search their own content';
    END IF;
    
    -- 2. パラメータバリデーション（SQLインジェクション対策）
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid parameter: target_user_id cannot be NULL'
            USING ERRCODE = '22023';
    END IF;
    
    IF query_vector IS NULL THEN
        RAISE EXCEPTION 'Invalid parameter: query_vector cannot be NULL'
            USING ERRCODE = '22023';
    END IF;
    
    IF search_similarity_threshold < 0.0 OR search_similarity_threshold > 1.0 THEN
        RAISE EXCEPTION 'Invalid parameter: search_similarity_threshold must be between 0.0 and 1.0 (got: %)', 
            search_similarity_threshold
            USING ERRCODE = '22023';
    END IF;
    
    IF match_count < 0 OR match_count > 1000 THEN
        RAISE EXCEPTION 'Invalid parameter: match_count must be between 0 and 1000 (got: %)', 
            match_count
            USING ERRCODE = '22023';
    END IF;
    
    -- 3. 日付フィルタバリデーション
    IF start_date IS NOT NULL AND end_date IS NOT NULL AND start_date > end_date THEN
        RAISE EXCEPTION 'Invalid date range: start_date (%) cannot be after end_date (%)', 
            start_date, end_date
            USING ERRCODE = '22023';
    END IF;
    
    -- ===================================
    -- ユーザー固有ベクトル類似度検索（RLS統合）
    -- ===================================
    
    -- RLS により自動的にユーザーデータが分離される + 追加の明示的フィルタリング
    RETURN QUERY
    SELECT 
        ce.id,
        ce.content_text,
        ce.source_type,
        ce.source_url,
        -- コサイン類似度計算 (1 - コサイン距離)
        (1 - (ce.embedding <=> query_vector))::REAL as similarity,
        -- 拡張メタデータ
        jsonb_build_object(
            'model_name', ce.model_name,
            'embedding_created_at', ce.embedding_created_at,
            'similarity_threshold', ce.similarity_threshold,
            'is_active', ce.is_active,
            'metadata', ce.metadata,
            'query_info', jsonb_build_object(
                'query_timestamp', NOW(),
                'requested_threshold', search_similarity_threshold,
                'requested_count', match_count,
                'source_filter', source_type_filter,
                'date_filter', jsonb_build_object(
                    'start_date', start_date,
                    'end_date', end_date
                )
            )
        ) as metadata,
        ce.created_at
    FROM content_embeddings ce
    WHERE 
        -- RLS による自動ユーザー分離 + 明示的確認
        ce.user_id = target_user_id
        
        -- アクティブフィルタ
        AND (NOT active_only OR ce.is_active = true)
        
        -- 類似度閾値フィルタリング（コサイン距離ベース）
        AND (1 - (ce.embedding <=> query_vector)) >= search_similarity_threshold
        
        -- ソースタイプフィルタ
        AND (source_type_filter IS NULL OR ce.source_type = source_type_filter)
        
        -- 日付フィルタ機能
        AND (start_date IS NULL OR ce.created_at >= start_date)
        AND (end_date IS NULL OR ce.created_at <= end_date)
        
    -- パフォーマンス最適化: ベクトル距離によるソート（インデックス活用）
    ORDER BY ce.embedding <=> query_vector
    LIMIT match_count;
    
    -- ===================================
    -- パフォーマンス監視とログ
    -- ===================================
    
    -- 実行時間計算
    execution_time := clock_timestamp() - query_start_time;
    
    -- 結果数取得
    GET DIAGNOSTICS results_count = ROW_COUNT;
    
    -- パフォーマンス警告（3秒以上の場合）
    IF execution_time > interval '3 seconds' THEN
        RAISE WARNING 'search_user_content performance warning: Query took % (> 3 seconds) for user % (% results)', 
            execution_time, target_user_id, results_count;
    END IF;
    
    -- デバッグログ（開発環境用）
    RAISE DEBUG 'search_user_content completed: user=%, results=%, time=%, threshold=%', 
        target_user_id, results_count, execution_time, search_similarity_threshold;
    
    RETURN;
    
EXCEPTION
    WHEN OTHERS THEN
        -- エラーハンドリング: セキュリティとデバッグ情報のバランス
        RAISE EXCEPTION 'search_user_content failed for user %: % (SQLSTATE: %)', 
            target_user_id, SQLERRM, SQLSTATE
            USING HINT = 'Check user authentication, parameters, and database connectivity';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_user_content TO authenticated;

-- Create function to get user RAG metrics
CREATE OR REPLACE FUNCTION get_user_rag_metrics(
    target_user_id UUID,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_queries INTEGER,
    avg_similarity FLOAT,
    content_sources INTEGER,
    quality_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    query_count INTEGER;
    avg_sim FLOAT;
    source_count INTEGER;
    quality FLOAT;
BEGIN
    -- Verify that the requesting user matches the target user
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Access denied: Cannot access other user metrics';
    END IF;

    -- Count API usage for search operations
    SELECT COUNT(*) INTO query_count
    FROM api_usage_logs
    WHERE user_id = target_user_id
        AND operation = 'search_content'
        AND created_at BETWEEN start_date AND end_date;

    -- Calculate average similarity from embeddings (proxy for content quality)
    SELECT AVG(similarity_threshold) INTO avg_sim
    FROM content_embeddings
    WHERE user_id = target_user_id
        AND created_at BETWEEN start_date AND end_date;

    -- Count active content sources
    SELECT COUNT(*) INTO source_count
    FROM content_sources
    WHERE user_id = target_user_id
        AND is_active = true;

    -- Calculate quality score (simple heuristic)
    quality := LEAST(
        (source_count * 0.3) + 
        (COALESCE(avg_sim, 0.7) * 0.7), 
        1.0
    );

    -- Return metrics
    RETURN QUERY SELECT 
        COALESCE(query_count, 0) as total_queries,
        COALESCE(avg_sim, 0.0) as avg_similarity,
        COALESCE(source_count, 0) as content_sources,
        COALESCE(quality, 0.0) as quality_score;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_rag_metrics TO authenticated;