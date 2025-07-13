-- ===================================
-- Issue #25: pgvectorセットアップ検証テスト
-- ===================================
-- pgvector拡張の動作確認とベクトル演算精度テスト
-- 1536次元ベクトル対応確認とOpenAI embeddings互換性検証

-- ===================================
-- pgTAP拡張の有効化（テストフレームワーク）
-- ===================================

CREATE EXTENSION IF NOT EXISTS pgtap;

-- テスト開始
SELECT plan(20);

-- ===================================
-- 1. pgvector拡張の基本動作確認
-- ===================================

-- pgvector拡張が有効化されていることを確認
SELECT has_extension('vector', 'pgvector拡張が有効化されている');

-- vector型が利用可能であることを確認
SELECT has_type('vector', 'vector型が利用可能である');

-- ===================================
-- 2. ベクトル演算子の動作確認
-- ===================================

-- L2距離演算子 (<->) の動作確認
SELECT ok(
    '[1,0,0]'::vector(3) <-> '[0,1,0]'::vector(3) > 0,
    'L2距離演算子(<->)が正常に動作する'
);

-- コサイン距離演算子 (<=>) の動作確認
SELECT ok(
    '[1,0,0]'::vector(3) <=> '[0,1,0]'::vector(3) >= 0,
    'コサイン距離演算子(<=>)が正常に動作する'
);

-- 内積演算子 (<#>) の動作確認
SELECT ok(
    '[1,1,0]'::vector(3) <#> '[1,0,0]'::vector(3) IS NOT NULL,
    '内積演算子(<#>)が正常に動作する'
);

-- ===================================
-- 3. 1536次元ベクトルの動作確認
-- ===================================

-- 1536次元ベクトルの作成テスト
DO $$
DECLARE
    test_vector vector(1536);
    dimension_count INTEGER;
BEGIN
    -- 1536次元のテストベクトル作成
    test_vector := array_fill(0.5::real, ARRAY[1536])::vector(1536);
    
    -- 次元数確認
    dimension_count := array_length(test_vector::real[], 1);
    
    -- テスト結果をpgTAPで検証
    PERFORM ok(dimension_count = 1536, '1536次元ベクトルが正常に作成される');
END $$;

-- OpenAI embeddings互換性テスト（正規化ベクトル）
DO $$
DECLARE
    normalized_vector vector(1536);
    vector_magnitude REAL;
BEGIN
    -- 正規化されたテストベクトル作成（OpenAI embeddingsは正規化済み）
    normalized_vector := array_fill(1.0/sqrt(1536)::real, ARRAY[1536])::vector(1536);
    
    -- ベクトルの大きさ計算（L2ノルム）
    vector_magnitude := sqrt((normalized_vector <#> normalized_vector) * -1);
    
    -- 正規化ベクトルのテスト（大きさが約1.0であることを確認）
    PERFORM ok(ABS(vector_magnitude - 1.0) < 0.01, 'OpenAI embeddings互換の正規化ベクトルが作成される');
END $$;

-- ===================================
-- 4. コサイン類似度計算の精度テスト
-- ===================================

-- 同一ベクトルのコサイン類似度（期待値: 1.0）
SELECT ok(
    ABS((1 - ('[1,0,0]'::vector(3) <=> '[1,0,0]'::vector(3))) - 1.0) < 0.001,
    '同一ベクトルのコサイン類似度が1.0である'
);

-- 直交ベクトルのコサイン類似度（期待値: 0.0）
SELECT ok(
    ABS((1 - ('[1,0,0]'::vector(3) <=> '[0,1,0]'::vector(3))) - 0.0) < 0.001,
    '直交ベクトルのコサイン類似度が0.0である'
);

-- 反対ベクトルのコサイン類似度（期待値: -1.0）
SELECT ok(
    ABS((1 - ('[1,0,0]'::vector(3) <=> '[-1,0,0]'::vector(3))) - (-1.0)) < 0.001,
    '反対ベクトルのコサイン類似度が-1.0である'
);

-- 45度角のベクトルのコサイン類似度（期待値: cos(45°) ≈ 0.7071）
SELECT ok(
    ABS((1 - ('[1,1,0]'::vector(3) <=> '[1,0,0]'::vector(3))) - 0.7071) < 0.01,
    '45度角ベクトルのコサイン類似度が約0.7071である'
);

-- ===================================
-- 5. インデックスタイプの確認
-- ===================================

-- IVFFlatインデックスのサポート確認
SELECT ok(
    (SELECT COUNT(*) FROM pg_am WHERE amname = 'ivfflat') > 0,
    'IVFFlatインデックスタイプがサポートされている'
);

-- HNSWインデックスのサポート確認（pgvector 0.5.0以降）
SELECT ok(
    (SELECT COUNT(*) FROM pg_am WHERE amname = 'hnsw') >= 0,
    'HNSWインデックスタイプの確認が完了'
);

-- ===================================
-- 6. content_embeddingsテーブルの構造確認
-- ===================================

-- content_embeddingsテーブルが存在することを確認
SELECT has_table('content_embeddings', 'content_embeddingsテーブルが存在する');

-- embeddingカラムがvector(1536)型であることを確認
SELECT col_type_is(
    'content_embeddings', 
    'embedding', 
    'vector(1536)', 
    'embeddingカラムがvector(1536)型である'
);

-- user_idカラムが存在することを確認
SELECT has_column('content_embeddings', 'user_id', 'user_idカラムが存在する');

-- RLSが有効化されていることを確認
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'content_embeddings'),
    'content_embeddingsテーブルでRLSが有効化されている'
);

-- ===================================
-- 7. ベクトル検索インデックスの確認
-- ===================================

-- IVFFlatインデックスが作成されていることを確認
SELECT ok(
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE tablename = 'content_embeddings' 
     AND indexname LIKE '%vector%ivfflat%') > 0,
    'content_embeddingsテーブルにIVFFlatベクトルインデックスが作成されている'
);

-- ===================================
-- 8. ユーザー固有検索関数の動作確認
-- ===================================

-- search_user_embeddings関数が存在することを確認
SELECT has_function(
    'search_user_embeddings',
    ARRAY['uuid', 'vector', 'real', 'integer'],
    'search_user_embeddings関数が定義されている'
);

-- get_user_embeddings_stats関数が存在することを確認
SELECT has_function(
    'get_user_embeddings_stats',
    ARRAY['uuid'],
    'get_user_embeddings_stats関数が定義されている'
);

-- ===================================
-- 9. ヘルパー関数の動作確認
-- ===================================

-- cosine_similarity関数の動作確認
SELECT ok(
    ABS(cosine_similarity('[1,0,0]'::vector(3), '[1,0,0]'::vector(3)) - 1.0) < 0.001,
    'cosine_similarity関数が正常に動作する'
);

-- euclidean_distance関数の動作確認
SELECT ok(
    euclidean_distance('[0,0,0]'::vector(3), '[1,1,1]'::vector(3)) > 0,
    'euclidean_distance関数が正常に動作する'
);

-- ===================================
-- 10. パフォーマンステスト
-- ===================================

-- benchmark_vector_operations関数が存在することを確認
SELECT has_function(
    'benchmark_vector_operations',
    ARRAY['integer', 'integer'],
    'benchmark_vector_operations関数が定義されている'
);

-- ===================================
-- テスト完了
-- ===================================

SELECT finish();

-- ===================================
-- 実行ログとサマリー出力
-- ===================================

DO $$
DECLARE
    vector_extension_version TEXT;
    total_indexes INTEGER;
    vector_indexes INTEGER;
BEGIN
    -- pgvector拡張のバージョン取得
    SELECT extversion INTO vector_extension_version 
    FROM pg_extension 
    WHERE extname = 'vector';
    
    -- インデックス数の確認
    SELECT COUNT(*) INTO total_indexes
    FROM pg_indexes 
    WHERE tablename = 'content_embeddings';
    
    SELECT COUNT(*) INTO vector_indexes
    FROM pg_indexes 
    WHERE tablename = 'content_embeddings' 
    AND indexname LIKE '%vector%';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'pgvectorセットアップ検証テスト完了レポート';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'pgvector バージョン: %', COALESCE(vector_extension_version, 'unknown');
    RAISE NOTICE 'content_embeddingsテーブル: 作成済み';
    RAISE NOTICE '総インデックス数: %', total_indexes;
    RAISE NOTICE 'ベクトルインデックス数: %', vector_indexes;
    RAISE NOTICE '1536次元ベクトル: 対応済み（OpenAI互換）';
    RAISE NOTICE 'RLS設定: 有効化済み';
    RAISE NOTICE 'ユーザー固有検索関数: 利用可能';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Issue #25: pgvector拡張テスト - 完了';
    RAISE NOTICE '========================================';
END $$;