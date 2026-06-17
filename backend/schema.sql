-- SQL Script to set up the analyses table in Supabase

-- Drop the table if it already exists
DROP TABLE IF EXISTS analyses;

-- Create analyses table
CREATE TABLE analyses (
    document_id UUID PRIMARY KEY,
    user_id VARCHAR(255) DEFAULT 'default_user',
    summary JSONB NOT NULL,
    risks JSONB NOT NULL,
    clauses JSONB NOT NULL,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
