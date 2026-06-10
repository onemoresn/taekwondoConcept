-- Phase 3: Progress workflow, notifications, email hooks
-- Run after 002_phase2_curriculum.sql

alter table public.student_progress
  add column if not exists student_note text,
  add column if not exists parent_note text,
  add column if not exists instructor_feedback text,
  add column if not exists attempted_at timestamptz,
  add column if not exists parent_verified_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  link_path text,
  read_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id) where read_at is null;
create index if not exists idx_student_progress_status on public.student_progress(status);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Student can insert/update own progress (attempt)
create policy "student_progress_insert_own"
  on public.student_progress for insert
  with check (student_id = auth.uid());

create policy "student_progress_update_own"
  on public.student_progress for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- Parent can update linked student progress
create policy "student_progress_update_parent"
  on public.student_progress for update
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.parent_id = auth.uid() and psl.student_id = student_progress.student_id
    )
  );

-- Mark requirement attempted (student)
create or replace function public.mark_requirement_attempted(
  p_requirement_id uuid,
  p_note text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_row public.student_progress%rowtype;
  v_req public.requirements%rowtype;
  v_student public.profiles%rowtype;
begin
  if v_student_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_student from public.profiles where id = v_student_id;
  if v_student.role is distinct from 'student'::public.user_role then
    raise exception 'Only students can mark requirements attempted';
  end if;

  select * into v_req from public.requirements where id = p_requirement_id and published = true;
  if not found then
    raise exception 'Requirement not found';
  end if;

  insert into public.student_progress (
    student_id, requirement_id, status, student_note, attempted_at
  )
  values (
    v_student_id, p_requirement_id, 'attempted'::public.progress_status, p_note, now()
  )
  on conflict (student_id, requirement_id) do update set
    status = case
      when student_progress.status in ('not_started', 'denied') then 'attempted'::public.progress_status
      else student_progress.status
    end,
    student_note = coalesce(p_note, student_progress.student_note),
    attempted_at = case
      when student_progress.status in ('not_started', 'denied') then now()
      else student_progress.attempted_at
    end,
    instructor_feedback = case
      when student_progress.status = 'denied' then null
      else student_progress.instructor_feedback
    end,
    updated_at = now()
  returning * into v_row;

  if v_row.status <> 'attempted' then
    raise exception 'Requirement cannot be marked attempted in current status';
  end if;

  return json_build_object(
    'progress', row_to_json(v_row),
    'requirement_title', v_req.title
  );
end;
$$;

-- Parent verify or reject
create or replace function public.parent_verify_progress(
  p_progress_id uuid,
  p_verified boolean,
  p_note text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_id uuid := auth.uid();
  v_row public.student_progress%rowtype;
  v_req public.requirements%rowtype;
begin
  if v_parent_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles where id = v_parent_id and role = 'parent'
  ) then
    raise exception 'Only parents can verify progress';
  end if;

  select sp.* into v_row
  from public.student_progress sp
  join public.parent_student_links psl on psl.student_id = sp.student_id and psl.parent_id = v_parent_id
  where sp.id = p_progress_id
  for update of sp;

  if not found then
    raise exception 'Progress record not found';
  end if;

  if v_row.status <> 'attempted' then
    raise exception 'Only attempted items can be verified';
  end if;

  update public.student_progress set
    status = case when p_verified then 'parent_verified'::public.progress_status else 'not_started'::public.progress_status end,
    parent_note = p_note,
    parent_verified_at = case when p_verified then now() else null end,
    updated_at = now()
  where id = p_progress_id
  returning * into v_row;

  select * into v_req from public.requirements where id = v_row.requirement_id;

  return json_build_object(
    'progress', row_to_json(v_row),
    'requirement_title', v_req.title,
    'verified', p_verified
  );
end;
$$;

-- Instructor approve or deny
create or replace function public.instructor_review_progress(
  p_progress_id uuid,
  p_approved boolean,
  p_feedback text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_instructor_id uuid := auth.uid();
  v_row public.student_progress%rowtype;
  v_req public.requirements%rowtype;
begin
  if v_instructor_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles where id = v_instructor_id and role = 'instructor'
  ) then
    raise exception 'Only instructors can review progress';
  end if;

  select sp.* into v_row
  from public.student_progress sp
  join public.instructor_students ins on ins.student_id = sp.student_id and ins.instructor_id = v_instructor_id
  where sp.id = p_progress_id
    and sp.status in ('parent_verified', 'submitted')
  for update of sp;

  if not found then
    raise exception 'Progress record not found or not ready for review';
  end if;

  update public.student_progress set
    status = case when p_approved then 'instructor_approved'::public.progress_status else 'denied'::public.progress_status end,
    instructor_feedback = p_feedback,
    reviewed_at = now(),
    updated_at = now()
  where id = p_progress_id
  returning * into v_row;

  select * into v_req from public.requirements where id = v_row.requirement_id;

  return json_build_object(
    'progress', row_to_json(v_row),
    'requirement_title', v_req.title,
    'approved', p_approved
  );
end;
$$;

-- Helper: create notification (called from edge function or app with service role; also usable by authenticated users for own inserts via RPC wrapper)
create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link_path text default null,
  p_metadata jsonb default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, link_path, metadata)
  values (p_user_id, p_type, p_title, p_body, p_link_path, p_metadata)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.mark_requirement_attempted(uuid, text) to authenticated;
grant execute on function public.parent_verify_progress(uuid, boolean, text) to authenticated;
grant execute on function public.instructor_review_progress(uuid, boolean, text) to authenticated;
