-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create personas table
CREATE TABLE IF NOT EXISTS personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    style_settings JSONB DEFAULT '{}',
    tech_interests JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_posts table
CREATE TABLE IF NOT EXISTS generated_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    source_content_ids JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_sources table
CREATE TABLE IF NOT EXISTS content_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create raw_content table
CREATE TABLE IF NOT EXISTS raw_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_id UUID REFERENCES content_sources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT,
    metadata JSONB DEFAULT '{}',
    content_hash VARCHAR(64),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_chunks table
CREATE TABLE IF NOT EXISTS content_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_content_id UUID REFERENCES raw_content(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    token_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_embeddings table with vector support
CREATE TABLE IF NOT EXISTS content_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES content_chunks(id) ON DELETE CASCADE,
    embedding vector(1536),
    model_name VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    similarity_threshold FLOAT DEFAULT 0.7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    ai_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    generation_settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    resource_limits JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_usage_logs table
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_provider VARCHAR(50) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_user_active ON personas(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_generated_posts_user_id ON generated_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_user_status ON generated_posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_content_sources_user_id ON content_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_content_sources_user_active ON content_sources(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_raw_content_user_id ON raw_content(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_content_expires ON raw_content(expires_at);
CREATE INDEX IF NOT EXISTS idx_content_chunks_user_id ON content_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_content_embeddings_user_id ON content_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);

-- Create vector similarity index for content_embeddings
CREATE INDEX IF NOT EXISTS idx_content_embeddings_vector ON content_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_posts_updated_at BEFORE UPDATE ON generated_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();