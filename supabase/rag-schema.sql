-- ============================================================
-- THE INTERROGATION ROOM — RAG schema (Phase 4)
--
-- Run in the Supabase SQL Editor AFTER schema.sql.
--
-- The documents/rate tables are accessed ONLY by the serverless
-- function using the service_role key (which bypasses RLS).
-- RLS is enabled with no policies, so the public anon key can
-- neither read the raw chunks nor tamper with the counters.
-- ============================================================

create extension if not exists vector;

-- ------------------------------------------------------------
-- Case-file chunks + embeddings
-- vector(1024) matches voyage-3.5-lite / voyage-3.5 output.
-- If you use a different embedding model, change the dimension
-- here AND re-run scripts/build_index.py.
-- ------------------------------------------------------------
create table if not exists public.documents (
  id         uuid primary key default gen_random_uuid(),
  source_key text not null,          -- which content section it came from
  label      text not null,          -- citation shown to visitors, e.g. 'EXHIBIT A'
  anchor     text not null,          -- link target on the board, e.g. '#projects'
  content    text not null,
  embedding  vector(1024) not null,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;
-- no policies: service_role only

-- similarity search used by /api/interrogate
create or replace function public.match_documents(
  query_embedding vector(1024),
  match_count int default 5
)
returns table (label text, anchor text, content text, similarity float)
language sql stable as $$
  select
    d.label,
    d.anchor,
    d.content,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  order by d.embedding <=> query_embedding
  limit least(match_count, 10);
$$;

-- ------------------------------------------------------------
-- Rate limiting (fixed window per counter key)
-- ------------------------------------------------------------
create table if not exists public.rate_counters (
  key          text primary key,
  count        int not null,
  window_start timestamptz not null
);

alter table public.rate_counters enable row level security;
-- no policies: service_role only

-- Increments the counter and reports whether this request is
-- within the limit. The window resets once it has fully elapsed.
create or replace function public.bump_counter(
  counter_key text,
  max_count int,
  window_seconds int
)
returns boolean
language plpgsql as $$
declare
  allowed boolean;
begin
  insert into public.rate_counters as rc (key, count, window_start)
  values (counter_key, 1, now())
  on conflict (key) do update set
    count = case
      when rc.window_start < now() - make_interval(secs => window_seconds) then 1
      else rc.count + 1
    end,
    window_start = case
      when rc.window_start < now() - make_interval(secs => window_seconds) then now()
      else rc.window_start
    end;

  select rc.count <= max_count into allowed
  from public.rate_counters rc
  where rc.key = counter_key;

  return allowed;
end $$;

-- Keep the RPC surface off the public anon role entirely.
revoke execute on function public.match_documents(vector, int) from anon;
revoke execute on function public.bump_counter(text, int, int) from anon;
