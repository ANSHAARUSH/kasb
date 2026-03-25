-- Create a table to store Steve Jobs' quotes and their embeddings
create table if not exists steve_jobs_knowledge (
  id uuid primary key default uuid_generate_v4(),
  content text not null,
  embedding vector(3072),
  source text
);

alter table steve_jobs_knowledge enable row level security;

create policy "Enable all access for steve_jobs_knowledge"
on steve_jobs_knowledge for all
using (true)
with check (true);

-- Create a function to search for matching quotes
create or replace function match_steve_jobs_knowledge (
  query_embedding vector(3072),
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
    steve_jobs_knowledge.id,
    steve_jobs_knowledge.content,
    steve_jobs_knowledge.source,
    1 - (steve_jobs_knowledge.embedding <=> query_embedding) as similarity
  from steve_jobs_knowledge
  where 1 - (steve_jobs_knowledge.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
