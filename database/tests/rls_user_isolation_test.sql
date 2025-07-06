-- Test suite for RLS and user data isolation
-- This test ensures that users cannot access other users' data

BEGIN;

-- Create test users
INSERT INTO auth.users (id, email) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'user1@test.com'),
    ('00000000-0000-0000-0000-000000000002', 'user2@test.com');

-- Insert test users into our users table
INSERT INTO users (id, email, google_id) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'user1@test.com', 'google_id_1'),
    ('00000000-0000-0000-0000-000000000002', 'user2@test.com', 'google_id_2');

-- Test 1: User can only see their own personas
-- Set context for user 1
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000001"}', true);

-- Insert personas for both users
INSERT INTO personas (user_id, name) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'User 1 Persona'),
    ('00000000-0000-0000-0000-000000000002', 'User 2 Persona');

-- User 1 should only see their own persona
DO $$
DECLARE
    persona_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO persona_count FROM personas;
    IF persona_count != 1 THEN
        RAISE EXCEPTION 'RLS FAILURE: User 1 can see % personas, expected 1', persona_count;
    END IF;
    
    -- Verify it's the correct persona
    IF NOT EXISTS (SELECT 1 FROM personas WHERE name = 'User 1 Persona') THEN
        RAISE EXCEPTION 'RLS FAILURE: User 1 cannot see their own persona';
    END IF;
    
    RAISE NOTICE 'PASS: User 1 can only see their own persona';
END $$;

-- Test 2: User cannot insert data for other users
-- Try to insert a persona for user 2 while authenticated as user 1
DO $$
BEGIN
    BEGIN
        INSERT INTO personas (user_id, name) VALUES 
            ('00000000-0000-0000-0000-000000000002', 'Malicious Persona');
        RAISE EXCEPTION 'RLS FAILURE: User 1 was able to insert data for User 2';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: User 1 cannot insert data for User 2';
        WHEN OTHERS THEN
            RAISE EXCEPTION 'UNEXPECTED ERROR: %', SQLERRM;
    END;
END $$;

-- Test 3: Switch to user 2 and verify isolation
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000002"}', true);

DO $$
DECLARE
    persona_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO persona_count FROM personas;
    IF persona_count != 1 THEN
        RAISE EXCEPTION 'RLS FAILURE: User 2 can see % personas, expected 1', persona_count;
    END IF;
    
    -- Verify it's the correct persona
    IF NOT EXISTS (SELECT 1 FROM personas WHERE name = 'User 2 Persona') THEN
        RAISE EXCEPTION 'RLS FAILURE: User 2 cannot see their own persona';
    END IF;
    
    RAISE NOTICE 'PASS: User 2 can only see their own persona';
END $$;

-- Test 4: Test content_embeddings isolation (critical for RAG system)
-- Insert test embeddings for both users
INSERT INTO raw_content (id, user_id, title, content) VALUES 
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'User 1 Content', 'Content for user 1'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'User 2 Content', 'Content for user 2');

INSERT INTO content_chunks (id, user_id, raw_content_id, chunk_text, chunk_index) VALUES 
    ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'User 1 chunk', 1),
    ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'User 2 chunk', 1);

INSERT INTO content_embeddings (user_id, chunk_id, embedding) VALUES 
    ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '[0.1,0.2,0.3]'::vector),
    ('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '[0.4,0.5,0.6]'::vector);

-- Set context for user 1
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000001"}', true);

DO $$
DECLARE
    embedding_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO embedding_count FROM content_embeddings;
    IF embedding_count != 1 THEN
        RAISE EXCEPTION 'RLS FAILURE: User 1 can see % embeddings, expected 1', embedding_count;
    END IF;
    
    RAISE NOTICE 'PASS: User 1 can only see their own embeddings';
END $$;

-- Test 5: Test search_user_content function isolation
-- User 1 should not be able to search user 2's content
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000001"}', true);

DO $$
DECLARE
    search_results INTEGER;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO search_results 
        FROM search_user_content(
            '00000000-0000-0000-0000-000000000002'::UUID,  -- Try to search user 2's content
            '[0.1,0.2,0.3]'::vector,
            0.5,
            10
        );
        RAISE EXCEPTION 'RLS FAILURE: User 1 was able to search User 2 content';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%Access denied%' THEN
                RAISE NOTICE 'PASS: User 1 cannot search User 2 content';
            ELSE
                RAISE EXCEPTION 'UNEXPECTED ERROR: %', SQLERRM;
            END IF;
    END;
END $$;

-- Test 6: User can search their own content
DO $$
DECLARE
    search_results INTEGER;
BEGIN
    SELECT COUNT(*) INTO search_results 
    FROM search_user_content(
        '00000000-0000-0000-0000-000000000001'::UUID,  -- Search own content
        '[0.1,0.2,0.3]'::vector,
        0.5,
        10
    );
    
    IF search_results = 0 THEN
        RAISE EXCEPTION 'RLS FAILURE: User 1 cannot search their own content';
    END IF;
    
    RAISE NOTICE 'PASS: User 1 can search their own content (found % results)', search_results;
END $$;

-- Cleanup
ROLLBACK;