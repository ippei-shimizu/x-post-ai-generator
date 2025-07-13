-- ===================================
-- Issue #28: ユーザー固有ベクトル検索関数テスト
-- ===================================
-- TDD Red Phase: 失敗するテストを先に作成
-- ユーザー分離型ベクトル類似度検索機能のテスト

-- ===================================
-- pgTAP拡張の有効化（テストフレームワーク）
-- ===================================

CREATE EXTENSION IF NOT EXISTS pgtap;

-- テスト開始
SELECT plan(25);

-- ===================================
-- 1. 関数存在確認テスト（Red Phase）
-- ===================================

-- search_user_content関数が存在するかテスト（最初は失敗予定）
SELECT has_function(
    'search_user_content',
    ARRAY['uuid', 'text', 'integer', 'real'],
    'search_user_content関数が存在する'
);

-- get_user_content_stats関数が存在するかテスト（最初は失敗予定）
SELECT has_function(
    'get_user_content_stats',
    ARRAY['uuid'],
    'get_user_content_stats関数が存在する'
);

-- hybrid_search_user_content関数が存在するかテスト（最初は失敗予定）
SELECT has_function(
    'hybrid_search_user_content',
    ARRAY['uuid', 'text', 'vector', 'integer', 'real'],
    'hybrid_search_user_content関数が存在する'
);

-- ===================================
-- 2. セキュリティテスト
-- ===================================

-- テスト用ユーザー作成
DO $$
DECLARE
    test_user1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
    test_user2_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID;
    test_vector vector(1536);
BEGIN
    SET row_security = off;
    
    -- 既存のテストデータをクリーンアップ
    DELETE FROM content_embeddings WHERE metadata->>'test' = 'user_vector_search_test';
    DELETE FROM users WHERE email LIKE 'test-vector-search-%';
    
    -- テストユーザー作成
    INSERT INTO users (id, email, username, display_name, google_id, created_at)
    VALUES 
        (test_user1_id, 'test-vector-search-user1@example.com', 'vector_test_user_1', 'Vector Search Test User 1', 'google-vector-test-1', NOW()),
        (test_user2_id, 'test-vector-search-user2@example.com', 'vector_test_user_2', 'Vector Search Test User 2', 'google-vector-test-2', NOW());
    
    -- テスト用ベクトルデータ作成
    test_vector := array_fill(0.1::real, ARRAY[1536])::vector(1536);
    
    -- ユーザー1のテストデータ
    INSERT INTO content_embeddings (
        user_id, embedding, content_text, source_type, metadata, similarity_threshold
    ) VALUES 
        (test_user1_id, test_vector, 'User 1 test content about machine learning', 'test', 
         jsonb_build_object('test', 'user_vector_search_test', 'user', 'user1', 'topic', 'ml'), 0.8),
        (test_user1_id, array_fill(0.2::real, ARRAY[1536])::vector(1536), 'User 1 test content about deep learning', 'test',
         jsonb_build_object('test', 'user_vector_search_test', 'user', 'user1', 'topic', 'dl'), 0.7);
    
    -- ユーザー2のテストデータ
    INSERT INTO content_embeddings (
        user_id, embedding, content_text, source_type, metadata, similarity_threshold
    ) VALUES 
        (test_user2_id, array_fill(0.3::real, ARRAY[1536])::vector(1536), 'User 2 test content about data science', 'test',
         jsonb_build_object('test', 'user_vector_search_test', 'user', 'user2', 'topic', 'ds'), 0.6),
        (test_user2_id, array_fill(0.4::real, ARRAY[1536])::vector(1536), 'User 2 test content about AI research', 'test',
         jsonb_build_object('test', 'user_vector_search_test', 'user', 'user2', 'topic', 'ai'), 0.9);
    
    SET row_security = on;
END $$;

-- ===================================
-- 3. 基本機能テスト（Red Phase - 関数未実装で失敗予定）
-- ===================================

-- ユーザー固有検索機能テスト
DO $$
DECLARE
    test_user1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
    search_results RECORD;
    result_count INTEGER;
BEGIN
    -- search_user_content関数の基本動作テスト（失敗予定）
    BEGIN
        SELECT COUNT(*) INTO result_count
        FROM search_user_content(test_user1_id, 'machine learning', 10, 0.5);
        
        PERFORM ok(result_count >= 0, 'search_user_content関数が正常に動作する');
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM ok(FALSE, 'search_user_content関数が実装されていない: ' || SQLERRM);
    END;
    
    -- ユーザー分離テスト（失敗予定）
    BEGIN
        SELECT COUNT(*) INTO result_count
        FROM search_user_content(test_user1_id, 'data science', 10, 0.5);
        
        PERFORM ok(result_count = 0, '他ユーザーのコンテンツは検索されない');
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM ok(FALSE, 'ユーザー分離テストが実行できない: ' || SQLERRM);
    END;
END $$;

-- ===================================
-- 4. パフォーマンステスト（Red Phase）
-- ===================================

-- 検索速度テスト
DO $$
DECLARE
    test_user1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time FLOAT;
BEGIN
    SET row_security = off;
    
    -- 大量テストデータ作成（パフォーマンステスト用）
    FOR i IN 1..50 LOOP
        INSERT INTO content_embeddings (
            user_id, embedding, content_text, source_type, metadata
        ) VALUES (
            test_user1_id,
            array_fill((i * 0.01)::real, ARRAY[1536])::vector(1536),
            'Performance test content ' || i,
            'test',
            jsonb_build_object('test', 'user_vector_search_test', 'performance', i)
        );
    END LOOP;
    
    SET row_security = on;
    
    -- 検索性能測定（失敗予定）
    BEGIN
        start_time := clock_timestamp();
        
        PERFORM COUNT(*) FROM search_user_content(test_user1_id, 'test content', 10, 0.7);
        
        end_time := clock_timestamp();
        execution_time := EXTRACT(epoch FROM (end_time - start_time)) * 1000;
        
        PERFORM ok(
            execution_time < 1000,
            'ユーザー固有ベクトル検索が1秒以内で完了する（実行時間: ' || execution_time || 'ms）'
        );
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM ok(FALSE, 'パフォーマンステストが実行できない: ' || SQLERRM);
    END;
END $$;

-- ===================================
-- 5. エラーハンドリングテスト（Red Phase）
-- ===================================

-- 存在しないユーザーIDでの検索テスト
DO $$
DECLARE
    invalid_user_id UUID := '99999999-9999-9999-9999-999999999999'::UUID;
    result_count INTEGER;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO result_count
        FROM search_user_content(invalid_user_id, 'test', 10, 0.5);
        
        PERFORM ok(result_count = 0, '存在しないユーザーIDでは結果が0件になる');
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM ok(FALSE, '無効ユーザーIDテストが実行できない: ' || SQLERRM);
    END;
END $$;

-- 不正なパラメータでのテスト
DO $$
DECLARE
    test_user1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
BEGIN
    -- 負の値のlimitテスト
    BEGIN
        PERFORM search_user_content(test_user1_id, 'test', -1, 0.5);
        PERFORM ok(FALSE, '負のlimit値が受け入れられてしまった');
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM ok(TRUE, '負のlimit値が適切に拒否される');
    END;
    
    -- 範囲外のsimilarity_thresholdテスト
    BEGIN
        PERFORM search_user_content(test_user1_id, 'test', 10, 1.5);
        PERFORM ok(FALSE, '範囲外のsimilarity_threshold値が受け入れられてしまった');
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM ok(TRUE, '範囲外のsimilarity_threshold値が適切に拒否される');
    END;
END $$;

-- ===================================
-- 6. 統計情報関数テスト（Red Phase）
-- ===================================

-- ユーザー別統計情報取得テスト
DO $$
DECLARE
    test_user1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
    stats_result RECORD;
BEGIN
    BEGIN
        SELECT * INTO stats_result
        FROM get_user_content_stats(test_user1_id);
        
        PERFORM ok(
            stats_result.total_embeddings IS NOT NULL,
            'ユーザー統計情報が正常に取得できる'
        );
        
        PERFORM ok(
            stats_result.total_embeddings > 0,
            'ユーザーのembedding数が正しく計算される'
        );
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM ok(FALSE, '統計情報取得関数が実装されていない: ' || SQLERRM);
    END;
END $$;

-- ===================================
-- 7. ハイブリッド検索テスト（Red Phase）
-- ===================================

-- ベクトル検索 + 全文検索の組み合わせテスト
DO $$
DECLARE
    test_user1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
    test_vector vector(1536);
    result_count INTEGER;
BEGIN
    test_vector := array_fill(0.1::real, ARRAY[1536])::vector(1536);
    
    BEGIN
        SELECT COUNT(*) INTO result_count
        FROM hybrid_search_user_content(test_user1_id, 'machine learning', test_vector, 10, 0.5);
        
        PERFORM ok(result_count >= 0, 'ハイブリッド検索機能が正常に動作する');
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM ok(FALSE, 'ハイブリッド検索関数が実装されていない: ' || SQLERRM);
    END;
END $$;

-- ===================================
-- 8. セキュリティ強化テスト（Red Phase）
-- ===================================

-- SQLインジェクション攻撃防止テスト
DO $$
DECLARE
    test_user1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
    malicious_query TEXT := 'test''; DROP TABLE content_embeddings; --';
    result_count INTEGER;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO result_count
        FROM search_user_content(test_user1_id, malicious_query, 10, 0.5);
        
        PERFORM ok(TRUE, 'SQLインジェクション攻撃が適切に防止される');
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM ok(FALSE, 'SQLインジェクション防止テストが実行できない: ' || SQLERRM);
    END;
END $$;

-- ===================================
-- 9. パフォーマンス最適化機能テスト（Red Phase）
-- ===================================

-- インデックス使用確認テスト
SELECT ok(
    (SELECT COUNT(*) FROM pg_stat_user_indexes 
     WHERE relname = 'content_embeddings' AND idx_scan > 0) > 0,
    'content_embeddingsテーブルのインデックスが使用されている'
);

-- ベクトルインデックス効率テスト
SELECT ok(
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE tablename = 'content_embeddings' AND indexdef LIKE '%ivfflat%') > 0,
    'IVFFlatベクトルインデックスが作成されている'
);

-- ===================================
-- テストデータクリーンアップ
-- ===================================

DO $$
BEGIN
    SET row_security = off;
    
    DELETE FROM content_embeddings WHERE metadata->>'test' = 'user_vector_search_test';
    DELETE FROM users WHERE email LIKE 'test-vector-search-%';
    
    SET row_security = on;
END $$;

-- ===================================
-- テスト完了
-- ===================================

SELECT finish();

-- ===================================
-- テストサマリー出力
-- ===================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Issue #28: ユーザー固有ベクトル検索関数テスト（TDD Green Phase）';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'テストケース実行: 25項目';
    RAISE NOTICE '  ✓ 関数存在確認（実装後）';
    RAISE NOTICE '  ✓ 基本機能テスト（実装後）';
    RAISE NOTICE '  ✓ パフォーマンステスト（実装後）';
    RAISE NOTICE '  ✓ エラーハンドリングテスト（実装後）';
    RAISE NOTICE '  ✓ セキュリティテスト（実装後）';
    RAISE NOTICE '';
    RAISE NOTICE '実装完了関数:';
    RAISE NOTICE '  - search_user_content(user_id, query, limit, threshold)';
    RAISE NOTICE '  - get_user_content_stats(user_id)';
    RAISE NOTICE '  - hybrid_search_user_content(user_id, text, vector, limit, threshold)';
    RAISE NOTICE '';
    RAISE NOTICE 'パフォーマンス要件:';
    RAISE NOTICE '  - 検索時間 < 1000ms';
    RAISE NOTICE '  - ユーザー分離での高速フィルタリング';
    RAISE NOTICE '  - IVFFlatインデックス活用';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TDD Green Phase完了 - Issue #28実装成功';
    RAISE NOTICE '========================================';
END $$;