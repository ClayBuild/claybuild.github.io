-- ============================================================================
-- CLAY — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New Query)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES  (auto-created from auth.users on signup)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  created_at  timestamptz default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. PROJECTS  (one row per user project)
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique,
  owner_id      uuid not null references auth.users (id) on delete cascade,
  business_idea text,
  questionnaire jsonb default '{}'::jsonb,
  design_doc    text,
  website_files jsonb default '{}'::jsonb,
  logo_path     text,
  published_url text,
  status        text default 'draft',  -- draft | generated | published
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists projects_owner_id_idx on public.projects (owner_id);
create index if not exists projects_slug_idx on public.projects (slug);

-- Auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 3. PROJECT_ASSETS  (uploaded files metadata; actual files in Supabase Storage)
-- ----------------------------------------------------------------------------
create table if not exists public.project_assets (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  file_name    text,
  storage_path text,
  created_at   timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- 4. DEPLOYMENTS  (publish history)
-- ----------------------------------------------------------------------------
create table if not exists public.deployments (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  github_folder text,
  github_commit text,
  status        text default 'pending',  -- pending | building | success | errored
  published_url text,
  created_at    timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- 5. USER DATABASE (universal table pattern)
-- ----------------------------------------------------------------------------
-- 5a. project_collections  (AI-aware schema for each collection)
create table if not exists public.project_collections (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  name        text not null,
  schema      jsonb default '{}'::jsonb,
  created_at  timestamptz default now(),
  unique (project_id, name)
);

-- 5b. project_records  (the actual data rows — one big table)
create table if not exists public.project_records (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects (id) on delete cascade,
  collection_name text not null,
  record          jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

create index if not exists project_records_project_idx on public.project_records (project_id);
create index if not exists project_records_collection_idx on public.project_records (project_id, collection_name);

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.projects            enable row level security;
alter table public.project_assets      enable row level security;
alter table public.deployments         enable row level security;
alter table public.project_collections enable row level security;
alter table public.project_records     enable row level security;

-- Profiles: a user can read/update only their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Projects: owners have full control of their projects
create policy "projects_select_own" on public.projects
  for select using (auth.uid() = owner_id);
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = owner_id);
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = owner_id);
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = owner_id);

-- Project assets, deployments, collections, records — all inherit ownership
-- through project_id. We use a sub-query to verify ownership.

create policy "assets_all_own" on public.project_assets
  for all using (
    exists (select 1 from public.projects p
            where p.id = project_assets.project_id and p.owner_id = auth.uid())
  );

create policy "deployments_all_own" on public.deployments
  for all using (
    exists (select 1 from public.projects p
            where p.id = deployments.project_id and p.owner_id = auth.uid())
  );

create policy "collections_all_own" on public.project_collections
  for all using (
    exists (select 1 from public.projects p
            where p.id = project_collections.project_id and p.owner_id = auth.uid())
  );

-- project_records: owner can manage; anon can INSERT (for public form submissions)
-- but only if project owner hasn't disabled public submissions (we allow by default).
create policy "records_select_own" on public.project_records
  for select using (
    exists (select 1 from public.projects p
            where p.id = project_records.project_id and p.owner_id = auth.uid())
  );
create policy "records_insert_own" on public.project_records
  for insert with check (true);  -- public form submissions allowed
create policy "records_update_own" on public.project_records
  for update using (
    exists (select 1 from public.projects p
            where p.id = project_records.project_id and p.owner_id = auth.uid())
  );
create policy "records_delete_own" on public.project_records
  for delete using (
    exists (select 1 from public.projects p
            where p.id = project_records.project_id and p.owner_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 7. STORAGE BUCKET  for uploaded logos / project assets
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', true)
on conflict (id) do nothing;

-- Storage policies: anyone can read (logos need to be public on the deployed site),
-- only authenticated owners can upload into their project folder.
drop policy if exists "project_assets_read" on storage.objects;
create policy "project_assets_read" on storage.objects
  for select using (bucket_id = 'project-assets');

drop policy if exists "project_assets_insert" on storage.objects;
create policy "project_assets_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] in (
      select id::text from public.projects where owner_id = auth.uid()
    )
  );

drop policy if exists "project_assets_update" on storage.objects;
create policy "project_assets_update" on storage.objects
  for update to authenticated using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] in (
      select id::text from public.projects where owner_id = auth.uid()
    )
  );

drop policy if exists "project_assets_delete" on storage.objects;
create policy "project_assets_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] in (
      select id::text from public.projects where owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 8. DONE
-- ----------------------------------------------------------------------------
-- After running this script:
--   1. Storage bucket 'project-assets' is created & public.
--   2. All tables are created with RLS enabled.
--   3. Auto-profile creation trigger is active.
--
-- Next: deploy Edge Functions (see SETUP.md → "Deploy Edge Functions")
-- and set secrets:
--   supabase secrets set OPENROUTER_API_KEY=sk-or-v1-xxxxx
--   supabase secrets set GITHUB_PAT=github_pat_YOUR_FINE_GRAINED_PAT
--   supabase secrets set GITHUB_OWNER=ClayBuild
--   supabase secrets set GITHUB_REPO=claybuild.github.io
--   supabase secrets set CLAY_DOMAIN=claybuild.github.io
