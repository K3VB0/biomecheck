-- BiomeCheck Supabase schema
-- Run this file in Supabase Dashboard > SQL Editor.
-- Keep Row Level Security enabled. The frontend uses the public anon key.
-- This schema does not seed demo companies, sites, files, reports, or users.
-- The only INSERT statements create required Storage buckets and auth profile rows
-- when real Supabase Auth users are created.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role text not null default 'evaluator' check (role in ('master', 'supervisor', 'evaluator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'master' check (role in ('master', 'supervisor', 'evaluator')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table if not exists public.industrial_sites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  address text,
  city text,
  country text default 'PE',
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.workstations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  site_id uuid references public.industrial_sites(id) on delete cascade,
  name text not null,
  sector text,
  created_at timestamptz not null default now()
);

create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  site_id uuid references public.industrial_sites(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_size bigint not null default 0,
  storage_bucket text not null default 'biomecheck-files',
  storage_path text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'processed', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.ergonomic_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  site_id uuid references public.industrial_sites(id) on delete set null,
  uploaded_file_id uuid references public.uploaded_files(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null default 'REBA',
  source_model text,
  score integer not null default 0,
  risk_code text not null default 'unknown',
  risk_label text not null default 'Sin clasificar',
  angles jsonb not null default '{}'::jsonb,
  recommendations text,
  snapshot_bucket text default 'biomecheck-snapshots',
  snapshot_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.report_segments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.ergonomic_reports(id) on delete cascade,
  segment text not null,
  score numeric,
  risk_code text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.action_plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  site_id uuid references public.industrial_sites(id) on delete set null,
  report_id uuid references public.ergonomic_reports(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  due_date date,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    'master'
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_company_master(target_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = (select auth.uid())
      and cm.role = 'master'
  );
$$;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.industrial_sites enable row level security;
alter table public.workstations enable row level security;
alter table public.uploaded_files enable row level security;
alter table public.ergonomic_reports enable row level security;
alter table public.report_segments enable row level security;
alter table public.action_plans enable row level security;

drop policy if exists "Profiles can view own profile" on public.profiles;
create policy "Profiles can view own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Profiles can update own profile" on public.profiles;
create policy "Profiles can update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Profiles can insert own profile" on public.profiles;
create policy "Profiles can insert own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can create companies" on public.companies;
create policy "Users can create companies"
on public.companies for insert
to authenticated
with check ((select auth.uid()) = created_by);

drop policy if exists "Company members can view companies" on public.companies;
create policy "Company members can view companies"
on public.companies for select
to authenticated
using (public.is_company_member(id));

drop policy if exists "Company creators can view companies" on public.companies;
create policy "Company creators can view companies"
on public.companies for select
to authenticated
using (created_by = (select auth.uid()));

drop policy if exists "Company masters can update companies" on public.companies;
create policy "Company masters can update companies"
on public.companies for update
to authenticated
using (public.is_company_master(id))
with check (public.is_company_master(id));

drop policy if exists "Users can add own company membership" on public.company_members;
create policy "Users can add own company membership"
on public.company_members for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Members can view memberships" on public.company_members;
create policy "Members can view memberships"
on public.company_members for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "Masters can manage memberships" on public.company_members;
create policy "Masters can manage memberships"
on public.company_members for update
to authenticated
using (public.is_company_master(company_id))
with check (public.is_company_master(company_id));

drop policy if exists "Masters can delete memberships" on public.company_members;
create policy "Masters can delete memberships"
on public.company_members for delete
to authenticated
using (public.is_company_master(company_id));

drop policy if exists "Members can view sites" on public.industrial_sites;
create policy "Members can view sites"
on public.industrial_sites for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "Masters can manage sites" on public.industrial_sites;
create policy "Masters can manage sites"
on public.industrial_sites for all
to authenticated
using (public.is_company_master(company_id))
with check (public.is_company_master(company_id));

drop policy if exists "Members can view workstations" on public.workstations;
create policy "Members can view workstations"
on public.workstations for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "Members can create workstations" on public.workstations;
create policy "Members can create workstations"
on public.workstations for insert
to authenticated
with check (public.is_company_member(company_id));

drop policy if exists "Members can view files" on public.uploaded_files;
create policy "Members can view files"
on public.uploaded_files for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "Members can insert files" on public.uploaded_files;
create policy "Members can insert files"
on public.uploaded_files for insert
to authenticated
with check ((select auth.uid()) = user_id and public.is_company_member(company_id));

drop policy if exists "Members can update own files" on public.uploaded_files;
create policy "Members can update own files"
on public.uploaded_files for update
to authenticated
using ((select auth.uid()) = user_id and public.is_company_member(company_id))
with check ((select auth.uid()) = user_id and public.is_company_member(company_id));

drop policy if exists "Members can view reports" on public.ergonomic_reports;
create policy "Members can view reports"
on public.ergonomic_reports for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "Members can insert reports" on public.ergonomic_reports;
create policy "Members can insert reports"
on public.ergonomic_reports for insert
to authenticated
with check ((select auth.uid()) = user_id and public.is_company_member(company_id));

drop policy if exists "Members can update own reports" on public.ergonomic_reports;
create policy "Members can update own reports"
on public.ergonomic_reports for update
to authenticated
using ((select auth.uid()) = user_id and public.is_company_member(company_id))
with check ((select auth.uid()) = user_id and public.is_company_member(company_id));

drop policy if exists "Members can view report segments" on public.report_segments;
create policy "Members can view report segments"
on public.report_segments for select
to authenticated
using (
  exists (
    select 1
    from public.ergonomic_reports r
    where r.id = report_id and public.is_company_member(r.company_id)
  )
);

drop policy if exists "Members can insert report segments" on public.report_segments;
create policy "Members can insert report segments"
on public.report_segments for insert
to authenticated
with check (
  exists (
    select 1
    from public.ergonomic_reports r
    where r.id = report_id and r.user_id = (select auth.uid()) and public.is_company_member(r.company_id)
  )
);

drop policy if exists "Members can view action plans" on public.action_plans;
create policy "Members can view action plans"
on public.action_plans for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "Members can manage action plans" on public.action_plans;
create policy "Members can manage action plans"
on public.action_plans for all
to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('biomecheck-files', 'biomecheck-files', false, 3221225472, array['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/webp']),
  ('biomecheck-snapshots', 'biomecheck-snapshots', false, 52428800, array['image/jpeg', 'image/png', 'image/webp']),
  ('biomecheck-reports', 'biomecheck-reports', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload BiomeCheck storage" on storage.objects;
create policy "Authenticated users can upload BiomeCheck storage"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('biomecheck-files', 'biomecheck-snapshots', 'biomecheck-reports')
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "Authenticated users can read own BiomeCheck storage" on storage.objects;
create policy "Authenticated users can read own BiomeCheck storage"
on storage.objects for select
to authenticated
using (
  bucket_id in ('biomecheck-files', 'biomecheck-snapshots', 'biomecheck-reports')
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "Authenticated users can update own BiomeCheck storage" on storage.objects;
create policy "Authenticated users can update own BiomeCheck storage"
on storage.objects for update
to authenticated
using (
  bucket_id in ('biomecheck-files', 'biomecheck-snapshots', 'biomecheck-reports')
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id in ('biomecheck-files', 'biomecheck-snapshots', 'biomecheck-reports')
  and owner_id = (select auth.uid()::text)
);
