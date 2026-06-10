import { supabase } from '../lib/supabaseClient';
import { isDemoAuthMode } from '../lib/authConfig';
import { PROGRESS_STATUS } from '../constants/roles';
import { DEMO_STUDENT } from '../data/demoData';

const DEMO_RECORDS_KEY = 'dojang-progress-records';

function demoStudentKey(studentId) {
  if (studentId === 'demo-student-id') return DEMO_STUDENT.id;
  return studentId;
}

function loadDemoRecords(studentId) {
  const key = demoStudentKey(studentId);
  try {
    const raw = localStorage.getItem(`${DEMO_RECORDS_KEY}-${key}`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through */
  }

  if (key === DEMO_STUDENT.id) {
    return Object.entries(DEMO_STUDENT.progress).map(([slug, status]) => ({
      id: `demo-progress-${slug}`,
      student_id: key,
      requirement_id: `demo-req-${slug}`,
      requirement_slug: slug,
      status,
      student_note: status === PROGRESS_STATUS.ATTEMPTED ? 'Practiced at home' : null,
      parent_note: null,
      instructor_feedback: status === PROGRESS_STATUS.DENIED ? 'Keep practicing — check chamber height.' : null,
      attempted_at: status !== PROGRESS_STATUS.NOT_STARTED ? new Date().toISOString() : null,
      parent_verified_at: [PROGRESS_STATUS.PARENT_VERIFIED, PROGRESS_STATUS.APPROVED].includes(status)
        ? new Date().toISOString() : null,
      reviewed_at: status === PROGRESS_STATUS.APPROVED ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }));
  }
  return [];
}

function saveDemoRecords(studentId, records) {
  localStorage.setItem(`${DEMO_RECORDS_KEY}-${demoStudentKey(studentId)}`, JSON.stringify(records));
}

function recordsToStatusMap(records) {
  const map = {};
  records.forEach((r) => {
    map[r.requirement_id] = r.status;
    if (r.requirement_slug) map[r.requirement_slug] = r.status;
  });
  return map;
}

export async function fetchProgressRecords(studentId) {
  if (isDemoAuthMode()) {
    return loadDemoRecords(studentId);
  }

  const { data, error } = await supabase
    .from('student_progress')
    .select(`
      *,
      requirements ( id, slug, title, description, type, belt_rank_id,
        belt_ranks ( slug, name )
      )
    `)
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchProgressRecord(studentId, requirementId, requirementSlug) {
  const records = await fetchProgressRecords(studentId);
  return records.find(
    (r) => r.requirement_id === requirementId
      || r.requirement_slug === requirementSlug
      || r.requirements?.slug === requirementSlug
  ) ?? null;
}

export async function markRequirementAttempted(studentId, requirementId, requirementSlug, note) {
  if (isDemoAuthMode()) {
    const records = loadDemoRecords(studentId);
    const slug = requirementSlug ?? requirementId.replace('demo-req-', '');
    const existing = records.find((r) => r.requirement_id === requirementId || r.requirement_slug === slug);
    const currentStatus = existing?.status ?? PROGRESS_STATUS.NOT_STARTED;

    if (![PROGRESS_STATUS.NOT_STARTED, PROGRESS_STATUS.DENIED].includes(currentStatus)) {
      throw new Error('This requirement cannot be marked attempted in its current status');
    }

    const row = {
      id: existing?.id ?? `demo-progress-${slug}`,
      student_id: demoStudentKey(studentId),
      requirement_id: requirementId,
      requirement_slug: slug,
      status: PROGRESS_STATUS.ATTEMPTED,
      student_note: note ?? null,
      parent_note: null,
      instructor_feedback: null,
      attempted_at: new Date().toISOString(),
      parent_verified_at: null,
      reviewed_at: null,
      updated_at: new Date().toISOString(),
    };

    const next = existing
      ? records.map((r) => (r.id === row.id ? row : r))
      : [...records, row];
    saveDemoRecords(studentId, next);
    return { progress: row, requirement_title: slug };
  }

  const { data, error } = await supabase.rpc('mark_requirement_attempted', {
    p_requirement_id: requirementId,
    p_note: note ?? null,
  });
  if (error) throw error;
  return data;
}

export async function parentVerifyProgress(progressId, verified, note) {
  if (isDemoAuthMode()) {
    const allKeys = [DEMO_STUDENT.id, 'demo-student-id'];
    for (const key of allKeys) {
      const records = loadDemoRecords(key);
      const idx = records.findIndex((r) => r.id === progressId);
      if (idx === -1) continue;
      if (records[idx].status !== PROGRESS_STATUS.ATTEMPTED) {
        throw new Error('Only attempted items can be verified');
      }
      records[idx] = {
        ...records[idx],
        status: verified ? PROGRESS_STATUS.PARENT_VERIFIED : PROGRESS_STATUS.NOT_STARTED,
        parent_note: note ?? null,
        parent_verified_at: verified ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      saveDemoRecords(key, records);
      return { progress: records[idx], verified };
    }
    throw new Error('Progress record not found');
  }

  const { data, error } = await supabase.rpc('parent_verify_progress', {
    p_progress_id: progressId,
    p_verified: verified,
    p_note: note ?? null,
  });
  if (error) throw error;
  return data;
}

export async function instructorReviewProgress(progressId, approved, feedback) {
  if (isDemoAuthMode()) {
    const allKeys = [DEMO_STUDENT.id, 'demo-student-id'];
    for (const key of allKeys) {
      const records = loadDemoRecords(key);
      const idx = records.findIndex((r) => r.id === progressId);
      if (idx === -1) continue;
      if (![PROGRESS_STATUS.PARENT_VERIFIED, PROGRESS_STATUS.SUBMITTED].includes(records[idx].status)) {
        throw new Error('Not ready for review');
      }
      records[idx] = {
        ...records[idx],
        status: approved ? PROGRESS_STATUS.APPROVED : PROGRESS_STATUS.DENIED,
        instructor_feedback: feedback ?? null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDemoRecords(key, records);
      return { progress: records[idx], approved };
    }
    throw new Error('Progress record not found');
  }

  const { data, error } = await supabase.rpc('instructor_review_progress', {
    p_progress_id: progressId,
    p_approved: approved,
    p_feedback: feedback ?? null,
  });
  if (error) throw error;
  return data;
}

export async function fetchParentVerificationQueue(parentId) {
  if (isDemoAuthMode()) {
    const { fetchLinkedStudentsForParent } = await import('./profileService');
    const children = await fetchLinkedStudentsForParent(parentId);
    const items = [];
    for (const child of children) {
      const records = loadDemoRecords(child.id);
      records
        .filter((r) => r.status === PROGRESS_STATUS.ATTEMPTED)
        .forEach((r) => {
          items.push({
            ...r,
            student: child,
            requirement: {
              title: slugToTitle(r.requirement_slug),
              description: '',
              slug: r.requirement_slug,
            },
          });
        });
    }
    return items;
  }

  const { data: links, error: linkErr } = await supabase
    .from('parent_student_links')
    .select('student_id, profiles:student_id ( id, full_name, belt_id )')
    .eq('parent_id', parentId);
  if (linkErr) throw linkErr;

  const studentIds = (links ?? []).map((l) => l.student_id);
  if (!studentIds.length) return [];

  const { data, error } = await supabase
    .from('student_progress')
    .select(`
      *,
      requirements ( id, slug, title, description, type ),
      profiles:student_id ( id, full_name, belt_id )
    `)
    .in('student_id', studentIds)
    .eq('status', 'attempted')
    .order('attempted_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    student: row.profiles,
    requirement: row.requirements,
  }));
}

function isReadyForInstructorReview(record, video) {
  if (record.status === PROGRESS_STATUS.PARENT_VERIFIED) return true;
  if (record.status === PROGRESS_STATUS.SUBMITTED) {
    if (!video) return true;
    return Boolean(video.parent_approved_at);
  }
  return false;
}

export async function fetchInstructorReviewQueue(instructorId) {
  if (isDemoAuthMode()) {
    const { loadVideoMeta } = await import('../lib/demoVideoStore');
    const meta = Object.values(loadVideoMeta());
    const records = loadDemoRecords(DEMO_STUDENT.id);
    return records
      .filter((r) => {
        const video = meta.find((v) => v.progress_id === r.id);
        return isReadyForInstructorReview(r, video);
      })
      .map((r) => ({
        ...r,
        student: { id: DEMO_STUDENT.id, full_name: DEMO_STUDENT.name, belt_id: DEMO_STUDENT.beltId },
        requirement: {
          title: slugToTitle(r.requirement_slug),
          description: '',
          slug: r.requirement_slug,
          type: r.requirement_slug?.startsWith('y-form') ? 'form' : 'technique',
        },
      }));
  }

  const { data, error } = await supabase
    .from('student_progress')
    .select(`
      *,
      requirements ( id, slug, title, description, type, belt_ranks ( name ) ),
      profiles:student_id ( id, full_name, belt_id ),
      video_submissions ( id, parent_approved_at, storage_path )
    `)
    .in('status', ['parent_verified', 'submitted'])
    .order('parent_verified_at', { ascending: true });
  if (error) throw error;

  const { data: roster } = await supabase
    .from('instructor_students')
    .select('student_id')
    .eq('instructor_id', instructorId);
  const rosterIds = new Set((roster ?? []).map((r) => r.student_id));

  return (data ?? [])
    .filter((row) => rosterIds.has(row.student_id))
    .filter((row) => {
      const video = Array.isArray(row.video_submissions)
        ? row.video_submissions[0]
        : row.video_submissions;
      return isReadyForInstructorReview(row, video);
    })
    .map((row) => ({
      ...row,
      student: row.profiles,
      requirement: row.requirements,
    }));
}

function slugToTitle(slug) {
  const titles = {
    'y-form-1': 'Taegeuk Il Jang',
    'y-tech-1': 'Front kick (Ap Chagi)',
    'y-term-1': 'Basic commands',
    'y-cond-1': 'Horse stance hold',
    'y-lead-1': 'Lead warm-up',
  };
  return titles[slug] ?? slug;
}

export function progressRecordsToMap(records) {
  const map = {};
  records.forEach((r) => {
    const slug = r.requirement_slug ?? r.requirements?.slug;
    map[r.requirement_id] = r.status;
    if (slug) map[slug] = r.status;
  });
  return map;
}

export { recordsToStatusMap, PROGRESS_STATUS };
