-- Phase 4: Video submissions, storage policies, parent video gate
-- Run after 003_phase3_workflow.sql
-- Create bucket "submissions" in Supabase Dashboard (private) before applying storage policies.

create table if not exists public.video_submissions (
  id uuid primary key default gen_random_uuid(),
  progress_id uuid not null references public.student_progress(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  duration_sec int,
  file_size bigint,
  mime_type text not null default 'video/webm',
  parent_approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (progress_id)
);

create index if not exists idx_video_submissions_student on public.video_submissions(student_id);
create index if not exists idx_video_submissions_progress on public.video_submissions(progress_id);
create index if not exists idx_video_submissions_parent_pending
  on public.video_submissions(student_id) where parent_approved_at is null;

alter table public.video_submissions enable row level security;

-- Students: own submissions
create policy "video_select_student"
  on public.video_submissions for select
  using (student_id = auth.uid());

create policy "video_insert_student"
  on public.video_submissions for insert
  with check (student_id = auth.uid());

create policy "video_update_student"
  on public.video_submissions for update
  using (student_id = auth.uid());

-- Parents: linked children, only metadata until they approve (playback via signed URL function)
create policy "video_select_parent"
  on public.video_submissions for select
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.parent_id = auth.uid() and psl.student_id = video_submissions.student_id
    )
  );

create policy "video_update_parent"
  on public.video_submissions for update
  using (
    exists (
      select 1 from public.parent_student_links psl
      where psl.parent_id = auth.uid() and psl.student_id = video_submissions.student_id
    )
  );

-- Instructors: only parent-approved videos for roster students
create policy "video_select_instructor"
  on public.video_submissions for select
  using (
    parent_approved_at is not null
    and exists (
      select 1 from public.instructor_students ins
      where ins.instructor_id = auth.uid() and ins.student_id = video_submissions.student_id
    )
  );

-- Attach video to progress (student) — sets status to submitted
create or replace function public.attach_video_submission(
  p_progress_id uuid,
  p_storage_path text,
  p_thumbnail_path text default null,
  p_duration_sec int default null,
  p_file_size bigint default null,
  p_mime_type text default 'video/webm'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_progress public.student_progress%rowtype;
  v_video public.video_submissions%rowtype;
begin
  select * into v_progress from public.student_progress
  where id = p_progress_id and student_id = v_student_id
  for update;

  if not found then
    raise exception 'Progress record not found';
  end if;

  if v_progress.status not in ('attempted', 'parent_verified', 'denied', 'submitted') then
    raise exception 'Cannot attach video in current status';
  end if;

  insert into public.video_submissions (
    progress_id, student_id, requirement_id,
    storage_path, thumbnail_path, duration_sec, file_size, mime_type
  )
  values (
    p_progress_id, v_student_id, v_progress.requirement_id,
    p_storage_path, p_thumbnail_path, p_duration_sec, p_file_size, p_mime_type
  )
  on conflict (progress_id) do update set
    storage_path = excluded.storage_path,
    thumbnail_path = excluded.thumbnail_path,
    duration_sec = excluded.duration_sec,
    file_size = excluded.file_size,
    mime_type = excluded.mime_type,
    parent_approved_at = null,
    created_at = now()
  returning * into v_video;

  update public.student_progress set
    status = 'submitted'::public.progress_status,
    updated_at = now()
  where id = p_progress_id;

  return json_build_object('video', row_to_json(v_video));
end;
$$;

-- Parent approves video before instructor can view
create or replace function public.parent_approve_video(p_video_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_id uuid := auth.uid();
  v_video public.video_submissions%rowtype;
begin
  select vs.* into v_video
  from public.video_submissions vs
  join public.parent_student_links psl
    on psl.student_id = vs.student_id and psl.parent_id = v_parent_id
  where vs.id = p_video_id
  for update of vs;

  if not found then
    raise exception 'Video not found';
  end if;

  update public.video_submissions set
    parent_approved_at = now()
  where id = p_video_id
  returning * into v_video;

  return json_build_object('video', row_to_json(v_video));
end;
$$;

grant execute on function public.attach_video_submission(uuid, text, text, int, bigint, text) to authenticated;
grant execute on function public.parent_approve_video(uuid) to authenticated;

-- Storage policies (run after creating private bucket "submissions")
-- insert into storage.buckets (id, name, public) values ('submissions', 'submissions', false) on conflict do nothing;

create policy "submissions_student_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'submissions'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "submissions_student_read_own"
  on storage.objects for select
  using (
    bucket_id = 'submissions'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "submissions_parent_read_linked"
  on storage.objects for select
  using (
    bucket_id = 'submissions'
    and exists (
      select 1 from public.parent_student_links psl
      where psl.parent_id = auth.uid()
        and psl.student_id::text = (storage.foldername(name))[1]
    )
  );

create policy "submissions_instructor_read_approved"
  on storage.objects for select
  using (
    bucket_id = 'submissions'
    and exists (
      select 1 from public.video_submissions vs
      join public.instructor_students ins on ins.student_id = vs.student_id
      where ins.instructor_id = auth.uid()
        and vs.parent_approved_at is not null
        and vs.storage_path = name
    )
  );
