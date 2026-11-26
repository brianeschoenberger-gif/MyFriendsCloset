-- Draft for a disposable Supabase-compatible PostgreSQL database.
-- It is not connected to GitHub Pages and is never run by this repository's deploy workflow.
begin;

create table public.closet_garments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  category text not null check (category in ('Tops', 'Bottoms', 'Dresses', 'Sets', 'Jackets', 'Shoes', 'Accessories')),
  color text not null default '' check (char_length(color) <= 35),
  notes text not null default '' check (char_length(notes) <= 600),
  photo_ready boolean not null default false,
  photo_object_key text generated always as (owner_id::text || '/' || id::text || '/garment.jpg') stored,
  created_at timestamptz not null default statement_timestamp()
);
create index closet_garments_owner_idx on public.closet_garments(owner_id);

alter table public.closet_garments enable row level security;
alter table public.closet_garments force row level security;
revoke all privileges on public.closet_garments from public, anon, authenticated;
grant select, delete on public.closet_garments to authenticated;
grant insert (id, owner_id, name, category, color, notes, photo_ready) on public.closet_garments to authenticated;
grant update (name, category, color, notes, photo_ready) on public.closet_garments to authenticated;

create policy closet_garments_own on public.closet_garments
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create table public.closet_styling_consent (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  version text not null check (version = 'wardrobe-metadata-v1'),
  enabled boolean not null default false
);

alter table public.closet_styling_consent enable row level security;
alter table public.closet_styling_consent force row level security;
revoke all privileges on public.closet_styling_consent from public, anon, authenticated;
grant select, insert, delete on public.closet_styling_consent to authenticated;
grant update (version, enabled) on public.closet_styling_consent to authenticated;

create policy closet_styling_consent_own on public.closet_styling_consent
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

commit;
