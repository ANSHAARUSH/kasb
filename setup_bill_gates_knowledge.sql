-- Create a table to store Bill Gates' quotes and their embeddings
create table if not exists bill_gates_knowledge (
  id uuid primary key default uuid_generate_v4(),
  content text not null,
  embedding vector(3072),
  source text
);

alter table bill_gates_knowledge enable row level security;

create policy "Enable all access for bill_gates_knowledge"
on bill_gates_knowledge for all
using (true)
with check (true);

-- Create a function to search for matching quotes
create or replace function match_bill_gates_knowledge (
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
    bill_gates_knowledge.id,
    bill_gates_knowledge.content,
    bill_gates_knowledge.source,
    1 - (bill_gates_knowledge.embedding <=> query_embedding) as similarity
  from bill_gates_knowledge
  where 1 - (bill_gates_knowledge.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
