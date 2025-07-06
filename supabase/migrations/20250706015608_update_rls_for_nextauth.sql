-- ===================================
-- NextAuth.js 対応 RLS ポリシー更新
-- ===================================

-- ===================================
-- NextAuth.js 統合関数を追加
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
CREATE OR REPLACE FUNCTION can_access_user_data(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
    -- 認証されていない場合はアクセス拒否
    IF NOT is_authenticated() THEN
        RETURN FALSE;
    END IF;
    
    -- 自分のデータのみアクセス可能
    RETURN current_user_id() = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- auth_users テーブルの追加RLSポリシー
-- ===================================

-- Service Role による操作を許可（NextAuth.js バックエンド用）
CREATE POLICY "Service role can manage all auth_users"
    ON auth_users
    USING (auth.jwt()->>'role' = 'service_role');

-- 関数へのアクセス権限設定
GRANT EXECUTE ON FUNCTION set_user_context(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_authenticated() TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_user_data(uuid) TO authenticated;

-- ===================================
-- 完了ログ
-- ===================================

DO $$
BEGIN
    RAISE NOTICE 'NextAuth.js RLS 関数作成完了';
    RAISE NOTICE '- set_user_context: ユーザーコンテキスト設定';
    RAISE NOTICE '- current_user_id: 現在のユーザーID取得';
    RAISE NOTICE '- is_authenticated: 認証状態確認';
    RAISE NOTICE '- can_access_user_data: アクセス権限確認';
END $$;