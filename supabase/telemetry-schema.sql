-- ============================================================
-- Interrogation Room telemetry: question log + answer cache
-- Run once in the Supabase SQL Editor (after rag-schema.sql).
-- ============================================================

-- Every question visitors ask — your private market research.
create table if not exists public.asked_questions (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answered   boolean not null default true,
  cached     boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.asked_questions enable row level security;

-- Only the owner may read the log (writes come from the serverless
-- function via the service role, which bypasses RLS).
drop policy if exists "owner reads questions" on public.asked_questions;
create policy "owner reads questions"
  on public.asked_questions for select
  using (auth.uid() = 'bbc11068-828e-4235-a723-f3b4bb8e198b'::uuid);

-- Cache of generated answers, keyed by normalized-question hash.
-- Cleared automatically whenever the index is rebuilt.
create table if not exists public.answer_cache (
  question_hash text primary key,
  question      text not null,
  answer        jsonb not null,
  created_at    timestamptz not null default now()
);

alter table public.answer_cache enable row level security;
-- no policies: service_role only
