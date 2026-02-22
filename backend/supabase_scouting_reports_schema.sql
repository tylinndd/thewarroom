-- Supabase schema for RAG scouting reports (guide §4)
-- Run this in the Supabase SQL Editor to enable RAG for AI Chat

-- Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Scouting reports table for RAG context
CREATE TABLE IF NOT EXISTS scouting_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    player_id INTEGER,
    player_name TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    embedding vector(1536)  -- OpenAI text-embedding-3-small dimension; use 768 for smaller models
);

-- Index for fast similarity search
CREATE INDEX IF NOT EXISTS scouting_reports_embedding_idx ON scouting_reports
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Optional: index on player_id for filtered lookups
CREATE INDEX IF NOT EXISTS scouting_reports_player_id_idx ON scouting_reports(player_id);

-- RPC function for similarity search (to retrieve relevant reports for RAG)
CREATE OR REPLACE FUNCTION match_scouting_reports(
    query_embedding vector(1536),
    match_count int DEFAULT 5,
    filter_player_id int DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    player_id INTEGER,
    player_name TEXT,
    source TEXT,
    distance float
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sr.id,
        sr.content,
        sr.player_id,
        sr.player_name,
        sr.source,
        1 - (sr.embedding <=> query_embedding) AS distance
    FROM scouting_reports sr
    WHERE (filter_player_id IS NULL OR sr.player_id = filter_player_id)
      AND sr.embedding IS NOT NULL
    ORDER BY sr.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS if needed (adjust policies for your auth setup)
-- ALTER TABLE scouting_reports ENABLE ROW LEVEL SECURITY;
