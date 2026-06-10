-- Phase 2: Belt curriculum, requirements, student progress
-- Run after 001_phase1_auth.sql

-- Requirement types
do $$ begin
  create type public.requirement_type as enum (
    'technique', 'form', 'self_defense', 'terminology', 'conditioning', 'leadership'
  );
exception when duplicate_object then null;
end $$;

-- Progress status (used for progress bar; full workflow in Phase 3)
do $$ begin
  create type public.progress_status as enum (
    'not_started', 'attempted', 'parent_verified', 'submitted', 'instructor_approved', 'denied'
  );
exception when duplicate_object then null;
end $$;

-- Belt ranks per school
create table if not exists public.belt_ranks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  slug text not null,
  name text not null,
  korean text,
  color text not null,
  text_color text not null default '#1a1a1a',
  sort_order int not null default 0,
  rank_number int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, slug)
);

-- Requirements per belt
create table if not exists public.requirements (
  id uuid primary key default gen_random_uuid(),
  belt_rank_id uuid not null references public.belt_ranks(id) on delete cascade,
  slug text not null,
  type public.requirement_type not null,
  title text not null,
  description text,
  sort_order int not null default 0,
  content jsonb not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (belt_rank_id, slug)
);

-- Student progress per requirement
create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  status public.progress_status not null default 'not_started',
  updated_at timestamptz not null default now(),
  unique (student_id, requirement_id)
);

-- Student belt flags (tips, stripes, test readiness)
alter table public.profiles
  add column if not exists tips int not null default 0,
  add column if not exists stripes int not null default 0,
  add column if not exists test_ready boolean not null default false;

create index if not exists idx_belt_ranks_school on public.belt_ranks(school_id);
create index if not exists idx_belt_ranks_slug on public.belt_ranks(slug);
create index if not exists idx_requirements_belt on public.requirements(belt_rank_id);
create index if not exists idx_student_progress_student on public.student_progress(student_id);
create index if not exists idx_student_progress_requirement on public.student_progress(requirement_id);

-- updated_at triggers
drop trigger if exists belt_ranks_updated_at on public.belt_ranks;
create trigger belt_ranks_updated_at
  before update on public.belt_ranks
  for each row execute function public.set_updated_at();

drop trigger if exists requirements_updated_at on public.requirements;
create trigger requirements_updated_at
  before update on public.requirements
  for each row execute function public.set_updated_at();

drop trigger if exists student_progress_updated_at on public.student_progress;
create trigger student_progress_updated_at
  before update on public.student_progress
  for each row execute function public.set_updated_at();

-- RLS
alter table public.belt_ranks enable row level security;
alter table public.requirements enable row level security;
alter table public.student_progress enable row level security;

-- Belt ranks & requirements: readable by authenticated users in same school (or all for demo school)
create policy "belt_ranks_select_authenticated"
  on public.belt_ranks for select
  using (auth.uid() is not null);

create policy "belt_ranks_instructor_all"
  on public.belt_ranks for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
  );

create policy "requirements_select_published"
  on public.requirements for select
  using (
    published = true
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
  );

create policy "requirements_instructor_all"
  on public.requirements for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor')
  );

-- Student progress: own row; parents see linked; instructors see roster
create policy "student_progress_select_own"
  on public.student_progress for select
  using (student_id = auth.uid());

create policy "student_progress_select_parent"
  on public.student_progress for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.parent_id = auth.uid() and psl.student_id = student_progress.student_id
    )
  );

create policy "student_progress_select_instructor"
  on public.student_progress for select
  using (
    exists (
      select 1 from public.instructor_students ins
      where ins.instructor_id = auth.uid() and ins.student_id = student_progress.student_id
    )
  );

create policy "student_progress_update_instructor"
  on public.student_progress for update
  using (
    exists (
      select 1 from public.instructor_students ins
      where ins.instructor_id = auth.uid() and ins.student_id = student_progress.student_id
    )
  );

-- Instructors can update tips/stripes/test_ready on roster students
create policy "profiles_instructor_update_roster_flags"
  on public.profiles for update
  using (
    exists (
      select 1 from public.instructor_students ins
      where ins.instructor_id = auth.uid() and ins.student_id = profiles.id
    )
  )
  with check (
    exists (
      select 1 from public.instructor_students ins
      where ins.instructor_id = auth.uid() and ins.student_id = profiles.id
    )
  );

-- Seed curriculum for Demo Dojang (idempotent)
do $$
declare
  v_school_id uuid;
  v_belt_id uuid;
  v_belt record;
  v_req record;
begin
  select id into v_school_id from public.schools where name = 'Demo Dojang' limit 1;
  if v_school_id is null then
    insert into public.schools (name) values ('Demo Dojang') returning id into v_school_id;
  end if;

  for v_belt in
    select * from (values
      ('white', 'White Belt', 'Huin Ddi', '#f5f5f5', '#1a1a1a', 1, 10),
      ('yellow', 'Yellow Belt', 'Norang Ddi', '#f5c518', '#1a1a1a', 2, 9),
      ('green', 'Green Belt', 'Chorok Ddi', '#22a852', '#ffffff', 3, 7),
      ('blue', 'Blue Belt', 'Cheong Ddi', '#2563eb', '#ffffff', 4, 5),
      ('red', 'Red Belt', 'Bulg Ddi', '#dc2626', '#ffffff', 5, 3),
      ('black', 'Black Belt', 'Geom Ddi', '#1a1a1a', '#d4af37', 6, 1)
    ) as t(slug, name, korean, color, text_color, sort_order, rank_number)
  loop
    insert into public.belt_ranks (school_id, slug, name, korean, color, text_color, sort_order, rank_number)
    values (v_school_id, v_belt.slug, v_belt.name, v_belt.korean, v_belt.color, v_belt.text_color, v_belt.sort_order, v_belt.rank_number)
    on conflict (school_id, slug) do update set
      name = excluded.name,
      korean = excluded.korean,
      color = excluded.color,
      text_color = excluded.text_color,
      sort_order = excluded.sort_order,
      rank_number = excluded.rank_number;
  end loop;

  -- Yellow belt requirements (full seed; other belts seeded via app on first instructor publish)
  select id into v_belt_id from public.belt_ranks where school_id = v_school_id and slug = 'yellow';

  if v_belt_id is not null then
    insert into public.requirements (belt_rank_id, slug, type, title, description, sort_order, content, published)
    values
      (v_belt_id, 'y-form-1', 'form', 'Taegeuk Il Jang', '18 movements — Keon (heaven, creation)', 1,
        '{"korean":"태극 1장","meaning":"Keon — symbolizes heaven and the beginning","steps":[{"n":1,"text":"Turn left 90°, walking stance, low block"},{"n":2,"text":"Step forward, middle punch (Kihap)"}]}'::jsonb, true),
      (v_belt_id, 'y-tech-1', 'technique', 'Front kick (Ap Chagi)', '10 reps each leg with chamber', 2,
        '{"korean":"Ap Chagi","keyPoints":["Chamber knee to chest","Snap lower leg, re-chamber before landing"]}'::jsonb, true),
      (v_belt_id, 'y-term-1', 'terminology', 'Basic commands', 'Class control vocabulary', 3,
        '{"cards":[{"korean":"Charyeot","english":"Attention"},{"korean":"Baro","english":"Return to ready"},{"korean":"Kihap","english":"Spirit yell"}]}'::jsonb, true),
      (v_belt_id, 'y-cond-1', 'conditioning', 'Horse stance hold', '30 seconds × 3 sets', 4,
        '{"category":"stance","durationSec":30,"sets":3}'::jsonb, true),
      (v_belt_id, 'y-lead-1', 'leadership', 'Lead warm-up', 'Lead class stretch once', 5,
        '{"checklist":["Lead 5-minute warm-up","Demonstrate respect to Sabomnim"]}'::jsonb, true)
    on conflict (belt_rank_id, slug) do nothing;
  end if;
end $$;
