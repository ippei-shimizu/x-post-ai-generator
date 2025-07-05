# Database Setup for X-Post-AI-Generator

## Overview

This directory contains the database schema, migrations, functions, and tests for the X-Post-AI-Generator project. The database uses PostgreSQL with pgvector extension for vector similarity search and Row Level Security (RLS) for complete user data isolation.

## Key Features

- **User Data Isolation**: Complete separation of user data using RLS policies
- **Vector Search**: pgvector integration for semantic content search
- **Audit Trail**: API usage logging for cost tracking and analytics
- **Automatic Cleanup**: 30-day expiration for raw content to manage storage

## Directory Structure

```
database/
├── migrations/           # Database schema migrations
│   ├── 001_create_initial_schema.sql
│   └── 002_enable_rls_policies.sql
├── functions/           # PostgreSQL functions
│   └── search_user_content.sql
├── tests/              # Database tests
│   └── rls_user_isolation_test.sql
└── README.md           # This file
```

## Setup Instructions

### 1. Prerequisites

- PostgreSQL 14+ with pgvector extension
- Supabase CLI (for local development)
- UUID-OSSP extension

### 2. Local Development Setup

```bash
# Initialize Supabase (if not already done)
npx supabase init

# Start local Supabase
npx supabase start

# Apply migrations
npx supabase db push

# Run tests
npx supabase db test
```

### 3. Production Setup

1. Create a new Supabase project
2. Enable the vector extension in the SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Apply migrations through Supabase dashboard or CLI
4. Configure RLS policies
5. Set up Google OAuth provider

## Database Schema

### Core Tables

- **users**: User authentication and profile data
- **personas**: User-specific AI personas for content generation
- **generated_posts**: AI-generated social media posts
- **content_sources**: User-configured data sources (GitHub, RSS, etc.)
- **raw_content**: Collected content (30-day retention)
- **content_chunks**: Text chunks for vector processing
- **content_embeddings**: Vector embeddings for similarity search
- **user_settings**: User-specific configuration
- **api_usage_logs**: API cost tracking and analytics

### Security Features

#### Row Level Security (RLS)
All tables implement RLS policies ensuring users can only access their own data:

```sql
-- Example policy
CREATE POLICY "Users can view own personas" ON personas
    FOR SELECT USING (auth.uid() = user_id);
```

#### Vector Search Isolation
The `search_user_content` function includes additional security checks:

```sql
-- Verify user access
IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot search other user content';
END IF;
```

## Functions

### search_user_content()
Performs vector similarity search within user's own content:
- **Input**: user_id, query_vector, similarity_threshold, match_count
- **Output**: Relevant content chunks with similarity scores
- **Security**: Enforces user data isolation

### get_user_rag_metrics()
Analyzes user-specific RAG system performance:
- **Input**: user_id, date_range
- **Output**: Quality metrics and usage statistics
- **Security**: User-scoped analytics only

## Testing

### RLS Testing
Run the isolation tests to verify security:

```bash
psql -f database/tests/rls_user_isolation_test.sql
```

### Test Coverage
- User data isolation across all tables
- Vector search security
- Function access control
- Cross-user data access prevention

## Performance Considerations

### Indexes
Optimized indexes for user-scoped queries:
- `idx_content_embeddings_user_id`: Fast user filtering
- `idx_content_embeddings_vector`: Vector similarity search
- `idx_*_user_*`: User-scoped composite indexes

### Vector Search Optimization
- IVFFLAT index with 100 lists for 1536-dimensional vectors
- Cosine similarity for semantic matching
- Configurable similarity thresholds per user

## Monitoring and Maintenance

### Automatic Cleanup
- Raw content expires after 30 days
- Expired content cascades to related tables
- Keeps storage usage optimized

### Cost Tracking
- Per-user API usage logging
- Token consumption tracking
- Cost analysis by operation type

## Environment Variables

Required environment variables for database connection:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

## Security Best Practices

1. **Never disable RLS** on any table containing user data
2. **Always test policies** after schema changes
3. **Use service role key** only for administrative operations
4. **Regular security audits** of database access patterns
5. **Monitor for policy violations** in logs

## Troubleshooting

### Common Issues

1. **RLS Policy Violations**
   - Check `auth.uid()` is properly set
   - Verify user_id columns match authenticated user
   - Test policies in isolation

2. **Vector Search Performance**
   - Ensure proper index creation
   - Check vector dimensions (must be 1536)
   - Monitor query execution plans

3. **Migration Failures**
   - Verify extension dependencies
   - Check for conflicting policies
   - Review constraint violations

### Debug Queries

```sql
-- Check current user context
SELECT auth.uid();

-- Test RLS policy
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM personas WHERE user_id = auth.uid();

-- Monitor vector search performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM content_embeddings 
ORDER BY embedding <=> '[0.1,0.2,0.3]'::vector 
LIMIT 10;
```

## Contributing

When adding new tables or modifying schema:

1. Create migration files with sequential numbering
2. Add corresponding RLS policies
3. Update TypeScript types in frontend
4. Add test cases for data isolation
5. Update this documentation

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)