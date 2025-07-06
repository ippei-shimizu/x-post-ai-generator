-- ===================================
-- NextAuth.js + RLS 統合関数
-- ===================================

-- ユーザーコンテキスト設定関数
-- NextAuth.js のセッションから取得したユーザーIDを
-- PostgreSQL セッション変数に設定してRLSで使用可能にする

CREATE OR REPLACE FUNCTION set_user_context(user_id uuid)
RETURNS void AS $$
BEGIN
    -- セッション変数にユーザーIDを設定
    PERFORM set_config('app.current_user_id', user_id::text, true);
    
    -- ログ出力（開発時のデバッグ用）
    RAISE NOTICE 'User context set: %', user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- RLS用ヘルパー関数
-- ===================================

-- 現在のユーザーIDを取得する関数
-- RLS ポリシーで使用
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS uuid AS $$
BEGIN
    -- セッション変数からユーザーIDを取得
    RETURN current_setting('app.current_user_id', true)::uuid;
EXCEPTION
    WHEN OTHERS THEN
        -- ユーザーコンテキストが設定されていない場合はNULLを返す
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NextAuth.js認証済みユーザーかチェックする関数
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS boolean AS $$
BEGIN
    RETURN current_user_id() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーがリソースにアクセス可能かチェックする関数
CREATE OR REPLACE FUNCTION can_access_user_data(resource_user_id uuid)
RETURNS boolean AS $$
BEGIN
    -- 現在のユーザーIDとリソースのuser_idが一致するかチェック
    RETURN current_user_id() = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- デバッグ・監査用関数
-- ===================================

-- 現在のユーザーコンテキストを確認する関数
CREATE OR REPLACE FUNCTION debug_current_context()
RETURNS TABLE(
    current_user_id uuid,
    is_authenticated boolean,
    session_user name,
    current_database name
) AS $$
BEGIN
    RETURN QUERY SELECT 
        current_user_id() as current_user_id,
        is_authenticated() as is_authenticated,
        session_user,
        current_database();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- 権限設定
-- ===================================

-- authenticated ロールに関数実行権限を付与
GRANT EXECUTE ON FUNCTION set_user_context(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_authenticated() TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_user_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION debug_current_context() TO authenticated;

-- anon ロール（未認証）には制限付きアクセス
GRANT EXECUTE ON FUNCTION current_user_id() TO anon;
GRANT EXECUTE ON FUNCTION is_authenticated() TO anon;

-- ===================================
-- コメント
-- ===================================

COMMENT ON FUNCTION set_user_context(uuid) IS 'NextAuth.js セッションからのユーザーコンテキスト設定';
COMMENT ON FUNCTION current_user_id() IS 'RLS ポリシー用の現在ユーザーID取得';
COMMENT ON FUNCTION is_authenticated() IS 'NextAuth.js 認証状態確認';
COMMENT ON FUNCTION can_access_user_data(uuid) IS 'ユーザーデータアクセス権限チェック';
COMMENT ON FUNCTION debug_current_context() IS 'デバッグ用: 現在の認証コンテキスト表示';