-- ============================================================
-- CASE FILE №2026-AM — Supabase schema (Phase 2)
--
-- Run this once in the Supabase SQL Editor (Dashboard → SQL).
--
-- Design note: content is stored as one jsonb document per
-- section (matching content.json) rather than fully normalized
-- tables. For a single-owner portfolio this keeps the public
-- read path to ONE request, makes the nightly snapshot trivial,
-- and the Phase-3 admin panel edits each section through a
-- structured form bound to the same JSON shape. The security
-- model is identical either way: RLS lets the world read and
-- only the owner write.
-- ============================================================

create table if not exists public.content (
  key        text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- keep updated_at honest
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists content_touch on public.content;
create trigger content_touch
  before update on public.content
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Row Level Security — THE security boundary.
-- Public visitors can only SELECT. Every write must come from
-- the one authenticated owner account, verified by user id.
-- ============================================================
alter table public.content enable row level security;

-- everyone (including anon) may read
drop policy if exists "public read" on public.content;
create policy "public read"
  on public.content for select
  using (true);

-- ONLY the owner may insert/update/delete.
-- (The UUID below is the owner's auth user id — not a secret;
-- it grants nothing without that account's password.)
drop policy if exists "owner writes" on public.content;
create policy "owner writes"
  on public.content for all
  using  (auth.uid() = 'bbc11068-828e-4235-a723-f3b4bb8e198b'::uuid)
  with check (auth.uid() = 'bbc11068-828e-4235-a723-f3b4bb8e198b'::uuid);

-- ============================================================
-- Checklist after running this (see EVIDENCE_BOARD_REDESIGN.md §5–6):
--  1. Authentication → Sign In / Up: DISABLE new user signups.
--  2. Create exactly one user (you), with a strong password.
--  3. Enable MFA (TOTP) on that account.
--  4. Seed the data:  python scripts/seed_supabase.py
--  5. Put the project URL + anon key into config.js.
-- ============================================================
