import { supabase } from '../lib/supabaseClient';
import { isDemoAuthMode } from '../lib/authConfig';
import { PROGRESS_STATUS } from '../constants/roles';
import { DEMO_STUDENT } from '../data/demoData';
import { fetchProgressRecords, progressRecordsToMap } from './workflowService';

const DEMO_FLAGS_KEY = 'dojang-student-flags';

function loadDemoFlags(studentId) {
  try {
    const raw = localStorage.getItem(`${DEMO_FLAGS_KEY}-${studentId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through */
  }
  if (studentId === DEMO_STUDENT.id || studentId === 'demo-student-id') {
    return { tips: DEMO_STUDENT.tips, stripes: DEMO_STUDENT.stripes, test_ready: DEMO_STUDENT.testReady };
  }
  return { tips: 0, stripes: 0, test_ready: false };
}

function saveDemoFlags(studentId, flags) {
  localStorage.setItem(`${DEMO_FLAGS_KEY}-${studentId}`, JSON.stringify(flags));
}

export async function fetchStudentProgress(studentId) {
  const records = await fetchProgressRecords(studentId);
  return progressRecordsToMap(records);
}

export async function fetchStudentProgressRecords(studentId) {
  return fetchProgressRecords(studentId);
}

export async function updateStudentBeltFlags(studentId, flags) {
  if (isDemoAuthMode()) {
    const current = loadDemoFlags(studentId);
    const next = { ...current, ...flags };
    saveDemoFlags(studentId, next);
    return next;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(flags)
    .eq('id', studentId)
    .select('tips, stripes, test_ready')
    .single();
  if (error) throw error;
  return data;
}

export async function fetchStudentBeltFlags(studentId) {
  if (isDemoAuthMode()) {
    return loadDemoFlags(studentId);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('tips, stripes, test_ready')
    .eq('id', studentId)
    .single();
  if (error) throw error;
  return {
    tips: data.tips ?? 0,
    stripes: data.stripes ?? 0,
    test_ready: data.test_ready ?? false,
  };
}

export function resolveProgressMap(requirements, rawMap) {
  const map = {};
  requirements.forEach((r) => {
    map[r.id] = rawMap[r.id] ?? rawMap[r.slug] ?? 'not_started';
  });
  return map;
}

export { PROGRESS_STATUS };
