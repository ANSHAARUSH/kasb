-- Drop the old search function first because it depends on the column type
drop function if exists match_elon_knowledge;

-- Change the vector size to 3072 to match Gemini's actual output size
alter table elon_knowledge alter column embedding type vector(3072);

-- Recreate the search function with the new 3072 dimension size
create or replace function match_elon_knowledge (
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
    elon_knowledge.id,
    elon_knowledge.content,
    elon_knowledge.source,
    1 - (elon_knowledge.embedding <=> query_embedding) as similarity
  from elon_knowledge
  where 1 - (elon_knowledge.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
