-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store Elon's quotes and their embeddings
create table if not exists elon_knowledge (
  id uuid primary key default uuid_generate_v4(),
  content text not null,
  embedding vector(768), -- Gemini text-embedding-004 uses 768 dimensions
  source text -- To store where the quote came from (e.g. filename)
);

-- Note: We add RLS policies here to allow public read (so the AI can query it)
-- but restrict inserts to authenticated admins or service roles if you prefer.
-- For now, we'll allow all operations so you can easily run the ingestion script.
alter table elon_knowledge enable row level security;

create policy "Enable all access for now"
on elon_knowledge for all
using (true)
with check (true);

-- Create a function to search for matching quotes based on vector similarity
create or replace function match_elon_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  source text,
  similarity float
)
language sql stable
as $$
  select
    elon_knowledge.id,
    elon_knowledge.content,
    elon_knowledge.source,
    1 - (elon_knowledge.embedding <=> query_embedding) as similarity
  from elon_knowledge
  where 1 - (elon_knowledge.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
