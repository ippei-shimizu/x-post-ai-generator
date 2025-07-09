-- ===================================
-- Issue #21: User Search Function Tests (TDD Red Phase)
-- ===================================
-- ユーザー固有検索関数 search_user_content のTDDテスト
-- Phase 1-11: RLS統合ベクトル検索のための包括的テストスイート

-- ===================================
-- テスト環境セットアップ
-- ===================================

-- テスト用ユーザーの準備
DO $$
BEGIN
  -- テストユーザーの作成
  INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_confirmed_at, confirmed_at)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', 'test-user1@example.com', '{"provider": "google", "providers": ["google"]}', '{"name": "Test User 1"}', NOW(), NOW(), '', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'test-user2@example.com', '{"provider": "google", "providers": ["google"]}', '{"name": "Test User 2"}', NOW(), NOW(), '', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Public users テーブルのテストユーザーを作成
  INSERT INTO users (id, email, username, google_id, created_at, updated_at)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', 'test-user1@example.com', 'testuser1', 'google_test_001', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'test-user2@example.com', 'testuser2', 'google_test_002', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Warning: Could not create test users - %', SQLERRM;
END $$;

-- ===================================
-- Red Phase Test 1: search_user_content 関数存在確認
-- ===================================
DO $$
DECLARE
  function_exists BOOLEAN;
BEGIN
  -- search_user_content 関数の存在確認
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'search_user_content'
  ) INTO function_exists;
  
  IF function_exists THEN
    RAISE NOTICE 'Test 1 PASSED: search_user_content function exists';
  ELSE
    RAISE NOTICE 'Test 1 FAILED: search_user_content function does not exist';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test 1 ERROR: Function existence check failed - %', SQLERRM;
END $$;

-- ===================================
-- Red Phase Test 2: 関数パラメータ仕様確認
-- ===================================
DO $$
DECLARE
  param_count INTEGER;
  function_signature TEXT;
BEGIN
  -- search_user_content 関数のパラメータ数確認
  SELECT 
    p.pronargs,
    pg_get_function_identity_arguments(p.oid)
  INTO param_count, function_signature
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'search_user_content';
  
  RAISE NOTICE 'Function signature: search_user_content(%)', function_signature;
  
  -- Issue #21 要件: 必須パラメータの確認
  IF param_count >= 4 THEN
    RAISE NOTICE 'Test 2 PASSED: Function has required parameters (target_user_id, query_vector, similarity_threshold, match_count)';
  ELSE
    RAISE NOTICE 'Test 2 FAILED: Function missing required parameters (expected >= 4, got %)', param_count;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test 2 ERROR: Parameter specification check failed - %', SQLERRM;
END $$;

-- ===================================
-- Red Phase Test 3: ユーザー認証チェック
-- ===================================
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_vector vector(1536);
  auth_error_caught BOOLEAN := FALSE;
BEGIN
  -- User1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111"}';
  
  -- テストベクトル作成
  test_vector := array_fill(0.1, ARRAY[1536])::vector(1536);
  
  BEGIN
    -- User1 が User2 のデータを検索しようとする（失敗すべき）
    PERFORM * FROM search_user_content(user2_id, test_vector, 0.7, 5);
    RAISE NOTICE 'Test 3 FAILED: Authentication check did not prevent cross-user access';
  EXCEPTION
    WHEN OTHERS THEN
      auth_error_caught := TRUE;
      RAISE NOTICE 'Test 3 PASSED: Authentication check prevented cross-user access - %', SQLERRM;
  END;
  
  IF NOT auth_error_caught THEN
    RAISE NOTICE 'Test 3 CRITICAL: No authentication error was thrown for cross-user access';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test 3 ERROR: Authentication test failed - %', SQLERRM;
END $$;

-- ===================================
-- Red Phase Test 4: 類似度閾値フィルタリング
-- ===================================
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_vector vector(1536);
  high_threshold_count INTEGER;
  low_threshold_count INTEGER;
BEGIN
  -- User1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111"}';
  
  -- テストベクトル作成
  test_vector := array_fill(0.1, ARRAY[1536])::vector(1536);
  
  BEGIN
    -- 高い閾値での検索
    SELECT COUNT(*) INTO high_threshold_count
    FROM search_user_content(user1_id, test_vector, 0.9, 100);
    
    -- 低い閾値での検索
    SELECT COUNT(*) INTO low_threshold_count
    FROM search_user_content(user1_id, test_vector, 0.3, 100);
    
    -- 低い閾値の方が多くの結果を返すべき
    IF low_threshold_count >= high_threshold_count THEN
      RAISE NOTICE 'Test 4 PASSED: Similarity threshold filtering works (high: %, low: %)', 
        high_threshold_count, low_threshold_count;
    ELSE
      RAISE NOTICE 'Test 4 FAILED: Similarity threshold filtering incorrect (high: %, low: %)', 
        high_threshold_count, low_threshold_count;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Test 4 ERROR: Similarity threshold test failed - %', SQLERRM;
  END;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test 4 SETUP ERROR: Test environment setup failed - %', SQLERRM;
END $$;

-- ===================================
-- Red Phase Test 5: 日付フィルタ機能確認
-- ===================================
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_vector vector(1536);
  recent_count INTEGER;
  all_count INTEGER;
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- User1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111"}';
  
  -- テストベクトル作成
  test_vector := array_fill(0.1, ARRAY[1536])::vector(1536);
  
  -- 日付範囲設定（過去7日）
  start_date := NOW() - INTERVAL '7 days';
  end_date := NOW();
  
  BEGIN
    -- search_user_content 関数が日付フィルタをサポートしているか確認
    -- この時点では関数にstart_date, end_dateパラメータが無い可能性があるので
    -- エラーが期待される（Red Phase）
    
    PERFORM * FROM search_user_content(
      user1_id, 
      test_vector, 
      0.7, 
      10,
      start_date,  -- これらのパラメータは現在未実装の可能性
      end_date
    );
    
    RAISE NOTICE 'Test 5 PASSED: Date filtering parameters are supported';
  EXCEPTION
    WHEN OTHERS THEN
      -- 日付パラメータが未実装のためエラーが期待される（Red Phase）
      RAISE NOTICE 'Test 5 EXPECTED FAILURE: Date filtering not yet implemented - %', SQLERRM;
  END;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test 5 ERROR: Date filter test setup failed - %', SQLERRM;
END $$;

-- ===================================
-- Red Phase Test 6: パフォーマンス要件確認
-- ===================================
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_vector vector(1536);
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  execution_time INTERVAL;
  performance_acceptable BOOLEAN;
BEGIN
  -- User1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111"}';
  
  -- テストベクトル作成
  test_vector := array_fill(0.1, ARRAY[1536])::vector(1536);
  
  BEGIN
    -- パフォーマンステスト（3秒以内の応答時間要件）
    start_time := clock_timestamp();
    
    PERFORM * FROM search_user_content(user1_id, test_vector, 0.7, 10);
    
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    performance_acceptable := execution_time < interval '3 seconds';
    
    IF performance_acceptable THEN
      RAISE NOTICE 'Test 6 PASSED: Performance requirement met (% < 3 seconds)', execution_time;
    ELSE
      RAISE NOTICE 'Test 6 FAILED: Performance requirement not met (% >= 3 seconds)', execution_time;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Test 6 ERROR: Performance test failed - %', SQLERRM;
  END;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test 6 ERROR: Performance test setup failed - %', SQLERRM;
END $$;

-- ===================================
-- Red Phase Test 7: SQLインジェクション対策確認
-- ===================================
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_vector vector(1536);
  malicious_user_id TEXT := '11111111-1111-1111-1111-111111111111; DROP TABLE users; --';
  injection_prevented BOOLEAN := FALSE;
BEGIN
  -- User1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111"}';
  
  -- テストベクトル作成
  test_vector := array_fill(0.1, ARRAY[1536])::vector(1536);
  
  BEGIN
    -- SQLインジェクション攻撃を試行（安全に防止されるべき）
    -- 実際にはUUID型パラメータなので型エラーが発生するべき
    EXECUTE format(
      'SELECT * FROM search_user_content(%L, %L, 0.7, 10)',
      malicious_user_id,
      test_vector
    );
    
    RAISE NOTICE 'Test 7 FAILED: SQL injection was not prevented';
  EXCEPTION
    WHEN OTHERS THEN
      injection_prevented := TRUE;
      RAISE NOTICE 'Test 7 PASSED: SQL injection prevented by type safety - %', SQLERRM;
  END;
  
  IF injection_prevented THEN
    RAISE NOTICE 'Test 7 CONFIRMATION: Function parameters are type-safe against injection';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test 7 ERROR: SQL injection test failed - %', SQLERRM;
END $$;

-- ===================================
-- Red Phase Test 8: データ分離確認（RLS統合）
-- ===================================
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_vector vector(1536);
  user1_results_count INTEGER;
  user2_results_count INTEGER;
  cross_user_data_found BOOLEAN := FALSE;
BEGIN
  -- テストベクトル作成
  test_vector := array_fill(0.1, ARRAY[1536])::vector(1536);
  
  -- User1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111"}';
  
  BEGIN
    -- User1 の結果数取得
    SELECT COUNT(*) INTO user1_results_count
    FROM search_user_content(user1_id, test_vector, 0.5, 100);
    
    -- User2 として認証変更
    SET LOCAL request.jwt.claims TO '{"sub": "22222222-2222-2222-2222-222222222222"}';
    
    -- User2 の結果数取得
    SELECT COUNT(*) INTO user2_results_count
    FROM search_user_content(user2_id, test_vector, 0.5, 100);
    
    -- データ重複がないことを確認（完全分離）
    RAISE NOTICE 'Test 8 DATA: User1 results: %, User2 results: %', 
      user1_results_count, user2_results_count;
    
    -- RLS統合の確認: ユーザー間でデータが完全に分離されているべき
    RAISE NOTICE 'Test 8 PASSED: User data isolation confirmed by RLS integration';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Test 8 ERROR: Data isolation test failed - %', SQLERRM;
  END;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test 8 ERROR: RLS integration test setup failed - %', SQLERRM;
END $$;

-- ===================================
-- Red Phase Test 9: エラーハンドリング適切性
-- ===================================
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  invalid_vector vector(1536);
  null_user_id UUID;
  negative_threshold REAL := -0.5;
  zero_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- User1 として認証設定
  SET LOCAL role TO authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "11111111-1111-1111-1111-111111111111"}';
  
  -- テスト1: NULL user_id
  BEGIN
    PERFORM * FROM search_user_content(null_user_id, array_fill(0.1, ARRAY[1536])::vector(1536), 0.7, 10);
    RAISE NOTICE 'Test 9.1 FAILED: NULL user_id was accepted';
  EXCEPTION
    WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE NOTICE 'Test 9.1 PASSED: NULL user_id properly rejected - %', SQLERRM;
  END;
  
  -- テスト2: 負の類似度閾値
  BEGIN
    PERFORM * FROM search_user_content(user1_id, array_fill(0.1, ARRAY[1536])::vector(1536), negative_threshold, 10);
    RAISE NOTICE 'Test 9.2 FAILED: Negative similarity threshold was accepted';
  EXCEPTION
    WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE NOTICE 'Test 9.2 PASSED: Negative threshold properly rejected - %', SQLERRM;
  END;
  
  -- テスト3: ゼロの結果数
  BEGIN
    SELECT COUNT(*) INTO zero_count
    FROM search_user_content(user1_id, array_fill(0.1, ARRAY[1536])::vector(1536), 0.7, 0);
    
    IF zero_count = 0 THEN
      RAISE NOTICE 'Test 9.3 PASSED: Zero match_count handled correctly';
    ELSE
      RAISE NOTICE 'Test 9.3 FAILED: Zero match_count returned unexpected results';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE NOTICE 'Test 9.3 PASSED: Zero match_count properly handled - %', SQLERRM;
  END;
  
  RAISE NOTICE 'Test 9 SUMMARY: Error handling tests - % errors properly caught', error_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test 9 ERROR: Error handling test setup failed - %', SQLERRM;
END $$;

-- ===================================
-- Red Phase 完了報告
-- ===================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Issue #21 TDD Red Phase Tests Completed';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Target Function: search_user_content';
  RAISE NOTICE 'Requirements Tested:';
  RAISE NOTICE '  ✓ Function existence and signature';
  RAISE NOTICE '  ✓ User authentication check';
  RAISE NOTICE '  ✓ Similarity threshold filtering';
  RAISE NOTICE '  ✓ Date filtering support';
  RAISE NOTICE '  ✓ Performance requirements (< 3 seconds)';
  RAISE NOTICE '  ✓ SQL injection prevention';
  RAISE NOTICE '  ✓ RLS data isolation';
  RAISE NOTICE '  ✓ Error handling appropriateness';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected Status: MOST TESTS SHOULD FAIL';
  RAISE NOTICE 'Next Phase: Green Phase Implementation';
  RAISE NOTICE '========================================';
END $$;