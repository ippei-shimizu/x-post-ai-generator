-- ===================================
-- Issue #25: pgvector拡張有効化とセットアップ
-- ===================================
-- PostgreSQL + pgvector拡張の基本設定
-- ユーザー分離型ベクトル検索の基盤構築

-- ===================================
-- 拡張の有効化
-- ===================================

-- pgvector拡張を有効化
-- これにより vector データ型と距離演算子が利用可能になる
CREATE EXTENSION IF NOT EXISTS vector;

-- UUID生成関数（既存テーブルとの互換性のため）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- pgvector拡張の動作確認
-- ===================================

-- ベクトル型のサポート確認
DO $$
DECLARE
    ext_version TEXT;
    vector_support BOOLEAN := FALSE;
BEGIN
    -- pgvector拡張のバージョン確認
    SELECT extversion INTO ext_version 
    FROM pg_extension 
    WHERE extname = 'vector';
    
    -- ベクトル型の動作確認
    BEGIN
        PERFORM '[1,2,3]'::vector(3);
        vector_support := TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            vector_support := FALSE;
    END;
    
    IF vector_support THEN
        RAISE NOTICE 'pgvector拡張が正常に有効化されました';
        RAISE NOTICE 'バージョン: %', COALESCE(ext_version, 'unknown');
        RAISE NOTICE 'vector型とベクトル演算子が利用可能です';
    ELSE
        RAISE EXCEPTION 'pgvector拡張の有効化に失敗しました';
    END IF;
END $$;

-- ===================================
-- ベクトル演算子とインデックスタイプの確認
-- ===================================

-- 利用可能なベクトル演算子の確認
DO $$
DECLARE
    operators_count INTEGER;
BEGIN
    -- pgvectorの距離演算子をカウント
    SELECT COUNT(*) INTO operators_count
    FROM pg_operator 
    WHERE oprname IN ('<->', '<=>', '<#>');
    
    IF operators_count >= 3 THEN
        RAISE NOTICE 'ベクトル距離演算子が利用可能です:';
        RAISE NOTICE '  <-> : L2距離（ユークリッド距離）';
        RAISE NOTICE '  <=> : コサイン距離';
        RAISE NOTICE '  <#> : 内積（負の値）';
    ELSE
        RAISE WARNING 'ベクトル距離演算子が不完全です（%/3個）', operators_count;
    END IF;
END $$;

-- インデックスタイプの確認
DO $$
DECLARE
    ivfflat_support BOOLEAN := FALSE;
    hnsw_support BOOLEAN := FALSE;
BEGIN
    -- IVFFlatインデックスのサポート確認
    SELECT COUNT(*) > 0 INTO ivfflat_support
    FROM pg_am 
    WHERE amname = 'ivfflat';
    
    -- HNSWインデックスのサポート確認（pgvector 0.5.0以降）
    SELECT COUNT(*) > 0 INTO hnsw_support
    FROM pg_am 
    WHERE amname = 'hnsw';
    
    RAISE NOTICE 'インデックスタイプサポート状況:';
    RAISE NOTICE '  IVFFlat: %', CASE WHEN ivfflat_support THEN '✓' ELSE '✗' END;
    RAISE NOTICE '  HNSW: %', CASE WHEN hnsw_support THEN '✓' ELSE '✗' END;
    
    IF NOT ivfflat_support THEN
        RAISE WARNING 'IVFFlatインデックスが利用できません';
    END IF;
END $$;

-- ===================================
-- ベクトル次元制限（1536次元）の設定確認
-- ===================================

-- OpenAI embeddings互換の1536次元ベクトルの動作確認
DO $$
DECLARE
    test_vector vector(1536);
    dimension_check INTEGER;
BEGIN
    -- 1536次元のテストベクトル生成
    test_vector := array_fill(0.1::real, ARRAY[1536])::vector(1536);
    
    -- 次元数確認
    dimension_check := array_length(test_vector::real[], 1);
    
    IF dimension_check = 1536 THEN
        RAISE NOTICE '1536次元ベクトルが正常に作成できました';
        RAISE NOTICE 'OpenAI text-embedding-ada-002 との互換性を確認';
    ELSE
        RAISE EXCEPTION '1536次元ベクトルの作成に失敗: 実際の次元数=%', dimension_check;
    END IF;
END $$;

-- ===================================
-- コサイン類似度関数の動作検証
-- ===================================

-- コサイン類似度計算の検証関数
CREATE OR REPLACE FUNCTION verify_cosine_similarity()
RETURNS TABLE(
    test_name TEXT,
    expected_similarity REAL,
    actual_similarity REAL,
    test_passed BOOLEAN
) AS $$
DECLARE
    vec1 vector(3);
    vec2 vector(3);
    vec3 vector(3);
    similarity_result REAL;
BEGIN
    -- テストケース1: 同一ベクトル（類似度 = 1.0）
    vec1 := '[1,0,0]'::vector(3);
    vec2 := '[1,0,0]'::vector(3);
    similarity_result := 1 - (vec1 <=> vec2);
    
    RETURN QUERY SELECT 
        '同一ベクトル'::TEXT,
        1.0::REAL,
        similarity_result,
        ABS(similarity_result - 1.0) < 0.001;
    
    -- テストケース2: 直交ベクトル（類似度 = 0.0）
    vec1 := '[1,0,0]'::vector(3);
    vec2 := '[0,1,0]'::vector(3);
    similarity_result := 1 - (vec1 <=> vec2);
    
    RETURN QUERY SELECT 
        '直交ベクトル'::TEXT,
        0.0::REAL,
        similarity_result,
        ABS(similarity_result - 0.0) < 0.001;
    
    -- テストケース3: 反対ベクトル（類似度 = -1.0）
    vec1 := '[1,0,0]'::vector(3);
    vec2 := '[-1,0,0]'::vector(3);
    similarity_result := 1 - (vec1 <=> vec2);
    
    RETURN QUERY SELECT 
        '反対ベクトル'::TEXT,
        -1.0::REAL,
        similarity_result,
        ABS(similarity_result - (-1.0)) < 0.001;
    
    -- テストケース4: 部分的類似ベクトル
    vec1 := '[1,1,0]'::vector(3);
    vec2 := '[1,0,0]'::vector(3);
    similarity_result := 1 - (vec1 <=> vec2);
    
    RETURN QUERY SELECT 
        '部分的類似ベクトル'::TEXT,
        0.7071::REAL, -- cos(45°) ≈ 0.7071
        similarity_result,
        ABS(similarity_result - 0.7071) < 0.01;
END;
$$ LANGUAGE plpgsql;

-- コサイン類似度の動作確認実行
DO $$
DECLARE
    test_result RECORD;
    all_tests_passed BOOLEAN := TRUE;
BEGIN
    RAISE NOTICE '=== コサイン類似度関数の動作検証 ===';
    
    FOR test_result IN SELECT * FROM verify_cosine_similarity() LOOP
        IF test_result.test_passed THEN
            RAISE NOTICE '✓ %: 期待値=%, 実際値=% (合格)', 
                test_result.test_name, 
                test_result.expected_similarity, 
                test_result.actual_similarity;
        ELSE
            RAISE WARNING '✗ %: 期待値=%, 実際値=% (不合格)', 
                test_result.test_name, 
                test_result.expected_similarity, 
                test_result.actual_similarity;
            all_tests_passed := FALSE;
        END IF;
    END LOOP;
    
    IF all_tests_passed THEN
        RAISE NOTICE 'コサイン類似度計算が正常に動作しています';
    ELSE
        RAISE EXCEPTION 'コサイン類似度計算にエラーがあります';
    END IF;
END $$;

-- 検証関数をクリーンアップ
DROP FUNCTION verify_cosine_similarity();

-- ===================================
-- パフォーマンステスト用のベンチマーク関数
-- ===================================

-- ベクトル操作のパフォーマンス測定関数
CREATE OR REPLACE FUNCTION benchmark_vector_operations(
    vector_count INTEGER DEFAULT 1000,
    vector_dimension INTEGER DEFAULT 1536
)
RETURNS TABLE(
    operation_name TEXT,
    execution_time_ms REAL,
    vectors_per_second REAL
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration_ms REAL;
BEGIN
    -- 1. ベクトル生成のベンチマーク
    start_time := clock_timestamp();
    
    PERFORM array_fill(random()::real, ARRAY[vector_dimension])::vector
    FROM generate_series(1, vector_count);
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(epoch FROM (end_time - start_time)) * 1000;
    
    RETURN QUERY SELECT 
        'ベクトル生成'::TEXT,
        duration_ms,
        (vector_count / GREATEST(duration_ms / 1000, 0.001))::REAL;
    
    -- 2. コサイン距離計算のベンチマーク
    start_time := clock_timestamp();
    
    WITH test_vectors AS (
        SELECT array_fill(random()::real, ARRAY[vector_dimension])::vector as vec
        FROM generate_series(1, LEAST(vector_count, 100))
    ),
    base_vector AS (
        SELECT array_fill(0.5::real, ARRAY[vector_dimension])::vector as base_vec
    )
    SELECT COUNT(*) 
    FROM test_vectors, base_vector
    WHERE test_vectors.vec <=> base_vector.base_vec IS NOT NULL;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(epoch FROM (end_time - start_time)) * 1000;
    
    RETURN QUERY SELECT 
        'コサイン距離計算'::TEXT,
        duration_ms,
        (LEAST(vector_count, 100) / GREATEST(duration_ms / 1000, 0.001))::REAL;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 拡張権限の設定
-- ===================================

-- ベンチマーク関数の権限付与
GRANT EXECUTE ON FUNCTION benchmark_vector_operations(INTEGER, INTEGER) TO authenticated;

-- ===================================
-- 完了ログとサマリー
-- ===================================

DO $$
DECLARE
    extension_version TEXT;
    vector_ops_count INTEGER;
BEGIN
    -- 拡張バージョンの取得
    SELECT extversion INTO extension_version 
    FROM pg_extension 
    WHERE extname = 'vector';
    
    -- ベクトル演算子数の確認
    SELECT COUNT(*) INTO vector_ops_count
    FROM pg_operator 
    WHERE oprname IN ('<->', '<=>', '<#>');
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'pgvector拡張セットアップ完了レポート';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'pgvector バージョン: %', COALESCE(extension_version, 'unknown');
    RAISE NOTICE 'ベクトル演算子: %個 利用可能', vector_ops_count;
    RAISE NOTICE '対応次元数: 1536次元（OpenAI embeddings互換）';
    RAISE NOTICE 'コサイン類似度: 動作確認済み';
    RAISE NOTICE 'ベンチマーク関数: 利用可能';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Issue #25: pgvector拡張設定 - 完了';
    RAISE NOTICE '========================================';
END $$;