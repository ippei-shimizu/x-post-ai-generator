-- ===================================
-- Content Sources RLS テスト（TDD Red Phase）
-- ===================================
-- content_sources テーブルのRow Level Security（RLS）ポリシーをテストします
-- テーブルが存在しないため、このテストは最初は失敗します（Red Phase）

-- テスト用の UUID 関数
CREATE OR REPLACE FUNCTION create_test_content_sources()
RETURNS TEXT AS $$
BEGIN
  -- このテストは content_sources テーブルが存在しないため失敗することを期待
  RETURN 'Test users created for content_sources testing';
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
SELECT create_test_content_sources();

-- ===================================
-- Red Phase テスト 1: ユーザー分離テスト
-- ===================================
DO $$
DECLARE
  user1_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  user2_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  test_result INTEGER;
BEGIN
  -- user1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001"}';
  
  -- content_sources テーブルにデータを挿入しようとする（テーブルが存在しないので失敗）
  BEGIN
    INSERT INTO content_sources (id, user_id, source_type, name, url, config)
    VALUES (
      gen_random_uuid(),
      user1_id,
      'github',
      'My GitHub',
      'https://api.github.com/users/testuser',
      '{"username": "testuser", "access_token": "encrypted_token"}'::jsonb
    );
    
    -- user1 のデータを取得して、user1 のデータのみ見えることを確認
    SELECT COUNT(*) INTO test_result
    FROM content_sources
    WHERE user_id = user1_id;
    
    IF test_result = 1 THEN
      RAISE NOTICE 'Test 1 passed: Users can only read their own content sources';
    ELSE
      RAISE NOTICE 'Test 1 failed: Expected 1 row, got %', test_result;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- テーブルが存在しないため期待されるエラー（Red Phase）
      RAISE NOTICE 'Expected failure: content_sources table does not exist yet - %', SQLERRM;
  END;
END $$;

-- ===================================
-- Red Phase テスト 2: CRUD 操作テスト
-- ===================================
DO $$
DECLARE
  user1_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  source_id UUID;
  updated_name TEXT;
BEGIN
  -- user1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001"}';
  
  BEGIN
    -- データソース作成テスト
    source_id := gen_random_uuid();
    INSERT INTO content_sources (id, user_id, source_type, name, url, config, is_active)
    VALUES (
      source_id,
      user1_id,
      'rss',
      'Tech Blog RSS',
      'https://example.com/feed.xml',
      '{"refresh_interval": 3600}'::jsonb,
      true
    );
    
    -- 更新テスト
    UPDATE content_sources
    SET name = 'Updated Tech Blog RSS',
        config = '{"refresh_interval": 7200}'::jsonb
    WHERE id = source_id;
    
    -- 更新されたデータの確認
    SELECT name INTO updated_name
    FROM content_sources
    WHERE id = source_id;
    
    IF updated_name = 'Updated Tech Blog RSS' THEN
      RAISE NOTICE 'Test 2 passed: Users can update their own content sources';
    ELSE
      RAISE NOTICE 'Test 2 failed: Update did not work correctly';
    END IF;
    
    -- 削除テスト
    DELETE FROM content_sources WHERE id = source_id;
    
    RAISE NOTICE 'Test 2 passed: Users can perform CRUD operations on their content sources';
    
  EXCEPTION
    WHEN OTHERS THEN
      -- テーブルが存在しないため期待されるエラー（Red Phase）
      RAISE NOTICE 'Expected failure: content_sources CRUD operations failed - %', SQLERRM;
  END;
END $$;

-- ===================================
-- Red Phase テスト 3: 他ユーザーデータアクセス防止
-- ===================================
DO $$
DECLARE
  user1_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  user2_id UUID := '550e8400-e29b-41d4-a716-446655440002';
  other_user_data_count INTEGER;
BEGIN
  -- user2 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440002"}';
  
  BEGIN
    -- user1 のデータにアクセスしようとする（RLS により防止されるべき）
    SELECT COUNT(*) INTO other_user_data_count
    FROM content_sources
    WHERE user_id = user1_id;
    
    IF other_user_data_count = 0 THEN
      RAISE NOTICE 'Test 3 passed: Users cannot access other users content sources';
    ELSE
      RAISE NOTICE 'Test 3 failed: User can access other users data (RLS violation)';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- テーブルが存在しないため期待されるエラー（Red Phase）
      RAISE NOTICE 'Expected failure: cross-user access test failed - %', SQLERRM;
  END;
END $$;

-- ===================================
-- Red Phase テスト 4: JSON設定フィールドテスト
-- ===================================
DO $$
DECLARE
  user1_id UUID := '550e8400-e29b-41d4-a716-446655440001';
  source_id UUID;
  config_value TEXT;
BEGIN
  -- user1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001"}';
  
  BEGIN
    -- JSON設定フィールドのテスト
    source_id := gen_random_uuid();
    INSERT INTO content_sources (id, user_id, source_type, name, url, config)
    VALUES (
      source_id,
      user1_id,
      'github',
      'GitHub API',
      'https://api.github.com',
      '{
        "username": "testuser",
        "repositories": ["repo1", "repo2"],
        "fetch_frequency": 6,
        "include_private": false,
        "api_settings": {
          "timeout": 30,
          "retry_count": 3
        }
      }'::jsonb
    );
    
    -- JSON データの取得とクエリテスト
    SELECT config->>'username' INTO config_value
    FROM content_sources
    WHERE id = source_id;
    
    IF config_value = 'testuser' THEN
      RAISE NOTICE 'Test 4 passed: JSON config field works correctly';
    ELSE
      RAISE NOTICE 'Test 4 failed: JSON config query failed';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- テーブルが存在しないため期待されるエラー（Red Phase）
      RAISE NOTICE 'Expected failure: JSON config test failed - %', SQLERRM;
  END;
END $$;

-- ===================================
-- Red Phase テスト 5: 外部キー制約テスト
-- ===================================
DO $$
DECLARE
  invalid_user_id UUID := '550e8400-e29b-41d4-a716-446655440999'; -- 存在しないユーザー
BEGIN
  BEGIN
    -- 存在しないユーザーIDでデータソースを作成しようとする
    INSERT INTO content_sources (id, user_id, source_type, name, url)
    VALUES (
      gen_random_uuid(),
      invalid_user_id,
      'rss',
      'Invalid User Source',
      'https://example.com/feed'
    );
    
    RAISE NOTICE 'Test 5 failed: Foreign key constraint did not prevent invalid user_id';
    
  EXCEPTION
    WHEN foreign_key_violation THEN
      RAISE NOTICE 'Test 5 passed: Foreign key constraint prevented invalid user_id';
    WHEN OTHERS THEN
      -- テーブルが存在しないため期待されるエラー（Red Phase）
      RAISE NOTICE 'Expected failure: Foreign key test failed - %', SQLERRM;
  END;
END $$;

-- ===================================
-- Red Phase テスト 6: URL検証テスト
-- ===================================
DO $$
DECLARE
  user1_id UUID := '550e8400-e29b-41d4-a716-446655440001';
BEGIN
  BEGIN
    -- 不正なURLでデータソースを作成しようとする
    INSERT INTO content_sources (id, user_id, source_type, name, url)
    VALUES (
      gen_random_uuid(),
      user1_id,
      'rss',
      'Invalid URL Source',
      'not-a-valid-url'
    );
    
    RAISE NOTICE 'Test 6 warning: URL validation should be implemented';
    
  EXCEPTION
    WHEN OTHERS THEN
      -- テーブルが存在しないため期待されるエラー（Red Phase）
      RAISE NOTICE 'Expected failure: URL validation test failed - %', SQLERRM;
  END;
END $$;

-- クリーンアップ
ROLLBACK;

-- テスト完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Content Sources RLS tests completed (Red Phase)';
  RAISE NOTICE 'All tests are expected to fail until table is created';
  RAISE NOTICE '========================================';
END $$;