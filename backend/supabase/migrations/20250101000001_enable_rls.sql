-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create function to get current user ID from JWT
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = current_user_id());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = current_user_id());

-- Personas table policies
CREATE POLICY "Users can manage own personas" ON personas
  FOR ALL USING (user_id = current_user_id());

-- Content sources table policies
CREATE POLICY "Users can manage own content sources" ON content_sources
  FOR ALL USING (user_id = current_user_id());

-- Raw content table policies
CREATE POLICY "Users can manage own raw content" ON raw_content
  FOR ALL USING (user_id = current_user_id());

-- Content chunks table policies
CREATE POLICY "Users can manage own content chunks" ON content_chunks
  FOR ALL USING (user_id = current_user_id());

-- Content embeddings table policies
CREATE POLICY "Users can manage own content embeddings" ON content_embeddings
  FOR ALL USING (user_id = current_user_id());

-- Generated posts table policies
CREATE POLICY "Users can manage own generated posts" ON generated_posts
  FOR ALL USING (user_id = current_user_id());

-- User settings table policies
CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (user_id = current_user_id());

-- API usage logs table policies
CREATE POLICY "Users can view own API usage logs" ON api_usage_logs
  FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Service role can insert API usage logs" ON api_usage_logs
  FOR INSERT WITH CHECK (true);

-- Create function for user content search
CREATE OR REPLACE FUNCTION search_user_content(
  target_user_id UUID,
  query_vector vector(1536),
  similarity_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  chunk_text TEXT,
  similarity FLOAT,
  title TEXT,
  url TEXT,
  metadata JSONB
) AS $$
BEGIN
  -- Verify the requesting user can only access their own data
  IF target_user_id != current_user_id() THEN
    RAISE EXCEPTION 'Access denied: Cannot search other users content';
  END IF;

  RETURN QUERY
  SELECT 
    ce.id,
    cc.chunk_text,
    (1 - (ce.embedding <=> query_vector)) as similarity,
    rc.title,
    rc.url,
    rc.metadata
  FROM content_embeddings ce
  JOIN content_chunks cc ON ce.chunk_id = cc.id
  JOIN raw_content rc ON cc.raw_content_id = rc.id
  WHERE ce.user_id = target_user_id
    AND (1 - (ce.embedding <=> query_vector)) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;