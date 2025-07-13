-- ===================================
-- Issue #25: pgvectorパフォーマンステスト
-- ===================================
-- ベクトル演算のパフォーマンス測定とインデックス効果検証
-- 1536次元ベクトルでの実用性能評価

-- ===================================
-- テスト用ダミーデータ作成
-- ===================================

-- パフォーマンステスト用のテストデータ作成関数
CREATE OR REPLACE FUNCTION create_test_embeddings_data(
    user_count INTEGER DEFAULT 3,
    embeddings_per_user INTEGER DEFAULT 100
)
RETURNS TABLE(
    created_users INTEGER,
    created_embeddings INTEGER,
    total_vectors INTEGER
) AS $$
DECLARE
    test_user_id UUID;
    i INTEGER;
    j INTEGER;
    test_vector vector(1536);
    created_user_count INTEGER := 0;
    created_embedding_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== パフォーマンステスト用データ作成開始 ===';
    RAISE NOTICE 'ユーザー数: %, 各ユーザーの埋め込み数: %', user_count, embeddings_per_user;
    
    -- 既存のテストデータをクリーンアップ
    DELETE FROM content_embeddings WHERE metadata->>'test' = 'performance';
    DELETE FROM users WHERE email LIKE 'test-performance-%';
    
    -- テストユーザーを作成
    FOR i IN 1..user_count LOOP
        test_user_id := uuid_generate_v4();
        
        -- ユーザー作成（RLSを一時的に無効化）
        SET row_security = off;
        INSERT INTO users (id, email, username, display_name, google_id, created_at)
        VALUES (
            test_user_id,
            'test-performance-' || i || '@example.com',
            'perf_test_user_' || i,
            'Performance Test User ' || i,
            'google-perf-test-' || i,
            NOW()
        );
        SET row_security = on;
        
        created_user_count := created_user_count + 1;
        
        -- 各ユーザーに対してベクトル埋め込みを作成
        FOR j IN 1..embeddings_per_user LOOP
            -- ランダムな1536次元ベクトル生成（正規化済み）
            WITH random_values AS (
                SELECT array_agg(random()::real - 0.5) as vals
                FROM generate_series(1, 1536)
            ),
            normalized_values AS (
                SELECT vals, sqrt(array_reduce(vals, 0::real, 
                    CREATE FUNCTION(acc real, val real) RETURNS real AS $norm$ 
                        BEGIN RETURN acc + val * val; END; 
                    $norm$ LANGUAGE plpgsql
                )) as magnitude
                FROM random_values
            )
            SELECT array_agg(val / magnitude)::vector(1536) INTO test_vector
            FROM unnest((SELECT vals FROM normalized_values)) as val,
                 (SELECT magnitude FROM normalized_values) as norm;
            
            -- より簡単な方法でテストベクトル作成
            test_vector := array_fill((random() - 0.5)::real, ARRAY[1536])::vector(1536);
            
            -- ベクトル埋め込み挿入（RLS適用）
            SET row_security = off;
            INSERT INTO content_embeddings (
                user_id,
                content_text,
                embedding,
                source_type,
                model_name,
                metadata,
                created_at
            )
            VALUES (
                test_user_id,
                'Performance test content ' || i || '-' || j,
                test_vector,
                'test',
                'test-performance-model',
                jsonb_build_object(
                    'test', 'performance',
                    'user_index', i,
                    'embedding_index', j,
                    'created_at', NOW()
                ),
                NOW()
            );
            SET row_security = on;
            
            created_embedding_count := created_embedding_count + 1;
        END LOOP;
        
        RAISE NOTICE 'ユーザー % (%埋め込み) 作成完了', i, embeddings_per_user;
    END LOOP;
    
    RAISE NOTICE '=== データ作成完了 ===';
    RAISE NOTICE '作成されたユーザー: %', created_user_count;
    RAISE NOTICE '作成された埋め込み: %', created_embedding_count;
    
    RETURN QUERY SELECT created_user_count, created_embedding_count, created_user_count * embeddings_per_user;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- ベクトル検索パフォーマンステスト
-- ===================================

-- ベクトル検索のパフォーマンス測定関数
CREATE OR REPLACE FUNCTION benchmark_vector_search(
    test_user_count INTEGER DEFAULT 3,
    search_iterations INTEGER DEFAULT 10,
    similarity_threshold REAL DEFAULT 0.7
)
RETURNS TABLE(
    test_name TEXT,
    avg_execution_time_ms REAL,
    min_execution_time_ms REAL,
    max_execution_time_ms REAL,
    total_results INTEGER,
    results_per_second REAL
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration_ms REAL;
    iteration INTEGER;
    test_user_id UUID;
    query_vector vector(1536);
    search_results INTEGER;
    total_duration_ms REAL := 0;
    min_duration_ms REAL := NULL;
    max_duration_ms REAL := NULL;
    total_search_results INTEGER := 0;
BEGIN
    RAISE NOTICE '=== ベクトル検索パフォーマンステスト開始 ===';
    
    -- テスト用のクエリベクトル生成
    query_vector := array_fill(random()::real, ARRAY[1536])::vector(1536);
    
    -- テストユーザーID取得
    SELECT id INTO test_user_id 
    FROM users 
    WHERE email LIKE 'test-performance-%' 
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'テストユーザーが見つかりません。先にcreate_test_embeddings_data()を実行してください。';
    END IF;
    
    -- インデックスなしでの検索テスト
    RAISE NOTICE '--- インデックスなしでの検索テスト ---';
    
    -- IVFFlatインデックスを一時的に無効化
    SET enable_seqscan = on;
    SET enable_indexscan = off;
    
    FOR iteration IN 1..search_iterations LOOP
        start_time := clock_timestamp();
        
        -- ベクトル類似度検索実行
        SELECT COUNT(*) INTO search_results
        FROM content_embeddings
        WHERE user_id = test_user_id
        AND is_active = true
        AND (1 - (embedding <=> query_vector)) >= similarity_threshold;
        
        end_time := clock_timestamp();
        duration_ms := EXTRACT(epoch FROM (end_time - start_time)) * 1000;
        
        total_duration_ms := total_duration_ms + duration_ms;
        total_search_results := total_search_results + search_results;
        
        IF min_duration_ms IS NULL OR duration_ms < min_duration_ms THEN
            min_duration_ms := duration_ms;
        END IF;
        
        IF max_duration_ms IS NULL OR duration_ms > max_duration_ms THEN
            max_duration_ms := duration_ms;
        END IF;
    END LOOP;
    
    -- インデックスなしの結果を返す
    RETURN QUERY SELECT 
        'Sequential Scan (インデックスなし)'::TEXT,
        (total_duration_ms / search_iterations)::REAL,
        min_duration_ms,
        max_duration_ms,
        total_search_results,
        (search_iterations / GREATEST(total_duration_ms / 1000, 0.001))::REAL;
    
    -- 結果をリセット
    total_duration_ms := 0;
    min_duration_ms := NULL;
    max_duration_ms := NULL;
    total_search_results := 0;
    
    -- インデックスありでの検索テスト
    RAISE NOTICE '--- IVFFlatインデックスありでの検索テスト ---';
    
    -- IVFFlatインデックスを有効化
    SET enable_seqscan = off;
    SET enable_indexscan = on;
    
    FOR iteration IN 1..search_iterations LOOP
        start_time := clock_timestamp();
        
        -- ベクトル類似度検索実行（インデックス使用）
        SELECT COUNT(*) INTO search_results
        FROM content_embeddings
        WHERE user_id = test_user_id
        AND is_active = true
        AND (1 - (embedding <=> query_vector)) >= similarity_threshold;
        
        end_time := clock_timestamp();
        duration_ms := EXTRACT(epoch FROM (end_time - start_time)) * 1000;
        
        total_duration_ms := total_duration_ms + duration_ms;
        total_search_results := total_search_results + search_results;
        
        IF min_duration_ms IS NULL OR duration_ms < min_duration_ms THEN
            min_duration_ms := duration_ms;
        END IF;
        
        IF max_duration_ms IS NULL OR duration_ms > max_duration_ms THEN
            max_duration_ms := duration_ms;
        END IF;
    END LOOP;
    
    -- インデックスありの結果を返す
    RETURN QUERY SELECT 
        'IVFFlat Index (インデックスあり)'::TEXT,
        (total_duration_ms / search_iterations)::REAL,
        min_duration_ms,
        max_duration_ms,
        total_search_results,
        (search_iterations / GREATEST(total_duration_ms / 1000, 0.001))::REAL;
    
    -- 設定を元に戻す
    SET enable_seqscan = on;
    SET enable_indexscan = on;
    
    RAISE NOTICE '=== ベクトル検索パフォーマンステスト完了 ===';
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- ユーザー固有検索関数のパフォーマンステスト
-- ===================================

-- search_user_embeddings関数のパフォーマンス測定
CREATE OR REPLACE FUNCTION benchmark_user_search_function(
    iterations INTEGER DEFAULT 5
)
RETURNS TABLE(
    function_name TEXT,
    avg_execution_time_ms REAL,
    min_execution_time_ms REAL,
    max_execution_time_ms REAL,
    avg_results_returned INTEGER
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration_ms REAL;
    iteration INTEGER;
    test_user_id UUID;
    query_vector vector(1536);
    search_results INTEGER;
    total_duration_ms REAL := 0;
    min_duration_ms REAL := NULL;
    max_duration_ms REAL := NULL;
    total_results INTEGER := 0;
BEGIN
    RAISE NOTICE '=== ユーザー固有検索関数パフォーマンステスト開始 ===';
    
    -- テストユーザーID取得
    SELECT id INTO test_user_id 
    FROM users 
    WHERE email LIKE 'test-performance-%' 
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'テストユーザーが見つかりません。';
    END IF;
    
    -- テスト用のクエリベクトル生成
    query_vector := array_fill(random()::real, ARRAY[1536])::vector(1536);
    
    -- RLSを一時的に無効化してテスト実行
    SET row_security = off;
    
    FOR iteration IN 1..iterations LOOP
        start_time := clock_timestamp();
        
        -- search_user_embeddings関数を実行
        SELECT COUNT(*) INTO search_results
        FROM search_user_embeddings(
            test_user_id,
            query_vector,
            0.7,
            10
        );
        
        end_time := clock_timestamp();
        duration_ms := EXTRACT(epoch FROM (end_time - start_time)) * 1000;
        
        total_duration_ms := total_duration_ms + duration_ms;
        total_results := total_results + search_results;
        
        IF min_duration_ms IS NULL OR duration_ms < min_duration_ms THEN
            min_duration_ms := duration_ms;
        END IF;
        
        IF max_duration_ms IS NULL OR duration_ms > max_duration_ms THEN
            max_duration_ms := duration_ms;
        END IF;
    END LOOP;
    
    SET row_security = on;
    
    RETURN QUERY SELECT 
        'search_user_embeddings()'::TEXT,
        (total_duration_ms / iterations)::REAL,
        min_duration_ms,
        max_duration_ms,
        (total_results / iterations)::INTEGER;
    
    RAISE NOTICE '=== ユーザー固有検索関数パフォーマンステスト完了 ===';
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- インデックス統計情報の確認
-- ===================================

-- インデックス使用状況の分析関数
CREATE OR REPLACE FUNCTION analyze_vector_index_usage()
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
        i.indexrelname::TEXT as index_name,
        t.relname::TEXT as table_name,
        pg_size_pretty(pg_relation_size(i.indexrelid))::TEXT as index_size,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch
    FROM pg_stat_user_indexes s
    JOIN pg_class t ON s.relid = t.oid
    JOIN pg_class i ON s.indexrelid = i.oid
    WHERE t.relname = 'content_embeddings'
    AND i.relname LIKE '%vector%'
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 統合パフォーマンステスト実行関数
-- ===================================

-- 全パフォーマンステストを一括実行する関数
CREATE OR REPLACE FUNCTION run_complete_performance_test()
RETURNS VOID AS $$
DECLARE
    creation_result RECORD;
    search_result RECORD;
    function_result RECORD;
    index_result RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'pgvector パフォーマンステスト実行開始';
    RAISE NOTICE '========================================';
    
    -- 1. テストデータ作成
    RAISE NOTICE '1. テストデータ作成中...';
    SELECT * INTO creation_result FROM create_test_embeddings_data(3, 100);
    RAISE NOTICE '   作成されたユーザー: %', creation_result.created_users;
    RAISE NOTICE '   作成された埋め込み: %', creation_result.created_embeddings;
    
    -- 2. ベクトル検索パフォーマンステスト
    RAISE NOTICE '2. ベクトル検索パフォーマンステスト実行中...';
    FOR search_result IN SELECT * FROM benchmark_vector_search(3, 5, 0.7) LOOP
        RAISE NOTICE '   %:', search_result.test_name;
        RAISE NOTICE '     平均実行時間: % ms', search_result.avg_execution_time_ms;
        RAISE NOTICE '     最小実行時間: % ms', search_result.min_execution_time_ms;
        RAISE NOTICE '     最大実行時間: % ms', search_result.max_execution_time_ms;
        RAISE NOTICE '     検索結果数: %', search_result.total_results;
        RAISE NOTICE '     秒間検索回数: %', search_result.results_per_second;
        RAISE NOTICE '';
    END LOOP;
    
    -- 3. ユーザー固有検索関数テスト
    RAISE NOTICE '3. ユーザー固有検索関数テスト実行中...';
    SELECT * INTO function_result FROM benchmark_user_search_function(5);
    RAISE NOTICE '   %:', function_result.function_name;
    RAISE NOTICE '     平均実行時間: % ms', function_result.avg_execution_time_ms;
    RAISE NOTICE '     最小実行時間: % ms', function_result.min_execution_time_ms;
    RAISE NOTICE '     最大実行時間: % ms', function_result.max_execution_time_ms;
    RAISE NOTICE '     平均結果数: %', function_result.avg_results_returned;
    RAISE NOTICE '';
    
    -- 4. インデックス使用状況分析
    RAISE NOTICE '4. インデックス使用状況分析...';
    FOR index_result IN SELECT * FROM analyze_vector_index_usage() LOOP
        RAISE NOTICE '   インデックス: %', index_result.index_name;
        RAISE NOTICE '     テーブル: %', index_result.table_name;
        RAISE NOTICE '     サイズ: %', index_result.index_size;
        RAISE NOTICE '     スキャン回数: %', index_result.index_scans;
        RAISE NOTICE '     読み取りタプル数: %', index_result.tuples_read;
        RAISE NOTICE '';
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'pgvector パフォーマンステスト完了';
    RAISE NOTICE '========================================';
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- テストデータクリーンアップ関数
-- ===================================

-- パフォーマンステスト用データを削除する関数
CREATE OR REPLACE FUNCTION cleanup_performance_test_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_embeddings INTEGER;
    deleted_users INTEGER;
BEGIN
    -- RLSを一時的に無効化
    SET row_security = off;
    
    -- テスト用埋め込みデータ削除
    DELETE FROM content_embeddings WHERE metadata->>'test' = 'performance';
    GET DIAGNOSTICS deleted_embeddings = ROW_COUNT;
    
    -- テスト用ユーザーデータ削除
    DELETE FROM users WHERE email LIKE 'test-performance-%';
    GET DIAGNOSTICS deleted_users = ROW_COUNT;
    
    SET row_security = on;
    
    RAISE NOTICE 'パフォーマンステストデータクリーンアップ完了';
    RAISE NOTICE '削除された埋め込み: %', deleted_embeddings;
    RAISE NOTICE '削除されたユーザー: %', deleted_users;
    
    RETURN deleted_embeddings + deleted_users;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 権限設定
-- ===================================

-- 認証済みユーザーへの実行権限付与
GRANT EXECUTE ON FUNCTION create_test_embeddings_data(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION benchmark_vector_search(INTEGER, INTEGER, REAL) TO authenticated;
GRANT EXECUTE ON FUNCTION benchmark_user_search_function(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_vector_index_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION run_complete_performance_test() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_performance_test_data() TO authenticated;

-- ===================================
-- 使用方法とドキュメント
-- ===================================

COMMENT ON FUNCTION create_test_embeddings_data(INTEGER, INTEGER) IS 'パフォーマンステスト用のユーザーとベクトル埋め込みデータを作成';
COMMENT ON FUNCTION benchmark_vector_search(INTEGER, INTEGER, REAL) IS 'ベクトル検索のパフォーマンスを測定（インデックスあり/なしの比較）';
COMMENT ON FUNCTION benchmark_user_search_function(INTEGER) IS 'search_user_embeddings関数のパフォーマンスを測定';
COMMENT ON FUNCTION analyze_vector_index_usage() IS 'ベクトルインデックスの使用状況を分析';
COMMENT ON FUNCTION run_complete_performance_test() IS '全パフォーマンステストを一括実行';
COMMENT ON FUNCTION cleanup_performance_test_data() IS 'パフォーマンステスト用データを削除';

-- ===================================
-- 完了ログ
-- ===================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'pgvectorパフォーマンステスト環境構築完了';
    RAISE NOTICE '========================================';
    RAISE NOTICE '利用可能な関数:';
    RAISE NOTICE '  - create_test_embeddings_data()     : テストデータ作成';
    RAISE NOTICE '  - benchmark_vector_search()         : 検索性能測定';
    RAISE NOTICE '  - benchmark_user_search_function()  : 関数性能測定';
    RAISE NOTICE '  - analyze_vector_index_usage()      : インデックス分析';
    RAISE NOTICE '  - run_complete_performance_test()   : 統合テスト実行';
    RAISE NOTICE '  - cleanup_performance_test_data()   : データクリーンアップ';
    RAISE NOTICE '';
    RAISE NOTICE '実行例:';
    RAISE NOTICE '  SELECT run_complete_performance_test();';
    RAISE NOTICE '========================================';
END $$;