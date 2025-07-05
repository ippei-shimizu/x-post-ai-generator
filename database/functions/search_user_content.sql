-- Function to search user-specific content using vector similarity
-- This function ensures data isolation by requiring user_id parameter
-- and only returning results for the authenticated user
CREATE OR REPLACE FUNCTION search_user_content(
    target_user_id UUID,
    query_vector vector(1536),
    similarity_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify that the requesting user matches the target user (additional security layer)
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Access denied: Cannot search other user content';
    END IF;

    -- Return similar content chunks for the authenticated user only
    RETURN QUERY
    SELECT 
        ce.id,
        cc.chunk_text as content,
        (ce.embedding <=> query_vector) * -1 + 1 as similarity,
        JSONB_BUILD_OBJECT(
            'chunk_id', cc.id,
            'raw_content_id', cc.raw_content_id,
            'chunk_index', cc.chunk_index,
            'token_count', cc.token_count,
            'model_name', ce.model_name,
            'created_at', ce.created_at
        ) as metadata
    FROM content_embeddings ce
    JOIN content_chunks cc ON ce.chunk_id = cc.id
    WHERE 
        ce.user_id = target_user_id
        AND cc.user_id = target_user_id  -- Double-check user isolation
        AND (ce.embedding <=> query_vector) < (1 - similarity_threshold)  -- Cosine distance threshold
    ORDER BY ce.embedding <=> query_vector
    LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_user_content TO authenticated;

-- Create function to get user RAG metrics
CREATE OR REPLACE FUNCTION get_user_rag_metrics(
    target_user_id UUID,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_queries INTEGER,
    avg_similarity FLOAT,
    content_sources INTEGER,
    quality_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    query_count INTEGER;
    avg_sim FLOAT;
    source_count INTEGER;
    quality FLOAT;
BEGIN
    -- Verify that the requesting user matches the target user
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Access denied: Cannot access other user metrics';
    END IF;

    -- Count API usage for search operations
    SELECT COUNT(*) INTO query_count
    FROM api_usage_logs
    WHERE user_id = target_user_id
        AND operation = 'search_content'
        AND created_at BETWEEN start_date AND end_date;

    -- Calculate average similarity from embeddings (proxy for content quality)
    SELECT AVG(similarity_threshold) INTO avg_sim
    FROM content_embeddings
    WHERE user_id = target_user_id
        AND created_at BETWEEN start_date AND end_date;

    -- Count active content sources
    SELECT COUNT(*) INTO source_count
    FROM content_sources
    WHERE user_id = target_user_id
        AND is_active = true;

    -- Calculate quality score (simple heuristic)
    quality := LEAST(
        (source_count * 0.3) + 
        (COALESCE(avg_sim, 0.7) * 0.7), 
        1.0
    );

    -- Return metrics
    RETURN QUERY SELECT 
        COALESCE(query_count, 0) as total_queries,
        COALESCE(avg_sim, 0.0) as avg_similarity,
        COALESCE(source_count, 0) as content_sources,
        COALESCE(quality, 0.0) as quality_score;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_rag_metrics TO authenticated;