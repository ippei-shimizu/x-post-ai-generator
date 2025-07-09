-- ===================================
-- Content Sources テーブル作成
-- ===================================
-- ユーザー固有のデータ収集ソース（GitHub、RSS等）を管理するテーブル
-- Row Level Security (RLS) によりユーザーデータを完全分離

-- 必要な拡張機能の確認（UUIDとJSONB用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- Content Sources テーブル作成
-- ===================================
CREATE TABLE IF NOT EXISTS content_sources (
    -- 基本情報
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- データソース情報
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('github', 'rss', 'news', 'api', 'webhook')),
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    
    -- ソース固有設定（JSONB形式で柔軟に管理）
    config JSONB DEFAULT '{}'::jsonb,
    
    -- 収集状態管理
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    fetch_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    
    -- 制御フラグ
    is_active BOOLEAN DEFAULT true,
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 外部キー制約
    CONSTRAINT fk_content_sources_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    -- 制約条件
    CONSTRAINT chk_content_sources_name_length CHECK (length(name) >= 1),
    CONSTRAINT chk_content_sources_url_format CHECK (url ~ '^https?://.*'),
    CONSTRAINT chk_content_sources_fetch_count CHECK (fetch_count >= 0),
    CONSTRAINT chk_content_sources_error_count CHECK (error_count >= 0)
);

-- ===================================
-- インデックス作成（パフォーマンス最適化）
-- ===================================

-- ユーザー別検索用の複合インデックス（最も重要）
CREATE INDEX IF NOT EXISTS idx_content_sources_user_id 
    ON content_sources(user_id);

-- アクティブなソースの検索用
CREATE INDEX IF NOT EXISTS idx_content_sources_user_active 
    ON content_sources(user_id, is_active) 
    WHERE is_active = true;

-- ソースタイプ別検索用
CREATE INDEX IF NOT EXISTS idx_content_sources_user_type 
    ON content_sources(user_id, source_type);

-- 更新日時での並び替え用
CREATE INDEX IF NOT EXISTS idx_content_sources_updated_at 
    ON content_sources(updated_at DESC);

-- 最終取得日時での検索用（データ収集スケジューリング用）
CREATE INDEX IF NOT EXISTS idx_content_sources_last_fetched 
    ON content_sources(last_fetched_at) 
    WHERE is_active = true;

-- JSONB設定検索用（GINインデックス）
CREATE INDEX IF NOT EXISTS idx_content_sources_config 
    ON content_sources USING GIN (config);

-- ===================================
-- Row Level Security (RLS) 設定
-- ===================================

-- RLS有効化
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー: ユーザーは自分のデータソースのみ閲覧可能
CREATE POLICY "Users can view own content sources" 
    ON content_sources 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- INSERT ポリシー: ユーザーは自分のuser_idでのみデータソース作成可能
CREATE POLICY "Users can insert own content sources" 
    ON content_sources 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- UPDATE ポリシー: ユーザーは自分のデータソースのみ更新可能
CREATE POLICY "Users can update own content sources" 
    ON content_sources 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- DELETE ポリシー: ユーザーは自分のデータソースのみ削除可能
CREATE POLICY "Users can delete own content sources" 
    ON content_sources 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ===================================
-- トリガー関数（updated_at自動更新）
-- ===================================

-- updated_at自動更新トリガー
CREATE TRIGGER update_content_sources_updated_at
    BEFORE UPDATE ON content_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- デフォルトデータ・設定例
-- ===================================

-- JSONコンフィグのスキーマ例をコメントで記述
/*
GitHub ソース設定例:
{
  "username": "user123",
  "repositories": ["repo1", "repo2"],
  "include_private": false,
  "fetch_frequency": 6,
  "api_settings": {
    "timeout": 30,
    "retry_count": 3
  }
}

RSS ソース設定例:
{
  "refresh_interval": 3600,
  "max_items": 50,
  "filter_keywords": ["tech", "ai"],
  "exclude_keywords": ["spam"],
  "parse_full_content": true
}

ニュースAPI ソース設定例:
{
  "api_key": "encrypted_key",
  "categories": ["technology", "science"],
  "language": "en",
  "country": "us",
  "max_articles": 100
}
*/

-- ===================================
-- 権限設定
-- ===================================

-- 認証済みユーザーに適切な権限を付与
GRANT SELECT, INSERT, UPDATE, DELETE ON content_sources TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===================================
-- データ整合性チェック関数
-- ===================================

-- URL形式チェック関数
CREATE OR REPLACE FUNCTION validate_content_source_url(url_text TEXT, source_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- 基本的なURL形式チェック
    IF url_text !~ '^https?://.*' THEN
        RETURN FALSE;
    END IF;
    
    -- ソースタイプ別の追加検証
    CASE source_type
        WHEN 'github' THEN
            RETURN url_text ~ '^https://api\.github\.com/.*' OR 
                   url_text ~ '^https://github\.com/.*';
        WHEN 'rss' THEN
            RETURN url_text ~ '\.(xml|rss|atom)$' OR 
                   url_text ~ '/(feed|rss|atom)/?(\?.*)?$';
        ELSE
            RETURN TRUE; -- その他のタイプは基本チェックのみ
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- データ取得統計関数
-- ===================================

-- ユーザーのデータソース統計を取得する関数
CREATE OR REPLACE FUNCTION get_user_content_sources_stats(target_user_id UUID)
RETURNS TABLE(
    total_sources INTEGER,
    active_sources INTEGER,
    by_type JSONB,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- セキュリティチェック: 呼び出し元が対象ユーザーと一致することを確認
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Access denied: Cannot access other user statistics';
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sources,
        COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_sources,
        jsonb_object_agg(
            source_type, 
            COUNT(*) FILTER (WHERE source_type = cs.source_type)
        ) as by_type,
        MAX(updated_at) as last_activity
    FROM content_sources cs
    WHERE cs.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- コメント追加（ドキュメント化）
-- ===================================

COMMENT ON TABLE content_sources IS 'ユーザー固有のデータ収集ソース管理（GitHub、RSS等）';
COMMENT ON COLUMN content_sources.user_id IS 'ソース所有者のユーザーID（外部キー）';
COMMENT ON COLUMN content_sources.source_type IS 'データソースタイプ（github, rss, news, api, webhook）';
COMMENT ON COLUMN content_sources.name IS 'ユーザー定義のソース名';
COMMENT ON COLUMN content_sources.url IS 'データ取得元URL';
COMMENT ON COLUMN content_sources.config IS 'ソース固有の設定（JSONB）';
COMMENT ON COLUMN content_sources.last_fetched_at IS '最終データ取得日時';
COMMENT ON COLUMN content_sources.fetch_count IS '総取得回数';
COMMENT ON COLUMN content_sources.error_count IS 'エラー発生回数';
COMMENT ON COLUMN content_sources.last_error IS '最新のエラーメッセージ';
COMMENT ON COLUMN content_sources.is_active IS 'ソースのアクティブ状態';

-- ===================================
-- 完了ログ
-- ===================================

DO $$
BEGIN
    RAISE NOTICE 'Content Sources テーブル作成完了';
    RAISE NOTICE 'RLS ポリシー設定完了: ユーザー別データ分離';
    RAISE NOTICE 'インデックス作成完了: パフォーマンス最適化';
    RAISE NOTICE 'ユーティリティ関数作成完了: データ整合性とセキュリティ';
END $$;