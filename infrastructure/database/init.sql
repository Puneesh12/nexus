-- NEXUS — PostgreSQL initialization script
-- This runs once when the database container is first created.
-- Alembic migrations handle schema creation after this.

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable full-text search with pg_trgm for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable case-insensitive text (for entity normalization)
CREATE EXTENSION IF NOT EXISTS citext;
