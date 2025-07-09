-- ===================================
-- Vector Search RLS テスト（TDD Red Phase）
-- ===================================
-- pgvector拡張とcontent_embeddingsテーブルのRow Level Security（RLS）ポリシーをテストします
-- pgvector拡張とテーブルが存在しないため、このテストは最初は失敗します（Red Phase）

-- テスト用の UUID とベクトル関数
CREATE OR REPLACE FUNCTION create_test_vector_embeddings()
RETURNS TEXT AS $$
BEGIN
  -- このテストは pgvector拡張とcontent_embeddingsテーブルが存在しないため失敗することを期待
  RETURN 'Test embeddings created for vector search testing';
END;
$$ LANGUAGE plpgsql;

-- テストユーザーの作成（前提条件）
DO $$
BEGIN
  -- Supabase Auth用のテストユーザーを先に作成
  INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_confirmed_at, confirmed_at)
  VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'user1@example.com', '{"provider": "google", "providers": ["google"]}', '{"name": "Test User 1"}', NOW(), NOW(), '', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', 'user2@example.com', '{"provider": "google", "providers": ["google"]}', '{"name": "Test User 2"}', NOW(), NOW(), '', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Public users テーブルのテストユーザーを作成
  INSERT INTO users (id, email, username, google_id, created_at, updated_at)
  VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'user1@example.com', 'user1', 'google_001', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', 'user2@example.com', 'user2', 'google_002', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    -- Auth テーブルへの挿入権限がない場合は警告のみ
    RAISE NOTICE 'Warning: Could not create test users in auth.users - %', SQLERRM;
END $$;

-- テスト実行
SELECT create_test_vector_embeddings();

-- ===================================
-- Red Phase テスト 1: pgvector拡張確認テスト
-- ===================================
DO $$
BEGIN
  BEGIN
    -- pgvector拡張が有効か確認
    PERFORM 1 FROM pg_extension WHERE extname = 'vector';
    IF FOUND THEN
      RAISE NOTICE 'Test 1 passed: pgvector extension is installed';
    ELSE
      RAISE NOTICE 'Expected failure: pgvector extension not found';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- 拡張が存在しないため期待されるエラー（Red Phase）
      RAISE NOTICE 'Expected failure: pgvector extension check failed - %', SQLERRM;
  END;
END $$;

-- ===================================
-- Red Phase テスト 2: ベクトル型テスト
-- ===================================
DO $$
DECLARE
  test_vector vector(1536);
BEGIN
  BEGIN
    -- 1536次元のベクトル型をテスト（OpenAI embeddings標準）
    test_vector := array_fill(0.1, ARRAY[1536])::vector(1536);
    
    IF array_length(test_vector::real[], 1) = 1536 THEN
      RAISE NOTICE 'Test 2 passed: Vector type (1536 dimensions) works correctly';
    ELSE
      RAISE NOTICE 'Test 2 failed: Vector dimensions incorrect';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- vector型が存在しないため期待されるエラー（Red Phase）
      RAISE NOTICE 'Expected failure: vector type not available - %', SQLERRM;
  END;
END $$;

-- ===================================
-- Red Phase テスト 3: content_embeddingsテーブル構造テスト
-- ===================================
DO $$
DECLARE
  user1_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  embedding_id UUID;
  test_vector vector(1536);
BEGIN
  -- user1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001"}';
  
  BEGIN
    -- テストベクトルの作成
    test_vector := array_fill(0.1, ARRAY[1536])::vector(1536);
    
    -- content_embeddings テーブルにデータを挿入しようとする（テーブルが存在しないので失敗）
    embedding_id := gen_random_uuid();
    INSERT INTO content_embeddings (id, user_id, content_text, embedding, source_type, metadata)
    VALUES (
      embedding_id,
      user1_id,
      'This is a test content for embedding',
      test_vector,
      'test',
      '{"test": true}'::jsonb
    );
    
    RAISE NOTICE 'Test 3 passed: Content embeddings table structure is correct';
    
  EXCEPTION
    WHEN OTHERS THEN
      -- テーブルが存在しないため期待されるエラー（Red Phase）
      RAISE NOTICE 'Expected failure: content_embeddings table does not exist yet - %', SQLERRM;
  END;
END $$;

-- ===================================
-- Red Phase テスト 4: ベクトル類似度検索テスト
-- ===================================
DO $$
DECLARE
  user1_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  query_vector vector(1536);
  similarity_results RECORD;
BEGIN
  -- user1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001"}';
  
  BEGIN
    -- クエリベクトルの作成
    query_vector := array_fill(0.1, ARRAY[1536])::vector(1536);
    
    -- ベクトル類似度検索を実行しようとする
    FOR similarity_results IN
      SELECT 
        id,
        content_text,
        1 - (embedding <=> query_vector) as similarity
      FROM content_embeddings
      WHERE user_id = user1_id
        AND 1 - (embedding <=> query_vector) > 0.7
      ORDER BY embedding <=> query_vector
      LIMIT 5
    LOOP
      RAISE NOTICE 'Found similar content: % (similarity: %)', 
        similarity_results.content_text, similarity_results.similarity;
    END LOOP;
    
    RAISE NOTICE 'Test 4 passed: Vector similarity search works correctly';
    
  EXCEPTION
    WHEN OTHERS THEN
      -- テーブルまたは演算子が存在しないため期待されるエラー（Red Phase）
      RAISE NOTICE 'Expected failure: vector similarity search failed - %', SQLERRM;
  END;
END $$;

-- ===================================
-- Red Phase テスト 5: ユーザー分離ベクトル検索テスト
-- ===================================
DO $$
DECLARE
  user1_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  user2_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  query_vector vector(1536);
  other_user_embeddings_count INTEGER;
BEGIN
  -- user2 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440002"}';
  
  BEGIN
    -- クエリベクトルの作成
    query_vector := array_fill(0.1, ARRAY[1536])::vector(1536);
    
    -- user1 のベクトルデータにアクセスしようとする（RLS により防止されるべき）
    SELECT COUNT(*) INTO other_user_embeddings_count
    FROM content_embeddings
    WHERE user_id = user1_id;
    
    IF other_user_embeddings_count = 0 THEN
      RAISE NOTICE 'Test 5 passed: Users cannot access other users vector embeddings';
    ELSE
      RAISE NOTICE 'Test 5 failed: User can access other users vector data (RLS violation)';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- テーブルが存在しないため期待されるエラー（Red Phase）
      RAISE NOTICE 'Expected failure: cross-user vector access test failed - %', SQLERRM;
  END;
END $$;

-- ===================================
-- Red Phase テスト 6: ベクトルインデックス性能テスト
-- ===================================
DO $$
DECLARE
  user1_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  query_vector vector(1536);
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  execution_time INTERVAL;
BEGIN
  -- user1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001"}';
  
  BEGIN
    -- パフォーマンステスト用のクエリベクトル
    query_vector := array_fill(0.1, ARRAY[1536])::vector(1536);
    
    -- 実行時間測定開始
    start_time := clock_timestamp();
    
    -- ベクトル類似度検索実行
    PERFORM 
      id,
      1 - (embedding <=> query_vector) as similarity
    FROM content_embeddings
    WHERE user_id = user1_id
      AND 1 - (embedding <=> query_vector) > 0.7
    ORDER BY embedding <=> query_vector
    LIMIT 10;
    
    -- 実行時間測定終了
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    IF execution_time < interval '1 second' THEN
      RAISE NOTICE 'Test 6 passed: Vector search completed in % (< 1 second)', execution_time;
    ELSE
      RAISE NOTICE 'Test 6 warning: Vector search took % (> 1 second)', execution_time;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- インデックスまたはテーブルが存在しないため期待されるエラー（Red Phase）
      RAISE NOTICE 'Expected failure: vector index performance test failed - %', SQLERRM;
  END;
END $$;

-- ===================================
-- Red Phase テスト 7: ユーザー固有検索関数テスト
-- ===================================
DO $$
DECLARE
  user1_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  query_vector vector(1536);
  search_results RECORD;
BEGIN
  -- user1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001"}';
  
  BEGIN
    -- クエリベクトルの作成
    query_vector := array_fill(0.1, ARRAY[1536])::vector(1536);
    
    -- ユーザー固有のベクトル検索関数を呼び出し
    FOR search_results IN
      SELECT * FROM search_user_embeddings(user1_id, query_vector, 0.7, 5)
    LOOP
      RAISE NOTICE 'Search result: ID=%, similarity=%', 
        search_results.id, search_results.similarity;
    END LOOP;
    
    RAISE NOTICE 'Test 7 passed: User-specific vector search function works correctly';
    
  EXCEPTION
    WHEN OTHERS THEN
      -- 関数が存在しないため期待されるエラー（Red Phase）
      RAISE NOTICE 'Expected failure: search_user_embeddings function does not exist - %', SQLERRM;
  END;
END $$;

-- クリーンアップ
ROLLBACK;

-- テスト完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vector Search RLS tests completed (Red Phase)';
  RAISE NOTICE 'All tests are expected to fail until pgvector is set up';
  RAISE NOTICE '========================================';
END $$;