-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing idea embeddings (positive and negative)
CREATE TABLE IF NOT EXISTS idea_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES synthesis_results(id) ON DELETE CASCADE,
  embedding vector(768), -- text-embedding-004 is 768d
  is_rejected boolean DEFAULT false, -- True if this idea was rejected by the Architect
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create index for fast retrieval
CREATE INDEX IF NOT EXISTS idea_embeddings_embedding_idx ON idea_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RPC function for similarity search
create or replace function match_idea_embeddings (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  idea_id uuid,
  is_rejected boolean,
  rejection_reason text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    idea_embeddings.id,
    idea_embeddings.idea_id,
    idea_embeddings.is_rejected,
    idea_embeddings.rejection_reason,
    1 - (idea_embeddings.embedding <=> query_embedding) as similarity
  from idea_embeddings
  where 1 - (idea_embeddings.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
