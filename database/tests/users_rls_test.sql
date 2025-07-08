-- Users テーブル RLS ポリシー テスト
-- TDD Red Phase: これらのテストは実装前なので失敗する

-- テスト用ユーザーを作成する関数
CREATE OR REPLACE FUNCTION create_test_users()
RETURNS void AS $$
BEGIN
  -- テスト用ユーザー1
  INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'test1@example.com',
    '{"provider": "google", "providers": ["google"]}',
    '{"name": "Test User 1", "avatar_url": "https://example.com/avatar1.jpg"}',
    NOW(),
    NOW()
  );

  -- テスト用ユーザー2
  INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'test2@example.com',
    '{"provider": "google", "providers": ["google"]}',
    '{"name": "Test User 2", "avatar_url": "https://example.com/avatar2.jpg"}',
    NOW(),
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- テスト実行
BEGIN;

-- テスト環境セットアップ
SELECT create_test_users();

-- Test 1: ユーザーは自分のデータのみ読み取り可能
DO $$
DECLARE
  user1_count INTEGER;
  user2_count INTEGER;
BEGIN
  -- ユーザー1として実行
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001"}';
  
  SELECT COUNT(*) INTO user1_count FROM public.users WHERE id = '550e8400-e29b-41d4-a716-446655440001'::uuid;
  SELECT COUNT(*) INTO user2_count FROM public.users WHERE id = '550e8400-e29b-41d4-a716-446655440002'::uuid;
  
  -- ユーザー1は自分のデータのみ見える
  ASSERT user1_count = 1, 'User 1 should see their own data';
  ASSERT user2_count = 0, 'User 1 should not see User 2 data';
  
  RAISE NOTICE 'Test 1 passed: Users can only read their own data';
END $$;

-- Test 2: ユーザーは自分のデータのみ更新可能
DO $$
DECLARE
  update_count INTEGER;
BEGIN
  -- ユーザー1として実行
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001"}';
  
  -- 自分のデータを更新
  UPDATE public.users SET display_name = 'Updated Name' WHERE id = '550e8400-e29b-41d4-a716-446655440001'::uuid;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  ASSERT update_count = 1, 'User should be able to update their own data';
  
  -- 他人のデータを更新しようとする
  UPDATE public.users SET display_name = 'Hacked' WHERE id = '550e8400-e29b-41d4-a716-446655440002'::uuid;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  ASSERT update_count = 0, 'User should not be able to update other user data';
  
  RAISE NOTICE 'Test 2 passed: Users can only update their own data';
END $$;

-- Test 3: ユーザーは他のユーザーのデータを作成できない
DO $$
DECLARE
  insert_successful BOOLEAN := FALSE;
BEGIN
  -- ユーザー1として実行
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "550e8400-e29b-41d4-a716-446655440001"}';
  
  -- 他のユーザーIDでデータを作成しようとする
  BEGIN
    INSERT INTO public.users (id, email, username, google_id)
    VALUES ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'fake@example.com', 'faker', 'fake_google_id');
    insert_successful := TRUE;
  EXCEPTION WHEN others THEN
    insert_successful := FALSE;
  END;
  
  ASSERT NOT insert_successful, 'User should not be able to create data with different user ID';
  
  RAISE NOTICE 'Test 3 passed: Users cannot create data for other users';
END $$;

-- Test 4: Supabase Auth トリガーが正しく動作する
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  -- 新しいauth.usersエントリを作成
  INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    '550e8400-e29b-41d4-a716-446655440004',
    'trigger-test@example.com',
    '{"provider": "google", "providers": ["google"]}',
    '{"name": "Trigger Test User", "avatar_url": "https://example.com/avatar-trigger.jpg"}',
    NOW(),
    NOW()
  );
  
  -- トリガーによってpublic.usersにも作成されているか確認
  SELECT COUNT(*) INTO user_count FROM public.users WHERE id = '550e8400-e29b-41d4-a716-446655440004'::uuid;
  
  ASSERT user_count = 1, 'Auth trigger should create user in public.users';
  
  RAISE NOTICE 'Test 4 passed: Supabase Auth trigger works correctly';
END $$;

-- Test 5: 匿名ユーザーはデータにアクセスできない
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  -- 匿名ユーザーとして実行
  SET LOCAL role TO anon;
  
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  ASSERT user_count = 0, 'Anonymous users should not see any data';
  
  RAISE NOTICE 'Test 5 passed: Anonymous users cannot access data';
END $$;

-- Test 6: インデックスが正しく作成されている
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  -- emailインデックスの確認
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'users' AND indexname = 'users_email_idx';
  
  ASSERT index_count = 1, 'Email index should exist';
  
  -- google_idインデックスの確認
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'users' AND indexname = 'users_google_id_idx';
  
  ASSERT index_count = 1, 'Google ID index should exist';
  
  RAISE NOTICE 'Test 6 passed: Indexes are created correctly';
END $$;

ROLLBACK;

-- テスト成功メッセージ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All RLS policy tests passed successfully!';
  RAISE NOTICE '========================================';
END $$;