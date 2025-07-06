-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
-- Users can only see their own record
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for personas table
-- Users can only access their own personas
CREATE POLICY "Users can view own personas" ON personas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personas" ON personas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personas" ON personas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personas" ON personas
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for generated_posts table
-- Users can only access their own posts
CREATE POLICY "Users can view own posts" ON generated_posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON generated_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON generated_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON generated_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for content_sources table
-- Users can only access their own content sources
CREATE POLICY "Users can view own content sources" ON content_sources
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content sources" ON content_sources
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content sources" ON content_sources
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content sources" ON content_sources
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for raw_content table
-- Users can only access their own raw content
CREATE POLICY "Users can view own raw content" ON raw_content
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own raw content" ON raw_content
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own raw content" ON raw_content
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own raw content" ON raw_content
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for content_chunks table
-- Users can only access their own content chunks
CREATE POLICY "Users can view own content chunks" ON content_chunks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content chunks" ON content_chunks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content chunks" ON content_chunks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content chunks" ON content_chunks
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for content_embeddings table (CRITICAL for user data isolation)
-- Users can only access their own embeddings - this is crucial for RAG system privacy
CREATE POLICY "Users can view own embeddings" ON content_embeddings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own embeddings" ON content_embeddings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own embeddings" ON content_embeddings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own embeddings" ON content_embeddings
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_settings table
-- Users can only access their own settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for api_usage_logs table
-- Users can only view their own usage logs
CREATE POLICY "Users can view own usage logs" ON api_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" ON api_usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Note: Users typically shouldn't update or delete usage logs for audit purposes
-- Only system/admin level access should be allowed for those operations