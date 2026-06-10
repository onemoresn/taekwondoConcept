-- Phase 1: Auth, profiles, role links
-- Run in Supabase SQL Editor or via CLI: supabase db push

-- Extensions
create extension if not exists "pgcrypto";

-- Schools (multi-tenant foundation)
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- User roles
do $$ begin
  create type public.user_role as enum ('student', 'parent', 'instructor');
exception
  when duplicate_object then null;
end $$;

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  avatar_url text,
  notification_email text,
  school_id uuid references public.schools(id) on delete set null,
  belt_id text not null default 'white',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Parent ↔ student links
create table if not exists public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  relationship text not null default 'parent',
  created_at timestamptz not null default now(),
  unique (parent_id, student_id),
  check (parent_id <> student_id)
);

-- Instructor ↔ student roster
create table if not exists public.instructor_students (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (instructor_id, student_id),
  check (instructor_id <> student_id)
);

-- Invite codes for parent linking (student or instructor generates)
create table if not exists public.link_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_school on public.profiles(school_id);
create index if not exists idx_parent_links_parent on public.parent_student_links(parent_id);
create index if not exists idx_parent_links_student on public.parent_student_links(student_id);
create index if not exists idx_instructor_students_instructor on public.instructor_students(instructor_id);
create index if not exists idx_link_codes_code on public.link_codes(code);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role public.user_role;
  user_name text;
begin
  user_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.user_role,
    'student'::public.user_role
  );
  user_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, role, full_name, notification_email)
  values (new.id, user_role, user_name, new.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Redeem parent link code (atomic)
create or replace function public.redeem_link_code(p_code text, p_parent_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.link_codes%rowtype;
  v_parent_role public.user_role;
begin
  select role into v_parent_role from public.profiles where id = p_parent_id;
  if v_parent_role is distinct from 'parent'::public.user_role then
    raise exception 'Only parents can redeem link codes';
  end if;

  select * into v_link
  from public.link_codes
  where upper(code) = upper(p_code)
    and used_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invalid or expired link code';
  end if;

  insert into public.parent_student_links (parent_id, student_id)
  values (p_parent_id, v_link.student_id)
  on conflict (parent_id, student_id) do nothing;

  update public.link_codes
  set used_by = p_parent_id, used_at = now()
  where id = v_link.id;

  return json_build_object(
    'student_id', v_link.student_id,
    'linked', true
  );
end;
$$;

-- Find profile by email (for instructor roster lookup)
create or replace function public.find_profile_by_email(p_email text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  select * into v_profile
  from public.profiles
  where lower(notification_email) = lower(p_email)
     or exists (
       select 1 from auth.users u
       where u.id = profiles.id and lower(u.email) = lower(p_email)
     )
  limit 1;

  if not found then
    return null;
  end if;

  return json_build_object(
    'id', v_profile.id,
    'full_name', v_profile.full_name,
    'belt_id', v_profile.belt_id,
    'role', v_profile.role,
    'notification_email', v_profile.notification_email
  );
end;
$$;

-- RLS
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.instructor_students enable row level security;
alter table public.link_codes enable row level security;

-- Profiles: read own; instructors read roster students; parents read linked children
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_select_linked_for_parent"
  on public.profiles for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.parent_id = auth.uid() and psl.student_id = profiles.id
    )
  );

create policy "profiles_select_roster_for_instructor"
  on public.profiles for select
  using (
    exists (
      select 1 from public.instructor_students ins
      where ins.instructor_id = auth.uid() and ins.student_id = profiles.id
    )
  );

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Parent links
create policy "parent_links_select_own"
  on public.parent_student_links for select
  using (parent_id = auth.uid() or student_id = auth.uid());

create policy "parent_links_insert_parent"
  on public.parent_student_links for insert
  with check (parent_id = auth.uid());

-- Instructor roster
create policy "instructor_students_select"
  on public.instructor_students for select
  using (instructor_id = auth.uid() or student_id = auth.uid());

create policy "instructor_students_insert"
  on public.instructor_students for insert
  with check (
    instructor_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
  );

create policy "instructor_students_delete"
  on public.instructor_students for delete
  using (instructor_id = auth.uid());

-- Link codes: students/instructors create; parents redeem via RPC
create policy "link_codes_select_involved"
  on public.link_codes for select
  using (
    created_by = auth.uid()
    or student_id = auth.uid()
    or used_by = auth.uid()
  );

create policy "link_codes_insert_creator"
  on public.link_codes for insert
  with check (
    created_by = auth.uid()
    and (
      student_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
    )
  );

-- Seed default school (optional)
insert into public.schools (name)
select 'Demo Dojang'
where not exists (select 1 from public.schools where name = 'Demo Dojang');
